import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

export const loginSchema = z.object({
  email: z.string().email('Email inválido').max(100),
  password: z.string().min(1, 'Contraseña requerida').max(100),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida').max(100),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres').max(100),
})

export const productSchema = z.object({
  sku: z.string().min(1, 'SKU requerido').max(50),
  name: z.string().min(1, 'Nombre requerido').max(200),
  category: z.string().min(1, 'Categoría requerida').max(100),
  spec: z.string().max(200).optional(),
  saleUnit: z.enum(['unit', 'meter', 'centimeter']),
  salePrice: z.number().min(0, 'Precio no puede ser negativo'),
  costPrice: z.number().min(0).optional(),
  stockQuantity: z.number().min(0).optional(),
  minStock: z.number().min(0).optional(),
  active: z.boolean().optional(),
})

export const productUpdateSchema = productSchema.partial()

export const providerSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200),
  contactName: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email('Email inválido').max(100).optional().or(z.literal('')),
  address: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
  paymentMethod: z.string().max(100).optional(),
  paymentDetails: z.string().max(300).optional(),
})

export const employeeSchema = z.object({
  fullName: z.string().min(1, 'Nombre requerido').max(200),
  email: z.string().email('Email inválido').max(100).optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  isActive: z.boolean().optional(),
  createUser: z.boolean().optional(),
  password: z.string().max(100).optional(),
})

export const configSchema = z.object({
  companyName: z.string().max(200).optional(),
  nit: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  invoiceFooter: z.string().max(500).optional(),
})

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1).max(200).optional(),
  saleUnit: z.enum(['unit', 'meter', 'centimeter']).optional(),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
  subtotal: z.number().min(0).optional(),
})

export const createSaleSchema = z.object({
  customerName: z.string().max(200).optional(),
  customerPhone: z.string().max(30).optional(),
  items: z.array(saleItemSchema).min(1, 'Al menos un producto requerido'),
  paymentMethod: z.enum(['cash', 'transfer', 'card']),
  notes: z.string().max(500).optional(),
})

export const paymentSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0'),
  method: z.enum(['cash', 'transfer', 'card']),
  reference: z.string().max(100).optional(),
})

export const purchaseItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1).max(200).optional(),
  quantity: z.number().min(0.01),
  unitCost: z.number().min(0).optional(),
  subtotal: z.number().min(0).optional(),
})

export const createPurchaseSchema = z.object({
  providerId: z.string().min(1, 'Proveedor requerido'),
  items: z.array(purchaseItemSchema).min(1, 'Al menos un producto requerido'),
  notes: z.string().max(500).optional(),
})

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const message = result.error.issues[0]?.message || 'Datos inválidos'
      res.status(400).json({ message })
      return
    }
    req.body = result.data
    next()
  }
}
