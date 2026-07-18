import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'
import * as controller from './purchaseInvoice.controller.js'

const router = Router()

router.use(authenticate)
router.use(requireRole('admin'))

router.post('/from-purchase', controller.createFromPurchase)
router.get('/', controller.list)
router.get('/:id', controller.getById)
router.get('/:id/pdf', controller.downloadPdf)

export default router
