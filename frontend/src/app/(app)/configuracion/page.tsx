'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import type { Config } from '@/lib/types'
import { Building, Save } from 'lucide-react'

export default function ConfigPage() {
  const { token } = useAuth()
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!token) return
    api.get<Config>('/config', token)
      .then(setConfig)
      .finally(() => setLoading(false))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!config) return
    setSaving(true)
    try {
      const updated = await api.put<Config>('/config', config, token!)
      setConfig(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  function update(field: keyof Config, value: string | number) {
    if (!config) return
    setConfig({ ...config, [field]: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Building className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-heading font-semibold text-text-body">Configuración</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-heading font-semibold text-text-body mb-4 uppercase tracking-wider">
            Datos de la empresa
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-text-muted text-sm mb-1">Nombre de la empresa</label>
              <input
                type="text"
                value={config?.companyName || ''}
                onChange={e => update('companyName', e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-text-muted text-sm mb-1">NIT</label>
              <input
                type="text"
                value={config?.nit || ''}
                onChange={e => update('nit', e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-text-muted text-sm mb-1">Teléfono</label>
              <input
                type="text"
                value={config?.phone || ''}
                onChange={e => update('phone', e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-text-muted text-sm mb-1">Dirección</label>
              <input
                type="text"
                value={config?.address || ''}
                onChange={e => update('address', e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-text-muted text-sm mb-1">Ciudad</label>
              <input
                type="text"
                value={config?.city || ''}
                onChange={e => update('city', e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
              />
            </div>
          </div>
        </section>

        <section className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-heading font-semibold text-text-body mb-4 uppercase tracking-wider">
            Facturación
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-text-muted text-sm mb-1">IVA por defecto (%)</label>
              <input
                type="number"
                value={config?.defaultTaxRate || 0}
                onChange={e => update('defaultTaxRate', parseFloat(e.target.value) || 0)}
                min={0}
                max={100}
                step={0.01}
                className="w-full max-w-xs rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-text-muted text-sm mb-1">Pie de página en facturas</label>
              <textarea
                value={config?.invoiceFooter || ''}
                onChange={e => update('invoiceFooter', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors resize-none"
              />
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">Cambios guardados</span>
          )}
        </div>
      </form>
    </div>
  )
}
