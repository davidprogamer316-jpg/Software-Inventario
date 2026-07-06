import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/authenticate.js'
import * as providerService from './provider.service.js'

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const providers = await providerService.listProviders(req.query.search as string)
    res.json(providers)
  } catch (error) {
    next(error)
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const provider = await providerService.getProviderById(req.params.id as string)
    res.json(provider)
  } catch (error) {
    next(error)
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const provider = await providerService.createProvider(req.body)
    res.status(201).json(provider)
  } catch (error) {
    next(error)
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const provider = await providerService.updateProvider(req.params.id as string, req.body)
    res.json(provider)
  } catch (error) {
    next(error)
  }
}
