import { Response, NextFunction } from 'express'
import { AuthRequest } from './authenticate.js'

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'No autenticado' })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'No tiene permisos para esta acción' })
      return
    }

    next()
  }
}
