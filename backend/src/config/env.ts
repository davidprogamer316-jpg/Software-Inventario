const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  corsOrigins: process.env.CORS_ORIGINS?.split(',').map(s => s.trim()) || ['http://localhost:3000'],
  nodeEnv: process.env.NODE_ENV || 'development',
}

export default env
