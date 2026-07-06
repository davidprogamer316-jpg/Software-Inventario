import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import * as controller from './dashboard.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', controller.get)

export default router
