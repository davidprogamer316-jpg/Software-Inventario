import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/authenticate.js'
import * as configService from './config.service.js'

export async function get(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const config = await configService.getConfigData()
    res.json(config)
  } catch (error) {
    next(error)
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const config = await configService.updateConfig(req.body)
    res.json(config)
  } catch (error) {
    next(error)
  }
}
