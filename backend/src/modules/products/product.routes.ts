import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'
import * as controller from './product.controller.js'

const router = Router()

router.use(authenticate)

router.get('/categories', controller.categories)
router.get('/', controller.list)
router.get('/:id', controller.getById)
router.get('/:id/stock-history', controller.stockHistory)
router.post('/', requireRole('admin'), controller.create)
router.put('/:id', requireRole('admin'), controller.update)
router.patch('/:id/stock', requireRole('admin'), controller.adjustStock)

export default router
