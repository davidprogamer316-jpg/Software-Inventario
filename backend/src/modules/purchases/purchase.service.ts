import { Purchase, IPurchase } from './purchase.model.js'
import { Provider } from '../providers/provider.model.js'
import { Product } from '../products/product.model.js'
import { StockMovement } from '../stock/stockMovement.model.js'
import { Expense } from '../finance/expense.model.js'

interface CreatePurchaseInput {
  providerId: string
  date?: Date
  items: Array<{
    productId: string
    quantity: number
    unitCost?: number
  }>
  notes?: string
}

interface PurchaseFilters {
  startDate?: string
  endDate?: string
  providerId?: string
  paymentStatus?: string
}

interface RecordPaymentInput {
  amount: number
  method: 'cash' | 'transfer' | 'card'
  reference?: string
}

export async function createPurchase(data: CreatePurchaseInput, userId: string) {
  const provider = await Provider.findById(data.providerId)
  if (!provider) throw { status: 404, message: 'Proveedor no encontrado' }

  const purchaseItems: IPurchase['items'] = []
  let total = 0

  for (const item of data.items) {
    const product = await Product.findById(item.productId)
    if (!product) throw { status: 404, message: `Producto no encontrado: ${item.productId}` }

    const unitCost = item.unitCost ?? 0
    const subtotal = Math.round(item.quantity * unitCost * 100) / 100
    purchaseItems.push({
      productId: product._id,
      productName: product.name,
      saleUnit: product.saleUnit,
      quantity: item.quantity,
      unitCost,
      subtotal,
    })
    total += subtotal
  }

  total = Math.round(total * 100) / 100

  const purchase = new Purchase({
    date: data.date || new Date(),
    providerId: provider._id,
    providerName: provider.name,
    employeeId: userId,
    items: purchaseItems,
    total,
    notes: data.notes,
  })

  await purchase.save()

  for (const item of purchaseItems) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stockQuantity: item.quantity },
    })

    await StockMovement.create({
      productId: item.productId,
      type: 'purchase_in',
      quantity: item.quantity,
      unit: item.saleUnit,
      referenceId: purchase._id.toString(),
      userId,
    })
  }

  return purchase.populate(['providerId', 'employeeId'])
}

export async function listPurchases(filters: PurchaseFilters) {
  const query: Record<string, unknown> = {}

  if (filters.startDate || filters.endDate) {
    const dateFilter: Record<string, Date> = {}
    if (filters.startDate) dateFilter.$gte = new Date(filters.startDate)
    if (filters.endDate) dateFilter.$lt = new Date(filters.endDate)
    query.date = dateFilter
  }

  if (filters.providerId) query.providerId = filters.providerId

  if (filters.paymentStatus) {
    if (filters.paymentStatus === 'pending') {
      query.$or = [
        { paymentStatus: 'pending' },
        { paymentStatus: { $exists: false } },
      ]
    } else {
      query.paymentStatus = filters.paymentStatus
    }
  }

  return Purchase.find(query)
    .sort({ date: -1 })
    .populate(['providerId', 'employeeId'])
}

export async function getPurchaseById(id: string) {
  const purchase = await Purchase.findById(id).populate(['providerId', 'employeeId'])
  if (!purchase) throw { status: 404, message: 'Compra no encontrada' }
  return purchase
}

export async function markAsReceived(id: string) {
  const purchase = await Purchase.findById(id)
  if (!purchase) throw { status: 404, message: 'Compra no encontrada' }
  if (purchase.received) throw { status: 400, message: 'La compra ya fue recibida' }
  if (purchase.paymentStatus !== 'paid') throw { status: 400, message: 'La compra debe estar totalmente pagada antes de recibirla' }

  purchase.received = true
  await purchase.save()
  return purchase.populate(['providerId', 'employeeId'])
}

export async function recordPayment(purchaseId: string, userId: string, input: RecordPaymentInput) {
  if (!input.amount || input.amount <= 0) {
    throw { status: 400, message: 'El monto debe ser mayor a cero' }
  }

  const purchase = await Purchase.findById(purchaseId)
  if (!purchase) throw { status: 404, message: 'Compra no encontrada' }
  if (purchase.closed) throw { status: 400, message: 'No se pueden registrar pagos en una compra cerrada' }

  const newPaid = Math.round((purchase.paidAmount + input.amount) * 100) / 100
  if (newPaid > purchase.total + 0.001) {
    throw { status: 400, message: 'El total de pagos no puede exceder el valor de la compra' }
  }

  const payment = {
    date: new Date(),
    amount: Math.round(input.amount * 100) / 100,
    method: input.method,
    reference: input.reference,
  }

  purchase.payments.push(payment)
  purchase.paidAmount = newPaid

  await Expense.create({
    date: new Date(),
    source: 'purchase',
    referenceId: purchase._id.toString(),
    description: `Abono a compra ${purchase.providerName ? ` - ${purchase.providerName}` : ''}`,
    amount: payment.amount,
  })

  if (newPaid >= purchase.total) {
    purchase.paymentStatus = 'paid'
  } else {
    purchase.paymentStatus = 'partial'
  }

  await purchase.save()
  return purchase.populate(['providerId', 'employeeId'])
}

export async function closePurchase(purchaseId: string) {
  const purchase = await Purchase.findById(purchaseId)
  if (!purchase) throw { status: 404, message: 'Compra no encontrada' }
  if (purchase.closed) throw { status: 400, message: 'La compra ya está cerrada' }
  if (purchase.paidAmount < purchase.total) {
    throw { status: 400, message: 'No se puede cerrar una compra con saldo pendiente' }
  }

  purchase.closed = true
  await purchase.save()

  return purchase.populate(['providerId', 'employeeId'])
}

export async function updatePurchase(id: string, data: { notes?: string }) {
  const purchase = await Purchase.findById(id)
  if (!purchase) throw { status: 404, message: 'Compra no encontrada' }

  if (data.notes !== undefined) purchase.notes = data.notes
  await purchase.save()
  return purchase.populate(['providerId', 'employeeId'])
}

export async function updateItemCosts(id: string, items: Array<{ productId: string; unitCost: number }>) {
  const purchase = await Purchase.findById(id)
  if (!purchase) throw { status: 404, message: 'Compra no encontrada' }

  const costMap = new Map(items.map(i => [i.productId, i.unitCost]))
  let total = 0

  for (const item of purchase.items) {
    const cost = costMap.get(item.productId.toString())
    if (cost !== undefined) {
      item.unitCost = cost
      item.subtotal = Math.round(item.quantity * cost * 100) / 100
    }
    total += item.subtotal
  }

  purchase.total = Math.round(total * 100) / 100
  await purchase.save()

  return purchase.populate(['providerId', 'employeeId'])
}
