import mongoose, { Schema, Document } from 'mongoose'

export interface IConfig extends Document {
  companyName: string
  nit: string
  address: string
  city: string
  phone: string
  defaultTaxRate: number
  invoiceFooter: string
  createdAt: Date
  updatedAt: Date
}

const configSchema = new Schema<IConfig>({
  companyName: { type: String, default: 'Mi Empresa' },
  nit: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  phone: { type: String, default: '' },
  defaultTaxRate: { type: Number, default: 0 },
  invoiceFooter: { type: String, default: '' },
}, { timestamps: true })

export const Config = mongoose.model<IConfig>('Config', configSchema)

export async function getConfig(): Promise<IConfig> {
  let config = await Config.findOne()
  if (!config) {
    config = await Config.create({})
  }
  return config
}
