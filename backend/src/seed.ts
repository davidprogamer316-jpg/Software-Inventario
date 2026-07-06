import dns from 'dns'
import mongoose from 'mongoose'
import { User } from './modules/auth/user.model.js'
import env from './config/env.js'

dns.setServers(['8.8.8.8', '1.1.1.1'])

async function seed() {
  await mongoose.connect(env.mongoUri)

  const exists = await User.findOne({ email: 'admin@tubogest.com' })
  if (exists) {
    console.log('Admin user already exists')
    await mongoose.disconnect()
    return
  }

  await User.create({
    email: 'admin@tubogest.com',
    passwordHash: 'admin123',
    fullName: 'Administrador',
    role: 'admin',
    active: true,
  })

  console.log('Admin user created: admin@tubogest.com / admin123')
  await mongoose.disconnect()
}

seed().catch(console.error)
