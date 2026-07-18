export type Role = 'admin' | 'employee'
export type SaleUnit = 'unit' | 'meter' | 'centimeter'
export type PaymentMethod = 'cash' | 'transfer' | 'card'
export type SaleStatus = 'completed' | 'voided'
export type PaymentStatus = 'pending' | 'partial' | 'paid'
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
  email: string
  phone?: string
  isActive: boolean
  hasUser?: boolean
  userId?: string | null
  createdAt: string
  updatedAt: string
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

export interface Payment {
  date: string
  amount: number
  method: PaymentMethod
  reference?: string
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
  invoiceId?: string
  payments: Payment[]
  paidAmount: number
  paymentStatus: PaymentStatus
  closed: boolean
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

export interface PurchaseInvoiceItem {
  productId: string
  productName: string
  saleUnit: SaleUnit
  quantity: number
  unitCost: number
  subtotal: number
}

export interface PurchaseInvoice {
  _id: string
  invoiceNumber: string
  purchaseId: string
  date: string
  providerId: string
  providerName: string
  items: PurchaseInvoiceItem[]
  total: number
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
  paymentMethod?: string
  paymentDetails?: string
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
  received: boolean
  notes?: string
  payments: Payment[]
  paidAmount: number
  paymentStatus: PaymentStatus
  closed: boolean
  purchaseInvoiceId?: string
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

export interface Config {
  _id: string
  companyName: string
  nit: string
  address: string
  city: string
  phone: string
  defaultTaxRate: number
  invoiceFooter: string
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