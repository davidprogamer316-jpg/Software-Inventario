import { Sale, ISale } from './sale.model.js'
import { Product } from '../products/product.model.js'
import { StockMovement } from '../stock/stockMovement.model.js'
import { Income } from '../finance/income.model.js'

interface CreateSaleInput {
  date?: Date
  employeeId: string
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
    employeeId: data.employeeId,
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

  await Income.create({
    date: sale.date,
    source: 'sale',
    referenceId: sale._id.toString(),
    description: `Venta #${sale._id}`,
    amount: sale.total,
  })

  return sale.populate('employeeId', 'fullName')
}

export async function listSales(filters: SaleFilters, userId: string, role: string) {
  const query: Record<string, unknown> = {}

  if (role === 'employee') {
    query.employeeId = userId
  }

  if (filters.employeeId && role === 'admin') {
    query.employeeId = filters.employeeId
  }

  if (filters.startDate || filters.endDate) {
    const dateFilter: Record<string, Date> = {}
    if (filters.startDate) dateFilter.$gte = new Date(filters.startDate)
    if (filters.endDate) dateFilter.$lte = new Date(filters.endDate)
    query.date = dateFilter
  }

  if (filters.status) {
    query.status = filters.status
  }

  return Sale.find(query)
    .sort({ date: -1 })
    .populate('employeeId', 'fullName')
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
