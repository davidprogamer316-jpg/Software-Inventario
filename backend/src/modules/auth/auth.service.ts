import jwt from 'jsonwebtoken'
import { User } from './user.model.js'
import env from '../../config/env.js'

const MAX_ATTEMPTS = 5
const LOCK_DURATION_MS = 30 * 60 * 1000

interface LoginResult {
  token: string
  user: {
    _id: string
    email: string
    fullName: string
    role: string
    active: boolean
  }
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  if (!/[A-Z]/.test(password)) return 'La contraseña debe tener al menos una mayúscula'
  if (!/[a-z]/.test(password)) return 'La contraseña debe tener al menos una minúscula'
  if (!/[0-9]/.test(password)) return 'La contraseña debe tener al menos un número'
  return null
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const validationError = validatePassword(newPassword)
  if (validationError) throw { status: 400, message: validationError }

  const user = await User.findById(userId)
  if (!user) throw { status: 404, message: 'Usuario no encontrado' }

  const isMatch = await user.comparePassword(currentPassword)
  if (!isMatch) throw { status: 401, message: 'La contraseña actual es incorrecta' }

  user.passwordHash = newPassword
  await user.save()

  return { message: 'Contraseña actualizada correctamente' }
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await User.findOne({ email: email.toLowerCase() }).collation({ locale: 'en', strength: 2 })

  if (!user) {
    throw { status: 401, message: 'Credenciales inválidas' }
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    throw { status: 423, message: `Cuenta bloqueada. Intente de nuevo en ${remainingMinutes} minutos` }
  }

  if (!user.active) {
    throw { status: 403, message: 'Cuenta desactivada. Contacte al administrador' }
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

  user.failedLoginAttempts = 0
  user.lockedUntil = null
  user.lastLogin = new Date()
  await user.save()

  const payload = { id: user._id, email: user.email, role: user.role }
  const token = jwt.sign(payload, env.jwtSecret, { algorithm: 'HS256', expiresIn: '24h' })

  return {
    token,
    user: {
      _id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      active: user.active,
    },
  }
}
