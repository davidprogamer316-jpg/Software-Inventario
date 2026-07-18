import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'
import * as controller from './config.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', controller.get)
router.put('/', requireRole('admin'), controller.update)

export default router
