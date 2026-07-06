import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'
import * as controller from './provider.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', controller.list)
router.get('/:id', controller.getById)
router.post('/', requireRole('admin'), controller.create)
router.put('/:id', requireRole('admin'), controller.update)

export default router
