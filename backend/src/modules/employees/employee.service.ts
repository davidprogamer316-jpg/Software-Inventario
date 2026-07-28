import { Employee, IEmployee } from './employee.model.js'
import { User } from '../auth/user.model.js'
import { escapeRegex } from '../../utils/escapeRegex.js'
import { validatePassword } from '../auth/auth.service.js'

export async function listEmployees(search?: string) {
  const query: Record<string, unknown> = {}
  if (search) {
    const safe = escapeRegex(search)
    query.$or = [
      { fullName: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
    ]
  }
  const employees = await Employee.find(query).sort({ fullName: 1 })
  const empIds = employees.map(e => e._id)
  const users = await User.find({ employeeId: { $in: empIds } }).select('employeeId')
  const userMap = new Map(users.map(u => [u.employeeId?.toString(), u._id.toString()]))
  return employees.map(e => ({
    ...e.toObject(),
    hasUser: userMap.has(e._id.toString()),
    userId: userMap.get(e._id.toString()) || null,
  }))
}

export async function getEmployeeById(id: string) {
  const employee = await Employee.findById(id)
  if (!employee) throw { status: 404, message: 'Empleado no encontrado' }
  const user = await User.findOne({ employeeId: id }).select('_id')
  return {
    ...employee.toObject(),
    hasUser: !!user,
    userId: user?._id.toString() || null,
  }
}

export async function createEmployee(data: Partial<IEmployee> & { createUser?: boolean; password?: string }) {
  const employee = await new Employee(data).save()
  let userId: string | null = null

  if (data.createUser && data.email && data.password) {
    const validationError = validatePassword(data.password)
    if (validationError) throw { status: 400, message: validationError }

    const existingUser = await User.findOne({ email: data.email })
    if (existingUser) throw { status: 400, message: 'Ya existe un usuario con ese email' }

    const user = await User.create({
      email: data.email,
      passwordHash: data.password,
      fullName: data.fullName || '',
      role: 'employee',
      employeeId: employee._id,
      active: true,
    })
    userId = user._id.toString()
  }

  return {
    ...employee.toObject(),
    hasUser: userId !== null,
    userId,
  }
}

export async function updateEmployee(id: string, data: Partial<IEmployee>) {
  const allowed: Record<string, unknown> = {}
  const fields = ['fullName', 'email', 'phone', 'isActive'] as const
  for (const f of fields) {
    if (f in data) allowed[f] = data[f]
  }

  const employee = await Employee.findByIdAndUpdate(id, allowed, { new: true, runValidators: true })
  if (!employee) throw { status: 404, message: 'Empleado no encontrado' }
  return employee
}

export async function deactivateEmployee(id: string) {
  const employee = await Employee.findByIdAndUpdate(id, { isActive: false }, { new: true })
  if (!employee) throw { status: 404, message: 'Empleado no encontrado' }

  await User.findOneAndUpdate({ employeeId: id }, { active: false })

  return employee
}

export async function resetPassword(id: string, newPassword: string) {
  const validationError = validatePassword(newPassword)
  if (validationError) throw { status: 400, message: validationError }

  const employee = await Employee.findById(id)
  if (!employee) throw { status: 404, message: 'Empleado no encontrado' }

  const user = await User.findOne({ employeeId: id })
  if (!user) throw { status: 400, message: 'El usuario no tiene acceso al sistema' }

  user.passwordHash = newPassword
  user.failedLoginAttempts = 0
  user.lockedUntil = null
  await user.save()

  return { message: 'Contraseña actualizada exitosamente' }
}