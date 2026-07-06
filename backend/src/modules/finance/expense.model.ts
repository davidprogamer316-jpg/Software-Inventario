import mongoose, { Schema, Document } from 'mongoose'

export interface IExpense extends Document {
  date: Date
  source: 'purchase' | 'manual'
  referenceId?: string
  description: string
  amount: number
}

const expenseSchema = new Schema<IExpense>({
  date: { type: Date, default: Date.now },
  source: { type: String, enum: ['purchase', 'manual'], required: true },
  referenceId: { type: String },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
})

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema)
