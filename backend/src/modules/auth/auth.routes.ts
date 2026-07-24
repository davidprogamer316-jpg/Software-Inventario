import { Router } from 'express'
import { login, changePassword } from './auth.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'

const router = Router()

router.post('/login', login)
router.put('/change-password', authenticate, requireRole('admin'), changePassword)

export default router
