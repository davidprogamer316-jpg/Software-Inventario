import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/authenticate.js'
import * as productService from './product.service.js'

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { category, active, lowStock, search, saleUnit, stockStatus } = req.query
    const products = await productService.listProducts({
      category: category as string,
      active: active !== undefined ? active === 'true' : undefined,
      lowStock: lowStock === 'true',
      search: search as string,
      saleUnit: saleUnit as string,
      stockStatus: stockStatus as string,
    })
    res.json(products)
  } catch (error) {
    next(error)
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const product = await productService.getProductById(req.params.id as string)
    res.json(product)
  } catch (error) {
    next(error)
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const product = await productService.createProduct(req.body)
    res.status(201).json(product)
  } catch (error) {
    next(error)
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const product = await productService.updateProduct(req.params.id as string, req.body)
    res.json(product)
  } catch (error) {
    next(error)
  }
}

export async function adjustStock(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { quantity, reason } = req.body
    const product = await productService.adjustStock(req.params.id as string, quantity, reason, req.user!.id)
    res.json(product)
  } catch (error) {
    next(error)
  }
}

export async function stockHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const movements = await productService.getStockHistory(req.params.id as string)
    res.json(movements)
  } catch (error) {
    next(error)
  }
}

export async function categories(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const cats = await productService.getCategories()
    res.json(cats)
  } catch (error) {
    next(error)
  }
}
