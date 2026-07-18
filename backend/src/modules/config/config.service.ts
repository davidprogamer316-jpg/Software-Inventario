import { Config, getConfig } from './config.model.js'

export async function getConfigData() {
  return getConfig()
}

export async function updateConfig(data: Partial<{
  companyName: string
  nit: string
  address: string
  city: string
  phone: string
  defaultTaxRate: number
  invoiceFooter: string
}>) {
  let config = await Config.findOne()
  if (!config) {
    config = await Config.create(data)
  } else {
    Object.assign(config, data)
    await config.save()
  }
  return config
}
