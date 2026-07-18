import mongoose, { Schema, Document } from 'mongoose'

export interface IPurchaseItem {
  productId: mongoose.Types.ObjectId
  productName: string
  saleUnit: 'unit' | 'meter' | 'centimeter'
  quantity: number
  unitCost: number
  subtotal: number
}

export interface IPayment {
  date: Date
  amount: number
  method: 'cash' | 'transfer' | 'card'
  reference?: string
}

export interface IPurchase extends Document {
  date: Date
  providerId: mongoose.Types.ObjectId
  providerName: string
  employeeId: mongoose.Types.ObjectId
  items: IPurchaseItem[]
  total: number
  received: boolean
  notes?: string
  payments: IPayment[]
  paidAmount: number
  paymentStatus: 'pending' | 'partial' | 'paid'
  closed: boolean
  purchaseInvoiceId?: mongoose.Types.ObjectId
  createdAt: Date
}

const purchaseItemSchema = new Schema<IPurchaseItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  saleUnit: { type: String, enum: ['unit', 'meter', 'centimeter'], required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitCost: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false })

const paymentSchema = new Schema<IPayment>({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['cash', 'transfer', 'card'], required: true },
  reference: { type: String, trim: true },
}, { _id: false })

const purchaseSchema = new Schema<IPurchase>({
  date: { type: Date, default: Date.now },
  providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
  providerName: { type: String, required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [purchaseItemSchema],
  total: { type: Number, required: true, min: 0 },
  received: { type: Boolean, default: false },
  notes: { type: String, trim: true },
  payments: { type: [paymentSchema], default: [] },
  paidAmount: { type: Number, default: 0, min: 0 },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending',
  },
  closed: { type: Boolean, default: false },
  purchaseInvoiceId: { type: Schema.Types.ObjectId, ref: 'PurchaseInvoice' },
  createdAt: { type: Date, default: Date.now },
})

export const Purchase = mongoose.model<IPurchase>('Purchase', purchaseSchema)
