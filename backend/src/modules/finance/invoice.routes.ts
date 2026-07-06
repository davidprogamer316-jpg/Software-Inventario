import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'
import * as controller from './invoice.controller.js'

const router = Router()

router.use(authenticate)

router.post('/from-sale', controller.createFromSale)
router.get('/', controller.list)
router.get('/:id', controller.getById)
router.get('/:id/pdf', controller.downloadPdf)
router.patch('/:id/cancel', requireRole('admin'), controller.cancel)

export default router
