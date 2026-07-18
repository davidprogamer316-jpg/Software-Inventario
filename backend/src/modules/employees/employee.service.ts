import { Employee, IEmployee } from './employee.model.js'
import { User } from '../auth/user.model.js'

export async function listEmployees(search?: string) {
  const query: Record<string, unknown> = {}
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
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
  const employee = await Employee.findByIdAndUpdate(id, data, { new: true, runValidators: true })
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