import { Sale, ISale } from './sale.model.js'
import { Product } from '../products/product.model.js'
import { StockMovement } from '../stock/stockMovement.model.js'
import { Income } from '../finance/income.model.js'

interface CreateSaleInput {
  date?: Date
  customerName?: string
  customerPhone?: string
  items: Array<{
    productId: string
    quantity: number
    unitPrice?: number
  }>
  paymentMethod: 'cash' | 'transfer' | 'card'
}

interface SaleFilters {
  startDate?: string
  endDate?: string
  employeeId?: string
  status?: string
  paymentMethod?: string
  paymentStatus?: string
}

interface RecordPaymentInput {
  amount: number
  method: 'cash' | 'transfer' | 'card'
  reference?: string
}

export async function createSale(data: CreateSaleInput, userId: string) {
  const saleItems: ISale['items'] = []
  let total = 0

  for (const item of data.items) {
    const product = await Product.findById(item.productId)
    if (!product) {
      throw { status: 404, message: `Producto no encontrado: ${item.productId}` }
    }
    if (!product.active) {
      throw { status: 400, message: `Producto inactivo: ${product.name}` }
    }
    if (product.stockQuantity <= 0) {
      throw { status: 400, message: `Producto agotado: ${product.name}` }
    }
    if (item.quantity <= 0) {
      throw { status: 400, message: 'La cantidad debe ser mayor a cero' }
    }
    if (item.quantity > product.stockQuantity) {
      throw {
        status: 400,
        message: `Stock insuficiente para ${product.name}. Disponible: ${product.stockQuantity}${product.saleUnit === 'meter' ? 'm' : product.saleUnit === 'centimeter' ? 'cm' : 'uds'}`,
      }
    }
    const unitPrice = item.unitPrice ?? product.salePrice
    const subtotal = Math.round(item.quantity * unitPrice * 100) / 100
    saleItems.push({
      productId: product._id,
      productName: product.name,
      saleUnit: product.saleUnit,
      quantity: item.quantity,
      unitPrice,
      subtotal,
    })
    total += subtotal
  }
  total = Math.round(total * 100) / 100

  const sale = new Sale({
    date: data.date || new Date(),
    employeeId: userId,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    items: saleItems,
    paymentMethod: data.paymentMethod,
    total,
  })
  await sale.save()

  for (const item of saleItems) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stockQuantity: -item.quantity },
    })
    await StockMovement.create({
      productId: item.productId,
      type: 'sale_out',
      quantity: -item.quantity,
      unit: item.saleUnit,
      referenceId: sale._id.toString(),
      userId,
    })
  }

  return sale.populate('employeeId', 'fullName')
}

export async function listSales(filters: SaleFilters, userId: string, role: string) {
  const query: Record<string, unknown> = {}
  if (role === 'employee') { query.employeeId = userId }
  if (filters.employeeId && role === 'admin') { query.employeeId = filters.employeeId }
  if (filters.startDate || filters.endDate) {
    const dateFilter: Record<string, Date> = {}
    if (filters.startDate) dateFilter.$gte = new Date(filters.startDate)
    if (filters.endDate) dateFilter.$lt = new Date(filters.endDate)
    query.date = dateFilter
  }
  if (filters.status) { query.status = filters.status }
  if (filters.paymentMethod) { query.paymentMethod = filters.paymentMethod }
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
  return Sale.find(query).sort({ date: -1 }).populate('employeeId', 'fullName')
}

export async function getSaleById(id: string) {
  const sale = await Sale.findById(id).populate('employeeId', 'fullName')
  if (!sale) throw { status: 404, message: 'Venta no encontrada' }
  return sale
}

export async function voidSale(id: string, reason: string, userId: string) {
  if (!reason) throw { status: 400, message: 'El motivo de anulación es obligatorio' }
  const sale = await Sale.findById(id)
  if (!sale) throw { status: 404, message: 'Venta no encontrada' }
  if (sale.status === 'voided') throw { status: 400, message: 'La venta ya está anulada' }
  if (sale.closed) throw { status: 400, message: 'No se puede anular una venta cerrada' }

  sale.status = 'voided'
  sale.voidedReason = reason
  await sale.save()

  for (const item of sale.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stockQuantity: item.quantity },
    })
    await StockMovement.create({
      productId: item.productId,
      type: 'manual_adjustment',
      quantity: item.quantity,
      unit: item.saleUnit,
      reason: `Reversión por anulación de venta: ${reason}`,
      referenceId: sale._id.toString(),
      userId,
    })
  }

  await Income.deleteOne({ referenceId: sale._id.toString(), source: 'sale' })
  return sale
}

export async function recordPayment(saleId: string, userId: string, input: RecordPaymentInput) {
  if (!input.amount || input.amount <= 0) {
    throw { status: 400, message: 'El monto debe ser mayor a cero' }
  }

  const sale = await Sale.findById(saleId)
  if (!sale) throw { status: 404, message: 'Venta no encontrada' }
  if (sale.status === 'voided') throw { status: 400, message: 'No se pueden registrar pagos en una venta anulada' }
  if (sale.closed) throw { status: 400, message: 'No se pueden registrar pagos en una venta cerrada' }

  const newPaid = Math.round((sale.paidAmount + input.amount) * 100) / 100
  if (newPaid > sale.total + 0.001) {
    throw { status: 400, message: 'El total de pagos no puede exceder el valor de la venta' }
  }

  const payment = {
    date: new Date(),
    amount: Math.round(input.amount * 100) / 100,
    method: input.method,
    reference: input.reference,
  }

  sale.payments.push(payment)
  sale.paidAmount = newPaid

  await Income.create({
    date: new Date(),
    source: 'sale',
    referenceId: sale._id.toString(),
    description: `Abono a venta ${sale.customerName ? ` - ${sale.customerName}` : ''}`,
    amount: payment.amount,
  })

  if (newPaid >= sale.total) {
    sale.paymentStatus = 'paid'
  } else {
    sale.paymentStatus = 'partial'
  }

  await sale.save()
  return sale.populate('employeeId', 'fullName')
}

export async function closeSale(saleId: string) {
  const sale = await Sale.findById(saleId)
  if (!sale) throw { status: 404, message: 'Venta no encontrada' }
  if (sale.status === 'voided') throw { status: 400, message: 'No se puede cerrar una venta anulada' }
  if (sale.closed) throw { status: 400, message: 'La venta ya está cerrada' }
  if (sale.paidAmount < sale.total) {
    throw { status: 400, message: 'No se puede cerrar una venta con saldo pendiente' }
  }

  sale.closed = true
  await sale.save()

  return sale.populate('employeeId', 'fullName')
}
