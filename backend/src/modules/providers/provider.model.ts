import mongoose, { Schema, Document } from 'mongoose'

export interface IProvider extends Document {
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const providerSchema = new Schema<IProvider>({
  name: { type: String, required: true, trim: true },
  contactName: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  notes: { type: String, trim: true },
  active: { type: Boolean, default: true },
}, { timestamps: true })

providerSchema.index({ name: 1 })

export const Provider = mongoose.model<IProvider>('Provider', providerSchema)
