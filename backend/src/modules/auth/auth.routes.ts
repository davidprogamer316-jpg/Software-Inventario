import { Router } from 'express'
import { login, changePassword, logout } from './auth.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'

const router = Router()

router.post('/login', login)
router.post('/logout', authenticate, logout)
router.put('/change-password', authenticate, requireRole('admin'), changePassword)

export default router
