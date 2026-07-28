import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'
import { validate, providerSchema } from '../../utils/validation.js'
import * as controller from './provider.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', controller.list)
router.get('/:id', controller.getById)
router.post('/', requireRole('admin'), validate(providerSchema), controller.create)
router.put('/:id', requireRole('admin'), validate(providerSchema.partial()), controller.update)

export default router
