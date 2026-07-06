'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import type { Sale } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Eye, Search, AlertCircle } from 'lucide-react'

export default function SalesListPage() {
  const { token, isAdmin } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)

    api.get<Sale[]>(`/sales?${params.toString()}`, token)
      .then(setSales)
      .finally(() => setLoading(false))
  }, [token, startDate, endDate])

  const paymentLabels: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    card: 'Tarjeta',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-semibold text-text-body">Ventas</h1>
        <Link
          href="/ventas/nueva"
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva venta
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="rounded-lg border border-border bg-bg-page px-3.5 py-2 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
          />
        </div>
        <div className="relative">
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="rounded-lg border border-border bg-bg-page px-3.5 py-2 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3">Fecha</th>
                <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3">Cliente</th>
                {isAdmin && <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3 hidden sm:table-cell">Empleado</th>}
                <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3 hidden sm:table-cell">Pago</th>
                <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3">Total</th>
                <th className="text-center text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3">Estado</th>
                <th className="px-6 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale._id} className="border-b border-border even:bg-bg-page">
                  <td className="px-6 py-3 text-text-body">{formatDate(sale.date)}</td>
                  <td className="px-6 py-3 text-text-body">
                    {sale.customerName || <span className="text-text-muted">—</span>}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-3 text-text-muted hidden sm:table-cell">
                      {(sale as any).employeeId?.fullName || '—'}
                    </td>
                  )}
                  <td className="px-6 py-3 text-text-muted hidden sm:table-cell">
                    {paymentLabels[sale.paymentMethod] || sale.paymentMethod}
                  </td>
                  <td className="px-6 py-3 text-text-body text-right font-medium">
                    {formatCurrency(sale.total)}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {sale.status === 'voided' ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-500">
                        <AlertCircle className="w-3 h-3" />
                        Anulada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-700">
                        Completa
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <Link
                      href={`/ventas/${sale._id}`}
                      className="p-1.5 text-text-muted hover:text-accent transition-colors inline-flex"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-text-muted">
                    No hay ventas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
