import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'
import * as controller from './finance.controller.js'

const router = Router()

router.use(authenticate)

router.get('/incomes', controller.listIncomes)
router.post('/incomes', requireRole('admin'), controller.createIncome)
router.get('/expenses', controller.listExpenses)
router.post('/expenses', requireRole('admin'), controller.createExpense)

export default router
