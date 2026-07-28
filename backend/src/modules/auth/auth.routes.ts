import { Router } from 'express'
import { login, changePassword, logout } from './auth.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'
import { validate, loginSchema, changePasswordSchema } from '../../utils/validation.js'

const router = Router()

router.post('/login', validate(loginSchema), login)
router.post('/logout', authenticate, logout)
router.put('/change-password', authenticate, requireRole('admin'), validate(changePasswordSchema), changePassword)

export default router
