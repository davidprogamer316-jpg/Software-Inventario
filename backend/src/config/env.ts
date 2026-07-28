import { loadEnvFile } from 'process'

try {
  loadEnvFile()
} catch {}

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  JWT_SECRET no está configurado. Usando secret por defecto. ¡Configúralo para producción!')
}

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
