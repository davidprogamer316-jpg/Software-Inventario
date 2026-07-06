import mongoose, { Schema, Document } from 'mongoose'

export interface IStockMovement extends Document {
  productId: mongoose.Types.ObjectId
  type: 'sale_out' | 'purchase_in' | 'manual_adjustment'
  quantity: number
  unit: string
  reason?: string
  referenceId?: string
  userId: mongoose.Types.ObjectId
  date: Date
}

const stockMovementSchema = new Schema<IStockMovement>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['sale_out', 'purchase_in', 'manual_adjustment'], required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  reason: { type: String },
  referenceId: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
})

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', stockMovementSchema)
