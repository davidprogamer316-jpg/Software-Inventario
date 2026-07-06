import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  email: string
  passwordHash: string
  fullName: string
  role: 'admin' | 'employee'
  employeeId?: mongoose.Types.ObjectId
  active: boolean
  failedLoginAttempts: number
  lockedUntil: Date | null
  lastLogin: Date | null
  createdAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  role: { type: String, enum: ['admin', 'employee'], required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  active: { type: Boolean, default: true },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  lastLogin: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
})

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash)
}

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
  next()
})

export const User = mongoose.model<IUser>('User', userSchema)
