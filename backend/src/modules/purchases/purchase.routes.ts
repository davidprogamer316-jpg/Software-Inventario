import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'
import { validate, createPurchaseSchema, paymentSchema } from '../../utils/validation.js'
import * as controller from './purchase.controller.js'

const router = Router()

router.use(authenticate)
router.use(requireRole('admin'))

router.post('/', validate(createPurchaseSchema), controller.create)
router.get('/', controller.list)
router.get('/:id', controller.getById)
router.put('/:id', controller.update)
router.patch('/:id/receive', controller.markAsReceived)
router.post('/:id/payments', validate(paymentSchema), controller.recordPayment)
router.patch('/:id/close', controller.closePurchase)
router.put('/:id/items', controller.updateItemCosts)

export default router
