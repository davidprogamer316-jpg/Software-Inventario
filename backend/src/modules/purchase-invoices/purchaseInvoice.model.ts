import mongoose, { Schema, Document } from 'mongoose'

export interface IPurchaseInvoiceItem {
  productId: mongoose.Types.ObjectId
  productName: string
  saleUnit: 'unit' | 'meter' | 'centimeter'
  quantity: number
  unitCost: number
  subtotal: number
}

export interface IPurchaseInvoice extends Document {
  invoiceNumber: string
  purchaseId: mongoose.Types.ObjectId
  date: Date
  providerId: mongoose.Types.ObjectId
  providerName: string
  items: IPurchaseInvoiceItem[]
  total: number
  notes?: string
  createdAt: Date
}

const purchaseInvoiceItemSchema = new Schema<IPurchaseInvoiceItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  saleUnit: { type: String, enum: ['unit', 'meter', 'centimeter'], required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitCost: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false })

const purchaseInvoiceSchema = new Schema<IPurchaseInvoice>({
  invoiceNumber: { type: String, required: true, unique: true },
  purchaseId: { type: Schema.Types.ObjectId, ref: 'Purchase', required: true },
  date: { type: Date, default: Date.now },
  providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
  providerName: { type: String, required: true },
  items: [purchaseInvoiceItemSchema],
  total: { type: Number, required: true, min: 0 },
  notes: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
})

export const PurchaseInvoice = mongoose.model<IPurchaseInvoice>('PurchaseInvoice', purchaseInvoiceSchema)
