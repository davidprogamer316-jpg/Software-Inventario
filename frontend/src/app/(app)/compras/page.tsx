'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import type { Purchase, Provider } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, ShoppingBag, Eye, Filter, X } from 'lucide-react'

export default function PurchasesPage() {
  const { token, isAdmin, loading: authLoading } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [filterDate, setFilterDate] = useState('')
  const [filterProvider, setFilterProvider] = useState('')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('')
  const [providers, setProviders] = useState<Provider[]>([])

  const hasActiveFilters = filterDate || filterProvider || filterPaymentStatus

  useEffect(() => {
    if (!token) return
    api.get<Provider[]>('/providers', token).then(setProviders).catch(() => {})
  }, [token])

  useEffect(() => {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams()
    if (filterDate) {
      params.set('startDate', filterDate)
      const next = new Date(filterDate)
      next.setDate(next.getDate() + 1)
      params.set('endDate', next.toISOString().slice(0, 10))
    }
    if (filterProvider) params.set('providerId', filterProvider)
    if (filterPaymentStatus) params.set('paymentStatus', filterPaymentStatus)

    api.get<Purchase[]>(`/purchases?${params.toString()}`, token)
      .then(setPurchases)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, filterDate, filterProvider, filterPaymentStatus])

  function clearFilters() {
    setFilterDate('')
    setFilterProvider('')
    setFilterPaymentStatus('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-r-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-semibold text-brand">Compras</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              filtersOpen || hasActiveFilters
                ? 'border-accent text-accent bg-accent/5'
                : 'border-border text-text-muted hover:bg-bg-page'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-accent" />
            )}
          </button>
          {!authLoading && isAdmin && (
            <Link
              href="/compras/nueva"
              className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva compra
            </Link>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="bg-surface rounded-xl border border-border p-4 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-body">Filtros</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-text-muted hover:text-accent flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="rounded-lg border border-border bg-bg-page px-3.5 py-2 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
            />
            <select
              value={filterProvider}
              onChange={e => setFilterProvider(e.target.value)}
              className="rounded-lg border border-border bg-bg-page px-3 py-2 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
            >
              <option value="">Proveedor</option>
              {providers.filter(p => p.active).map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <select
              value={filterPaymentStatus}
              onChange={e => setFilterPaymentStatus(e.target.value)}
              className="rounded-lg border border-border bg-bg-page px-3 py-2 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
            >
              <option value="">Estado de pago</option>
              <option value="pending">Pendiente</option>
              <option value="partial">Abonada</option>
              <option value="paid">Pagada</option>
            </select>
          </div>
        </div>
      )}

      {purchases.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay compras registradas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {purchases.map(p => (
            <div key={p._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-brand">{p.providerName}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formatDate(p.date)} &middot; {p.items.length} producto{p.items.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="font-semibold text-brand">{formatCurrency(p.total)}</p>
                  <p className={`text-xs font-medium mt-0.5 ${
                    p.paymentStatus === 'pending' ? 'text-red-500' :
                    p.paymentStatus === 'partial' ? 'text-amber-600' :
                    'text-green-600'
                  }`}>
                    {p.paymentStatus === 'pending' ? 'Pendiente' :
                     p.paymentStatus === 'partial' ? 'Abonada' :
                     'Pagada'}
                  </p>
                  <p className={`text-xs font-medium ${p.received ? 'text-green-600' : 'text-gray-400'}`}>
                    {p.received ? 'Recibida' : 'Por recibir'}
                  </p>
                </div>
                {!authLoading && isAdmin && (
                  <Link
                    href={`/compras/${p._id}`}
                    className="p-2 rounded-lg text-gray-400 hover:text-accent hover:bg-accent/5 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
