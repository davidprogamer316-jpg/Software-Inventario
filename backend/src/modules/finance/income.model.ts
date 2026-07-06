import mongoose, { Schema, Document } from 'mongoose'

export interface IIncome extends Document {
  date: Date
  source: 'sale' | 'manual'
  referenceId?: string
  description: string
  amount: number
}

const incomeSchema = new Schema<IIncome>({
  date: { type: Date, default: Date.now },
  source: { type: String, enum: ['sale', 'manual'], required: true },
  referenceId: { type: String },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
})

export const Income = mongoose.model<IIncome>('Income', incomeSchema)
