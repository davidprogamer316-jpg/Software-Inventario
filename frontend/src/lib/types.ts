export type Role = 'admin' | 'employee'
export type SaleUnit = 'unit' | 'meter' | 'centimeter'
export type PaymentMethod = 'cash' | 'transfer' | 'card'
export type SaleStatus = 'completed' | 'voided'
export type MovementType = 'sale_out' | 'purchase_in' | 'manual_adjustment'
export type IncomeSource = 'sale' | 'manual'
export type ExpenseSource = 'purchase' | 'manual'

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

export type InvoiceStatus = 'issued' | 'cancelled'

export interface InvoiceItem {
  productId: string
  productName: string
  saleUnit: SaleUnit
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Invoice {
  _id: string
  invoiceNumber: string
  saleId?: string
  date: string
  employeeId: string
  customerName?: string
  customerPhone?: string
  customerDoc?: string
  customerAddress?: string
  items: InvoiceItem[]
  subtotal: number
  taxRate: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  status: InvoiceStatus
  cancelledReason?: string
  notes?: string
  createdAt: string
}

export interface Provider {
  _id: string
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  active: boolean
}

export interface PurchaseItem {
  productId: string
  productName: string
  saleUnit: SaleUnit
  quantity: number
  unitCost: number
  subtotal: number
}

export interface Purchase {
  _id: string
  date: string
  providerId: string
  providerName: string
  employeeId: string
  items: PurchaseItem[]
  total: number
  paid: boolean
  notes?: string
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
  source: ExpenseSource
  referenceId?: string
  description: string
  amount: number
}

export interface DashboardPeriod {
  count: number
  total: number
}

export interface TopProduct {
  productId: string
  productName: string
  totalQuantity: number
  totalRevenue: number
}

export interface DashboardData {
  today: DashboardPeriod
  week: DashboardPeriod
  month: DashboardPeriod
  lowStockProducts: Product[]
  topProducts: TopProduct[]
  incomeVsExpense: { income: number; expense: number }
  recentSales: Sale[]
}
