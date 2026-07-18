import mongoose, { Schema, Document } from 'mongoose'

export interface IEmployee extends Document {
  fullName: string
  email: string
  phone?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const employeeSchema = new Schema<IEmployee>({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema)
