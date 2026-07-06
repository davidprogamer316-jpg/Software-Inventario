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
    unitCost: number
  }>
  paid?: boolean
  notes?: string
}

export async function createPurchase(data: CreatePurchaseInput, userId: string) {
  const provider = await Provider.findById(data.providerId)
  if (!provider) throw { status: 404, message: 'Proveedor no encontrado' }

  const purchaseItems: IPurchase['items'] = []
  let total = 0

  for (const item of data.items) {
    const product = await Product.findById(item.productId)
    if (!product) throw { status: 404, message: `Producto no encontrado: ${item.productId}` }

    const subtotal = Math.round(item.quantity * item.unitCost * 100) / 100
    purchaseItems.push({
      productId: product._id,
      productName: product.name,
      saleUnit: product.saleUnit,
      quantity: item.quantity,
      unitCost: item.unitCost,
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
    paid: data.paid ?? false,
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

  await Expense.create({
    date: purchase.date,
    source: 'purchase',
    referenceId: purchase._id.toString(),
    description: `Compra #${purchase._id} - ${provider.name}`,
    amount: purchase.total,
  })

  return purchase.populate(['providerId', 'employeeId'])
}

export async function listPurchases(filters: { startDate?: string; endDate?: string; providerId?: string }) {
  const query: Record<string, unknown> = {}

  if (filters.startDate || filters.endDate) {
    const dateFilter: Record<string, Date> = {}
    if (filters.startDate) dateFilter.$gte = new Date(filters.startDate)
    if (filters.endDate) dateFilter.$lte = new Date(filters.endDate)
    query.date = dateFilter
  }

  if (filters.providerId) query.providerId = filters.providerId

  return Purchase.find(query)
    .sort({ date: -1 })
    .populate(['providerId', 'employeeId'])
}

export async function getPurchaseById(id: string) {
  const purchase = await Purchase.findById(id).populate(['providerId', 'employeeId'])
  if (!purchase) throw { status: 404, message: 'Compra no encontrada' }
  return purchase
}
