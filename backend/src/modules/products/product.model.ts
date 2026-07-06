import mongoose, { Schema, Document } from 'mongoose'

export interface IProduct extends Document {
  sku: string
  name: string
  category: string
  spec?: string
  saleUnit: 'unit' | 'meter' | 'centimeter'
  salePrice: number
  costPrice?: number
  stockQuantity: number
  minStock: number
  providerId?: mongoose.Types.ObjectId
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const productSchema = new Schema<IProduct>({
  sku: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  spec: { type: String, trim: true },
  saleUnit: { type: String, enum: ['unit', 'meter', 'centimeter'], required: true },
  salePrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, min: 0 },
  stockQuantity: { type: Number, default: 0, min: 0 },
  minStock: { type: Number, default: 0, min: 0 },
  providerId: { type: Schema.Types.ObjectId, ref: 'Provider' },
  active: { type: Boolean, default: true },
}, { timestamps: true })

export const Product = mongoose.model<IProduct>('Product', productSchema)
