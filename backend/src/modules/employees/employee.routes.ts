import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'
import { validate, employeeSchema } from '../../utils/validation.js'
import * as controller from './employee.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', controller.list)
router.get('/:id', controller.getById)
router.post('/', requireRole('admin'), validate(employeeSchema), controller.create)
router.put('/:id', requireRole('admin'), validate(employeeSchema.partial()), controller.update)
router.patch('/:id/deactivate', requireRole('admin'), controller.deactivate)
router.patch('/:id/reset-password', requireRole('admin'), controller.resetPassword)

export default router
