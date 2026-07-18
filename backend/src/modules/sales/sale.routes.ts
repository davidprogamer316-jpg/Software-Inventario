import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'
import * as controller from './sale.controller.js'

const router = Router()

router.use(authenticate)

router.post('/', controller.create)
router.get('/', controller.list)
router.get('/:id', controller.getById)
router.patch('/:id/void', requireRole('admin'), controller.voidSale)
router.post('/:id/payments', controller.recordPayment)
router.patch('/:id/close', requireRole('admin'), controller.closeSale)

export default router
