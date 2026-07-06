import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/authenticate.js'
import * as dashboardService from './dashboard.service.js'

export async function get(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getDashboard(req.user!.id, req.user!.role)
    res.json(data)
  } catch (error) {
    next(error)
  }
}
