import { loadEnvFile } from 'process'

try {
  loadEnvFile()
} catch {}

const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('JWT_SECRET is required in production') })()
    : 'dev-secret-change-in-production'),
  corsOrigins: process.env.CORS_ORIGINS?.split(',').map(s => s.trim()) || ['http://localhost:3000'],
  nodeEnv: process.env.NODE_ENV || 'development',
}

export default env
