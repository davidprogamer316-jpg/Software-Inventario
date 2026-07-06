import mongoose, { Schema, Document } from 'mongoose'

export interface IPurchaseItem {
  productId: mongoose.Types.ObjectId
  productName: string
  saleUnit: 'unit' | 'meter' | 'centimeter'
  quantity: number
  unitCost: number
  subtotal: number
}

export interface IPurchase extends Document {
  date: Date
  providerId: mongoose.Types.ObjectId
  providerName: string
  employeeId: mongoose.Types.ObjectId
  items: IPurchaseItem[]
  total: number
  paid: boolean
  notes?: string
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

const purchaseSchema = new Schema<IPurchase>({
  date: { type: Date, default: Date.now },
  providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
  providerName: { type: String, required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  items: [purchaseItemSchema],
  total: { type: Number, required: true, min: 0 },
  paid: { type: Boolean, default: false },
  notes: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
})

export const Purchase = mongoose.model<IPurchase>('Purchase', purchaseSchema)
