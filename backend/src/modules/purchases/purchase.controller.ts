import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/authenticate.js'
import * as purchaseService from './purchase.service.js'

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const purchase = await purchaseService.createPurchase(req.body, req.user!.id)
    res.status(201).json(purchase)
  } catch (error) {
    next(error)
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const purchases = await purchaseService.listPurchases(req.query as any)
    res.json(purchases)
  } catch (error) {
    next(error)
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const purchase = await purchaseService.getPurchaseById(req.params.id as string)
    res.json(purchase)
  } catch (error) {
    next(error)
  }
}
