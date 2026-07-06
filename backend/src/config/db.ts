import dns from 'dns'
import mongoose from 'mongoose'
import env from './env.js'

dns.setServers(['8.8.8.8', '1.1.1.1'])

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.mongoUri)
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err)
  })
}
