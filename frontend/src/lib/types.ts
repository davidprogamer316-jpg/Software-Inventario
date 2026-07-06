export type Role = 'admin' | 'employee'
export type SaleUnit = 'unit' | 'meter' | 'centimeter'
export type PaymentMethod = 'cash' | 'transfer' | 'card'
export type SaleStatus = 'completed' | 'voided'
export type MovementType = 'sale_out' | 'purchase_in' | 'manual_adjustment'
export type IncomeSource = 'sale' | 'manual'

export interface User {
  _id: string
  email: string
  fullName: string
  role: Role
  employeeId?: string
  active: boolean
  lastLogin?: string
  createdAt: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface Employee {
  _id: string
  fullName: string
  documentId?: string
  phone?: string
  hireDate: string
  active: boolean
  userId: string
}

export interface Product {
  _id: string
  sku: string
  name: string
  category: string
  spec?: string
  saleUnit: SaleUnit
  salePrice: number
  costPrice?: number
  stockQuantity: number
  minStock: number
  providerId?: string
  active: boolean
}

export interface StockMovement {
  _id: string
  productId: string
  type: MovementType
  quantity: number
  reason?: string
  referenceId?: string
  userId: string
  date: string
}

export interface SaleItem {
  productId: string
  productName: string
  saleUnit: SaleUnit
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Sale {
  _id: string
  date: string
  employeeId: string
  customerName?: string
  customerPhone?: string
  items: SaleItem[]
  paymentMethod: PaymentMethod
  total: number
  status: SaleStatus
  voidedReason?: string
}

export interface Invoice {
  _id: string
  invoiceNumber: string
  saleId: string
  customerName?: string
  date: string
  items: InvoiceItem[]
  total: number
}

export interface InvoiceItem {
  description: string
  quantity: number
  saleUnit: SaleUnit
  unitPrice: number
  subtotal: number
}

export interface Provider {
  _id: string
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export interface PurchaseItem {
  productId: string
  quantity: number
  unitCost: number
  subtotal: number
}

export interface Purchase {
  _id: string
  providerId: string
  date: string
  items: PurchaseItem[]
  total: number
  paid: boolean
}

export interface Income {
  _id: string
  date: string
  source: IncomeSource
  referenceId?: string
  description: string
  amount: number
}

export interface Expense {
  _id: string
  date: string
  category: string
  referenceId?: string
  description: string
  amount: number
}
