import mongoose from 'mongoose'
import { User } from './modules/auth/user.model.js'
import { Config } from './modules/config/config.model.js'
import env from './config/env.js'

async function seed() {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  })

  const adminExists = await User.findOne({ email: 'admin@eurometales.com' })
  if (!adminExists) {
    await User.create({
      email: 'admin@eurometales.com',
      passwordHash: 'admin123',
      fullName: 'Administrador',
      role: 'admin',
      active: true,
    })
    console.log('Admin user created')
  } else {
    console.log('Admin user already exists')
  }

  const configExists = await Config.findOne()
  if (!configExists) {
    await Config.create({
      companyName: 'Eurometales',
      nit: '900.123.456-7',
      address: 'Calle 123 # 45-67',
      city: 'Bogotá, Colombia',
      phone: '(601) 234 5678',
      defaultTaxRate: 0,
      invoiceFooter: 'Eurometales ERP - Documento generado electrónicamente',
    })
    console.log('Default config created')
  } else {
    console.log('Config already exists')
  }

  await mongoose.disconnect()
}

seed().catch(console.error)
