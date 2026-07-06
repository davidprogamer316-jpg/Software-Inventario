import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import env from './config/env.js'
import { connectDB } from './config/db.js'
import authRoutes from './modules/auth/auth.routes.js'
import productRoutes from './modules/products/product.routes.js'
import saleRoutes from './modules/sales/sale.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(cors({
  origin: env.corsOrigins,
  credentials: true,
}))
app.use(express.json())
app.use(morgan('dev'))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/sales', saleRoutes)

app.use(errorHandler)

async function start() {
  if (env.mongoUri) {
    await connectDB()
  }

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} (${env.nodeEnv})`)
  })
}

start().catch(console.error)

export default app
