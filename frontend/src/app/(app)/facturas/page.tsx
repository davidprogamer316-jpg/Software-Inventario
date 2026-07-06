'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthContext'
import type { Invoice } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FileText, Eye, Download } from 'lucide-react'

export default function InvoiceListPage() {
  const { token } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.get<Invoice[]>('/invoices', token)
      .then(setInvoices)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  async function handleDownload(id: string) {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    }
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
        <h1 className="text-2xl font-heading font-semibold text-brand">Facturas</h1>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay facturas aún</p>
          <p className="text-gray-400 text-sm mt-1">
            Las facturas se generan desde una venta
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => {
            const cancelled = inv.status === 'cancelled'
            return (
              <div
                key={inv._id}
                className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-4 ${
                  cancelled ? 'border-red-200 opacity-70' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    cancelled ? 'bg-red-50 text-red-400' : 'bg-accent/10 text-accent'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-brand truncate">{inv.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">
                      {inv.customerName || 'Consumidor Final'} &middot; {formatDate(inv.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="font-semibold text-brand">{formatCurrency(inv.total)}</p>
                    <p className={`text-xs font-medium ${
                      cancelled ? 'text-red-500' : 'text-green-600'
                    }`}>
                      {cancelled ? 'Cancelada' : 'Emitida'}
                    </p>
                  </div>

                  <Link
                    href={`/facturas/${inv._id}`}
                    className="p-2 rounded-lg text-gray-400 hover:text-accent hover:bg-accent/5 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleDownload(inv._id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-accent hover:bg-accent/5 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && invoices.length > 0 && (
        <p className="text-center text-xs text-gray-400 mt-6">
          {invoices.length} factura{invoices.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
