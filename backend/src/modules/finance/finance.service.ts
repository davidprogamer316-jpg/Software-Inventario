import { Income } from './income.model.js'
import { Expense } from './expense.model.js'

interface DateFilter {
  startDate?: string
  endDate?: string
}

export async function listIncomes(filters: DateFilter & { source?: string }) {
  const query: Record<string, unknown> = {}

  if (filters.startDate || filters.endDate) {
    const dateFilter: Record<string, Date> = {}
    if (filters.startDate) dateFilter.$gte = new Date(filters.startDate)
    if (filters.endDate) dateFilter.$lte = new Date(filters.endDate)
    query.date = dateFilter
  }

  if (filters.source) query.source = filters.source

  return Income.find(query).sort({ date: -1 })
}

export async function createManualIncome(data: { description: string; amount: number; date?: string }) {
  if (!data.description) throw { status: 400, message: 'La descripción es obligatoria' }
  if (!data.amount || data.amount <= 0) throw { status: 400, message: 'El monto debe ser mayor a cero' }

  const income = new Income({
    date: data.date ? new Date(data.date) : new Date(),
    source: 'manual',
    description: data.description,
    amount: data.amount,
  })
  return income.save()
}

export async function listExpenses(filters: DateFilter & { source?: string }) {
  const query: Record<string, unknown> = {}

  if (filters.startDate || filters.endDate) {
    const dateFilter: Record<string, Date> = {}
    if (filters.startDate) dateFilter.$gte = new Date(filters.startDate)
    if (filters.endDate) dateFilter.$lte = new Date(filters.endDate)
    query.date = dateFilter
  }

  if (filters.source) query.source = filters.source

  return Expense.find(query).sort({ date: -1 })
}

export async function createManualExpense(data: { description: string; amount: number; date?: string }) {
  if (!data.description) throw { status: 400, message: 'La descripción es obligatoria' }
  if (!data.amount || data.amount <= 0) throw { status: 400, message: 'El monto debe ser mayor a cero' }

  const expense = new Expense({
    date: data.date ? new Date(data.date) : new Date(),
    source: 'manual',
    description: data.description,
    amount: data.amount,
  })
  return expense.save()
}
