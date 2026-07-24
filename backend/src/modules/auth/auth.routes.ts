import { Router } from 'express'
import { login, changePassword } from './auth.controller.js'
import { authenticate } from '../../middleware/authenticate.js'

const router = Router()

router.post('/login', login)
router.put('/change-password', authenticate, changePassword)

export default router
