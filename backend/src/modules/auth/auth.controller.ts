import { Request, Response, NextFunction } from 'express'
import * as authService from './auth.service.js'

import { AuthRequest } from '../../middleware/authenticate.js'

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Contraseña actual y nueva contraseña son requeridas' })
      return
    }

    const result = await authService.changePassword(req.user!.id, currentPassword, newPassword)
    res.json(result)
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message })
      return
    }
    next(error)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ message: 'Email y contraseña son requeridos' })
      return
    }

    const result = await authService.login(email, password)
    res.json(result)
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message })
      return
    }
    next(error)
  }
}

export async function logout(_req: Request, res: Response) {
  res.json({ message: 'Sesión cerrada' })
}
