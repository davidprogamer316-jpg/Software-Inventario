'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import type { Purchase } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, ShoppingBag, Eye } from 'lucide-react'

export default function PurchasesPage() {
  const { token, isAdmin } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.get<Purchase[]>('/purchases', token)
      .then(setPurchases)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

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
        {isAdmin && (
          <Link
            href="/compras/nueva"
            className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva compra
          </Link>
        )}
      </div>

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
                  <p className={`text-xs font-medium ${p.paid ? 'text-green-600' : 'text-amber-600'}`}>
                    {p.paid ? 'Pagada' : 'Pendiente'}
                  </p>
                </div>
                {isAdmin && (
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
