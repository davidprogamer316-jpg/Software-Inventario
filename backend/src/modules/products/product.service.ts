import { Product, IProduct } from './product.model.js'
import { StockMovement } from '../stock/stockMovement.model.js'

interface ProductFilters {
  category?: string
  active?: boolean
  lowStock?: boolean
  search?: string
}

export async function listProducts(filters: ProductFilters = {}) {
  const query: Record<string, unknown> = {}

  if (filters.category) query.category = filters.category
  if (filters.active !== undefined) query.active = filters.active
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { sku: { $regex: filters.search, $options: 'i' } },
    ]
  }

  let products = await Product.find(query).sort({ name: 1 }).lean()

  if (filters.lowStock) {
    products = products.filter((p: any) => p.stockQuantity <= p.minStock)
  }

  return products
}

export async function getProductById(id: string) {
  const product = await Product.findById(id)
  if (!product) throw { status: 404, message: 'Producto no encontrado' }
  return product
}

export async function createProduct(data: Partial<IProduct>) {
  const existing = await Product.findOne({ sku: data.sku })
  if (existing) throw { status: 409, message: 'Ya existe un producto con ese SKU' }

  const product = new Product(data)
  return product.save()
}

export async function updateProduct(id: string, data: Partial<IProduct>) {
  if (data.sku) {
    const existing = await Product.findOne({ sku: data.sku, _id: { $ne: id } })
    if (existing) throw { status: 409, message: 'Ya existe un producto con ese SKU' }
  }

  const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true })
  if (!product) throw { status: 404, message: 'Producto no encontrado' }
  return product
}

export async function adjustStock(
  productId: string,
  quantity: number,
  reason: string,
  userId: string
) {
  if (!reason) throw { status: 400, message: 'El motivo del ajuste es obligatorio' }

  const product = await Product.findById(productId)
  if (!product) throw { status: 404, message: 'Producto no encontrado' }

  const newQuantity = product.stockQuantity + quantity
  if (newQuantity < 0) {
    throw { status: 400, message: 'El ajuste resultaría en stock negativo' }
  }

  product.stockQuantity = newQuantity
  await product.save()

  await StockMovement.create({
    productId: product._id,
    type: 'manual_adjustment',
    quantity,
    unit: product.saleUnit,
    reason,
    userId,
  })

  return product
}

export async function getStockHistory(productId: string) {
  return StockMovement.find({ productId }).sort({ date: -1 }).populate('userId', 'fullName')
}

export async function getCategories() {
  return Product.distinct('category', { active: true })
}
