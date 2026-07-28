import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import env from '../config/env.js'
import { isTokenRevoked } from '../utils/tokenBlacklist.js'

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; jti: string }
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token

  if (!token) {
    res.status(401).json({ message: 'Token requerido' })
    return
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] }) as { id: string; email: string; role: string; jti: string }

    if (decoded.jti && isTokenRevoked(decoded.jti)) {
      res.status(401).json({ message: 'Sesión revocada' })
      return
    }

    req.user = decoded
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' })
  }
}
