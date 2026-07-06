import mongoose, { Schema, Document } from 'mongoose'

export interface ISaleItem {
  productId: mongoose.Types.ObjectId
  productName: string
  saleUnit: 'unit' | 'meter' | 'centimeter'
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface ISale extends Document {
  date: Date
  employeeId: mongoose.Types.ObjectId
  customerName?: string
  customerPhone?: string
  items: ISaleItem[]
  paymentMethod: 'cash' | 'transfer' | 'card'
  total: number
  status: 'completed' | 'voided'
  voidedReason?: string
  createdAt: Date
}

const saleItemSchema = new Schema<ISaleItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  saleUnit: { type: String, enum: ['unit', 'meter', 'centimeter'], required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false })

const saleSchema = new Schema<ISale>({
  date: { type: Date, default: Date.now },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  customerName: { type: String, trim: true },
  customerPhone: { type: String, trim: true },
  items: [saleItemSchema],
  paymentMethod: { type: String, enum: ['cash', 'transfer', 'card'], required: true },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['completed', 'voided'], default: 'completed' },
  voidedReason: { type: String },
  createdAt: { type: Date, default: Date.now },
})

export const Sale = mongoose.model<ISale>('Sale', saleSchema)
