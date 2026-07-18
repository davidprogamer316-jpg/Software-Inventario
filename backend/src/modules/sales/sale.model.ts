import mongoose, { Schema, Document } from 'mongoose'

export interface ISaleItem {
  productId: mongoose.Types.ObjectId
  productName: string
  saleUnit: 'unit' | 'meter' | 'centimeter'
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface IPayment {
  date: Date
  amount: number
  method: 'cash' | 'transfer' | 'card'
  reference?: string
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
  invoiceId?: mongoose.Types.ObjectId
  payments: IPayment[]
  paidAmount: number
  paymentStatus: 'pending' | 'partial' | 'paid'
  closed: boolean
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

const paymentSchema = new Schema<IPayment>({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['cash', 'transfer', 'card'], required: true },
  reference: { type: String, trim: true },
}, { _id: false })

const saleSchema = new Schema<ISale>({
  date: { type: Date, default: Date.now },
  employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String, trim: true },
  customerPhone: { type: String, trim: true },
  items: [saleItemSchema],
  paymentMethod: { type: String, enum: ['cash', 'transfer', 'card'], required: true },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['completed', 'voided'], default: 'completed' },
  voidedReason: { type: String },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  payments: { type: [paymentSchema], default: [] },
  paidAmount: { type: Number, default: 0, min: 0 },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending',
  },
  closed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

export const Sale = mongoose.model<ISale>('Sale', saleSchema)
