'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, HttpError } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthContext'
import type { Invoice } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FileText, Download, ArrowLeft, XCircle } from 'lucide-react'

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAdmin, token } = useAuth()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!token) return
    api.get<Invoice>(`/invoices/${id}`, token)
      .then(setInvoice)
      .catch(() => router.push('/facturas'))
      .finally(() => setLoading(false))
  }, [id, router, token])

  async function handleCancel() {
    if (!cancelReason.trim()) return
    setCancelling(true)
    try {
      const updated = await api.patch<Invoice>(`/invoices/${id}/cancel`, { reason: cancelReason }, token!)
      setInvoice(updated)
      setShowCancel(false)
      setCancelReason('')
    } catch (err) {
      if (err instanceof HttpError) {
        alert(err.message)
      }
    } finally {
      setCancelling(false)
    }
  }

  async function handleDownload() {
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

  if (!invoice) return null

  const cancelled = invoice.status === 'cancelled'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/facturas')}
            className="p-2 rounded-lg text-gray-400 hover:text-accent hover:bg-accent/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-heading font-semibold text-brand">
            Factura {invoice.invoiceNumber}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>

          {isAdmin && !cancelled && (
            <button
              onClick={() => setShowCancel(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-sm"
            >
              <XCircle className="w-4 h-4" />
              Cancelar
            </button>
          )}
        </div>
      </div>

      {cancelled && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium text-sm">Factura cancelada</p>
            {invoice.cancelledReason && (
              <p className="text-red-600 text-sm mt-0.5">{invoice.cancelledReason}</p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <div className="flex justify-between">
          <div>
            <h2 className="font-heading font-semibold text-brand text-lg">TuboGest</h2>
            <p className="text-sm text-gray-500 mt-1">NIT: 900.123.456-7</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Fecha: {formatDate(invoice.date)}</p>
            <p className={`text-sm font-medium mt-1 ${
              cancelled ? 'text-red-500' : 'text-green-600'
            }`}>
              {cancelled ? 'Cancelada' : 'Emitida'}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cliente</h3>
          <p className="text-brand font-medium">{invoice.customerName || 'Consumidor Final'}</p>
          {invoice.customerPhone && (
            <p className="text-sm text-gray-500">Tel: {invoice.customerPhone}</p>
          )}
          {invoice.customerDoc && (
            <p className="text-sm text-gray-500">NIT/CC: {invoice.customerDoc}</p>
          )}
          {invoice.customerAddress && (
            <p className="text-sm text-gray-500">Dir: {invoice.customerAddress}</p>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Productos</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-gray-400 font-medium">Cant.</th>
                <th className="text-left pb-2 text-gray-400 font-medium">Und</th>
                <th className="text-left pb-2 text-gray-400 font-medium">Producto</th>
                <th className="text-right pb-2 text-gray-400 font-medium">P. Unit</th>
                <th className="text-right pb-2 text-gray-400 font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => {
                const unitLabel = item.saleUnit === 'meter' ? 'm' : item.saleUnit === 'centimeter' ? 'cm' : 'uds'
                return (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2 text-gray-500">{unitLabel}</td>
                    <td className="py-2 text-brand">{item.productName}</td>
                    <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.taxRate > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>IVA ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(invoice.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-heading font-semibold text-brand border-t border-gray-200 pt-1.5">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notas</h3>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}
      </div>

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-lg font-heading font-semibold text-brand mb-4">Cancelar factura</h2>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Motivo de cancelación"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent/50 resize-none h-24"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setShowCancel(false); setCancelReason('') }}
                className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim() || cancelling}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
