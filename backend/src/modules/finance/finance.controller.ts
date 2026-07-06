import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/authenticate.js'
import * as financeService from './finance.service.js'

export async function listIncomes(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const incomes = await financeService.listIncomes(req.query as any)
    res.json(incomes)
  } catch (error) {
    next(error)
  }
}

export async function createIncome(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const income = await financeService.createManualIncome(req.body)
    res.status(201).json(income)
  } catch (error) {
    next(error)
  }
}

export async function listExpenses(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const expenses = await financeService.listExpenses(req.query as any)
    res.json(expenses)
  } catch (error) {
    next(error)
  }
}

export async function createExpense(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const expense = await financeService.createManualExpense(req.body)
    res.status(201).json(expense)
  } catch (error) {
    next(error)
  }
}
