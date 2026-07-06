import jwt from 'jsonwebtoken'
import { User, IUser } from './user.model.js'
import env from '../../config/env.js'

const MAX_ATTEMPTS = 5
const LOCK_DURATION_MS = 30 * 60 * 1000

interface LoginResult {
  token: string
  user: {
    id: string
    email: string
    fullName: string
    role: string
    active: boolean
  }
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await User.findOne({ email: email.toLowerCase() })

  if (!user) {
    throw { status: 401, message: 'Credenciales inválidas' }
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    throw { status: 423, message: `Cuenta bloqueada. Intente de nuevo en ${remainingMinutes} minutos` }
  }

  const isMatch = await user.comparePassword(password)

  if (!isMatch) {
    user.failedLoginAttempts += 1

    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS)
      await user.save()
      throw { status: 423, message: 'Cuenta bloqueada por 30 minutos debido a múltiples intentos fallidos' }
    }

    await user.save()
    throw { status: 401, message: 'Credenciales inválidas' }
  }

  if (!user.active) {
    throw { status: 403, message: 'Cuenta desactivada. Contacte al administrador' }
  }

  user.failedLoginAttempts = 0
  user.lockedUntil = null
  user.lastLogin = new Date()
  await user.save()

  const payload = { id: user._id, email: user.email, role: user.role }
  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: '24h' })

  return {
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      active: user.active,
    },
  }
}
