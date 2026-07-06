import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/authenticate.js'
import * as saleService from './sale.service.js'

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sale = await saleService.createSale(req.body, req.user!.id)
    res.status(201).json(sale)
  } catch (error) {
    next(error)
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sales = await saleService.listSales(
      req.query as any,
      req.user!.id,
      req.user!.role
    )
    res.json(sales)
  } catch (error) {
    next(error)
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sale = await saleService.getSaleById(req.params.id as string)
    res.json(sale)
  } catch (error) {
    next(error)
  }
}

export async function voidSale(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { reason } = req.body
    const sale = await saleService.voidSale(req.params.id as string, reason, req.user!.id)
    res.json(sale)
  } catch (error) {
    next(error)
  }
}
