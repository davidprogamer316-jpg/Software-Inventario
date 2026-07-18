import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/authenticate.js'
import * as employeeService from './employee.service.js'

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const employees = await employeeService.listEmployees(req.query.search as string)
    res.json(employees)
  } catch (error) {
    next(error)
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id as string)
    res.json(employee)
  } catch (error) {
    next(error)
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const employee = await employeeService.createEmployee(req.body)
    res.status(201).json(employee)
  } catch (error) {
    next(error)
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const employee = await employeeService.updateEmployee(req.params.id as string, req.body)
    res.json(employee)
  } catch (error) {
    next(error)
  }
}

export async function deactivate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const employee = await employeeService.deactivateEmployee(req.params.id as string)
    res.json(employee)
  } catch (error) {
    next(error)
  }
}

export async function resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await employeeService.resetPassword(req.params.id as string, req.body.password)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
