import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import * as controller from './quotation.controller.js'

const router = Router()

router.use(authenticate)

router.post('/generate', controller.generate)

export default router
