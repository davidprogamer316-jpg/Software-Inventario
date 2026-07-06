import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import env from '../config/env.js'

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string }
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '') || (req.query.token as string)

  if (!token) {
    res.status(401).json({ message: 'Token requerido' })
    return
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { id: string; email: string; role: string }
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' })
  }
}
