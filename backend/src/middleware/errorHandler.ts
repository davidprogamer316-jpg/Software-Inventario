import { Request, Response, NextFunction } from 'express'

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
    res.status(err.status).json({ message: err.message })
    return
  }

  console.error('Unhandled error:', err?.message || err)
  res.status(500).json({ message: 'Error interno del servidor' })
}
