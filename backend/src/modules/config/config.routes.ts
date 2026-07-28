import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'
import { validate, configSchema } from '../../utils/validation.js'
import * as controller from './config.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', controller.get)
router.put('/', requireRole('admin'), validate(configSchema), controller.update)

export default router
