import mongoose, { Schema, Document } from 'mongoose'

export interface IInvoiceCounter extends Document {
  year: number
  month: number
  count: number
}

const invoiceCounterSchema = new Schema<IInvoiceCounter>({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  count: { type: Number, default: 0 },
})

invoiceCounterSchema.index({ year: 1, month: 1 }, { unique: true })

export const InvoiceCounter = mongoose.model<IInvoiceCounter>('InvoiceCounter', invoiceCounterSchema)

export async function getNextInvoiceNumber(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const counter = await InvoiceCounter.findOneAndUpdate(
    { year, month },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  )

  const monthStr = month.toString().padStart(2, '0')
  const seq = counter.count.toString().padStart(5, '0')
  return `INV-${year}${monthStr}-${seq}`
}
