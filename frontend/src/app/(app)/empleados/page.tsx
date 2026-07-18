'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import type { Employee } from '@/lib/types'
import Modal from '@/components/Modal'
import { Plus, Pencil, Search, Users, Ban, KeyRound } from 'lucide-react'

export default function EmployeesPage() {
  const { token, isAdmin, loading: authLoading } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [resetting, setResetting] = useState<Employee | null>(null)

  useEffect(() => {
    if (!token) return
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    api.get<Employee[]>(`/employees${params}`, token)
      .then(setEmployees)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, search])

  async function handleSave(form: Partial<Employee>) {
    if (editing?._id) {
      const updated = await api.put<Employee>(`/employees/${editing._id}`, form, token!)
      setEmployees(prev => prev.map(e => e._id === updated._id ? updated : e))
    } else {
      const created = await api.post<Employee>('/employees', form, token!)
      setEmployees(prev => [created, ...prev])
    }
    setEditing(null)
  }

  async function handleDeactivate(employee: Employee) {
    if (!confirm(`¿Desactivar a ${employee.fullName}?`)) return
    const updated = await api.patch<Employee>(`/employees/${employee._id}/deactivate`, {}, token!)
    setEmployees(prev => prev.map(e => e._id === updated._id ? updated : e))
  }

  async function handleResetPassword(employee: Employee, password: string) {
    await api.patch(`/employees/${employee._id}/reset-password`, { password }, token!)
    setResetting(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-semibold text-brand">Empleados</h1>
        {!authLoading && isAdmin && (
          <button
            onClick={() => setEditing({} as Employee)}
            className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar empleado
          </button>
        )}
      </div>

      <div className="relative max-w-xs mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3.5 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay empleados registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {employees.map(e => (
            <div key={e._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-medium text-brand">{e.fullName}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    e.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {e.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex gap-4 mt-1 text-sm text-gray-500">
                  <span>{e.email}</span>
                  {e.phone && <span>{e.phone}</span>}
                </div>
              </div>
              {!authLoading && isAdmin && (
                <div className="flex items-center gap-1 shrink-0">
                  {e.isActive && (
                    <>
                      <button
                        onClick={() => handleDeactivate(e)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Desactivar"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      {e.hasUser && (
                        <button
                          onClick={() => setResetting(e)}
                          className="p-2 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                          title="Resetear contraseña"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => setEditing(e)}
                    className="p-2 rounded-lg text-gray-400 hover:text-accent hover:bg-accent/5 transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?._id ? 'Editar empleado' : 'Nuevo empleado'}
      >
        <EmployeeForm employee={editing} onSave={handleSave} />
      </Modal>

      <Modal
        open={resetting !== null}
        onClose={() => setResetting(null)}
        title={`Resetear contraseña — ${resetting?.fullName || ''}`}
      >
        <ResetPasswordForm employee={resetting} onSave={handleResetPassword} />
      </Modal>
    </div>
  )
}

function ResetPasswordForm({ employee, onSave }: { employee: Employee | null; onSave: (employee: Employee, password: string) => Promise<void> }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setSaving(true)
    setError('')
    try {
      await onSave(employee!, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar contraseña')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-500 text-sm mb-1">Nueva contraseña *</label>
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label className="block text-gray-500 text-sm mb-1">Confirmar contraseña *</label>
        <input
          type="password"
          value={confirm}
          onChange={e => { setConfirm(e.target.value); setError('') }}
          required
          placeholder="Repite la contraseña"
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || !password || !confirm}
          className="rounded-lg bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
      </div>
    </form>
  )
}

function EmployeeForm({ employee, onSave }: { employee: Employee | null; onSave: (data: Partial<Employee> & { createUser?: boolean; password?: string }) => Promise<void> }) {
  const [form, setForm] = useState({
    fullName: employee?.fullName || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
  })
  const [createUser, setCreateUser] = useState(false)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const isNew = !employee?._id

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName.trim() || !form.email.trim()) return
    if (createUser && !password) return
    setSaving(true)
    try {
      if (isNew && createUser) {
        await onSave({ ...form, createUser: true, password })
      } else {
        await onSave(form)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-500 text-sm mb-1">Nombre completo *</label>
        <input
          type="text"
          value={form.fullName}
          onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
          required
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label className="block text-gray-500 text-sm mb-1">Email *</label>
        <input
          type="email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label className="block text-gray-500 text-sm mb-1">Teléfono</label>
        <input
          type="text"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>

      {isNew && (
        <div className="border-t border-gray-100 pt-4 space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={createUser}
              onChange={e => setCreateUser(e.target.checked)}
              className="rounded border-gray-300 text-accent focus:ring-accent/40"
            />
            <span className="text-sm text-gray-700 font-medium">Crear cuenta de usuario</span>
          </label>

          {createUser && (
            <div>
              <label className="block text-gray-500 text-sm mb-1">Contraseña *</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">
                El empleado usará su email y esta contraseña para iniciar sesión con rol de empleado
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || !form.fullName.trim() || !form.email.trim() || (createUser && !password)}
          className="rounded-lg bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : employee?._id ? 'Guardar cambios' : 'Crear empleado'}
        </button>
      </div>
    </form>
  )
}