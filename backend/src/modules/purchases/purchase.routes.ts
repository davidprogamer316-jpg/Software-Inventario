import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'
import * as controller from './purchase.controller.js'

const router = Router()

router.use(authenticate)

router.post('/', requireRole('admin'), controller.create)
router.get('/', controller.list)
router.get('/:id', controller.getById)

export default router
