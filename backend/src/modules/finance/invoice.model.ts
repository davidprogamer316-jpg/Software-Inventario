import mongoose, { Schema, Document } from 'mongoose'

export interface IInvoiceItem {
  productId: mongoose.Types.ObjectId
  productName: string
  saleUnit: 'unit' | 'meter' | 'centimeter'
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface IInvoice extends Document {
  invoiceNumber: string
  saleId?: mongoose.Types.ObjectId
  date: Date
  employeeId: mongoose.Types.ObjectId
  customerName?: string
  customerPhone?: string
  customerDoc?: string
  customerAddress?: string
  items: IInvoiceItem[]
  subtotal: number
  taxRate: number
  tax: number
  total: number
  paymentMethod: 'cash' | 'transfer' | 'card'
  status: 'issued' | 'cancelled'
  cancelledReason?: string
  notes?: string
  createdAt: Date
}

const invoiceItemSchema = new Schema<IInvoiceItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  saleUnit: { type: String, enum: ['unit', 'meter', 'centimeter'], required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false })

const invoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { type: String, required: true, unique: true },
  saleId: { type: Schema.Types.ObjectId, ref: 'Sale' },
  date: { type: Date, default: Date.now },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  customerName: { type: String, trim: true },
  customerPhone: { type: String, trim: true },
  customerDoc: { type: String, trim: true },
  customerAddress: { type: String, trim: true },
  items: [invoiceItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 0 },
  tax: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['cash', 'transfer', 'card'], required: true },
  status: { type: String, enum: ['issued', 'cancelled'], default: 'issued' },
  cancelledReason: { type: String },
  notes: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
})

invoiceSchema.index({ invoiceNumber: 1 })

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema)
