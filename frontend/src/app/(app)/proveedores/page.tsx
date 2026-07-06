'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import type { Provider } from '@/lib/types'
import Modal from '@/components/Modal'
import { Plus, Pencil, Search, Truck } from 'lucide-react'

export default function ProvidersPage() {
  const { token, isAdmin } = useAuth()
  const [providers, setProviders] = useState<Provider[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Provider | null>(null)

  useEffect(() => {
    if (!token) return
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    api.get<Provider[]>(`/providers${params}`, token)
      .then(setProviders)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, search])

  async function handleSave(form: Partial<Provider>) {
    if (editing?._id) {
      const updated = await api.put<Provider>(`/providers/${editing._id}`, form, token!)
      setProviders(prev => prev.map(p => p._id === updated._id ? updated : p))
    } else {
      const created = await api.post<Provider>('/providers', form, token!)
      setProviders(prev => [created, ...prev])
    }
    setEditing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-semibold text-brand">Proveedores</h1>
        {isAdmin && (
          <button
            onClick={() => setEditing({} as Provider)}
            className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar proveedor
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
      ) : providers.length === 0 ? (
        <div className="text-center py-20">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay proveedores registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {providers.map(p => (
            <div key={p._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-brand">{p.name}</p>
                <div className="flex gap-4 mt-1 text-sm text-gray-500">
                  {p.contactName && <span>{p.contactName}</span>}
                  {p.phone && <span>{p.phone}</span>}
                  {p.email && <span className="hidden sm:inline">{p.email}</span>}
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setEditing(p)}
                  className="p-2 rounded-lg text-gray-400 hover:text-accent hover:bg-accent/5 transition-colors shrink-0"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?._id ? 'Editar proveedor' : 'Nuevo proveedor'}
      >
        <ProviderForm provider={editing} onSave={handleSave} />
      </Modal>
    </div>
  )
}

function ProviderForm({ provider, onSave }: { provider: Provider | null; onSave: (data: Partial<Provider>) => Promise<void> }) {
  const [form, setForm] = useState({
    name: provider?.name || '',
    contactName: provider?.contactName || '',
    phone: provider?.phone || '',
    email: provider?.email || '',
    address: provider?.address || '',
    notes: provider?.notes || '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-500 text-sm mb-1">Nombre *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-500 text-sm mb-1">Contacto</label>
          <input
            type="text"
            value={form.contactName}
            onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
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
      </div>
      <div>
        <label className="block text-gray-500 text-sm mb-1">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label className="block text-gray-500 text-sm mb-1">Dirección</label>
        <input
          type="text"
          value={form.address}
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label className="block text-gray-500 text-sm mb-1">Notas</label>
        <textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors resize-none h-20"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className="rounded-lg bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : provider?._id ? 'Guardar cambios' : 'Crear proveedor'}
        </button>
      </div>
    </form>
  )
}
