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
  const allowed = (({ companyName, nit, address, city, phone, defaultTaxRate, invoiceFooter }) =>
    ({ companyName, nit, address, city, phone, defaultTaxRate, invoiceFooter }))(data)

  let config = await Config.findOne()
  if (!config) {
    config = await Config.create(allowed)
  } else {
    Object.assign(config, allowed)
    await config.save()
  }
  return config
}
