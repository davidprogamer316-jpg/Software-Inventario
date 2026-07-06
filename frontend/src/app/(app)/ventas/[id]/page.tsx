'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import type { Sale } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { formatQuantity } from '@/components/QuantityInput'
import Modal from '@/components/Modal'
import { ChevronDown, AlertCircle, FileText } from 'lucide-react'

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { token, isAdmin } = useAuth()
  const router = useRouter()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [showVoid, setShowVoid] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [voiding, setVoiding] = useState(false)
  const [itemsOpen, setItemsOpen] = useState(true)

  useEffect(() => {
    if (!token || !id) return
    api.get<Sale>(`/sales/${id}`, token)
      .then(setSale)
      .finally(() => setLoading(false))
  }, [token, id])

  async function handleVoid() {
    if (!voidReason.trim()) return
    setVoiding(true)
    try {
      const updated = await api.patch<Sale>(`/sales/${id}/void`, { reason: voidReason }, token!)
      setSale(updated)
      setShowVoid(false)
    } finally {
      setVoiding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="text-center py-12 text-text-muted">Venta no encontrada</div>
    )
  }

  const paymentLabels: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    card: 'Tarjeta',
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-text-body">Venta</h1>
          <p className="text-text-muted text-sm mt-1">{formatDate(sale.date)}</p>
        </div>
        <div className="flex items-center gap-2">
          {sale.status === 'completed' && isAdmin && (
            <button
              onClick={() => setShowVoid(true)}
              className="rounded-lg border border-border text-text-muted px-4 py-2 text-sm hover:bg-bg-page transition-colors"
            >
              Anular venta
            </button>
          )}
          <button className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Factura
          </button>
        </div>
      </div>

      {sale.status === 'voided' && (
        <div className="bg-gray-100 text-gray-500 rounded-lg px-4 py-3 text-sm mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Venta anulada: {sale.voidedReason}
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border shadow-sm mb-6">
        <div className="px-6 py-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-text-muted text-sm">Cliente</span>
            <span className="text-text-body text-sm">{sale.customerName || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted text-sm">Teléfono</span>
            <span className="text-text-body text-sm">{sale.customerPhone || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted text-sm">Método de pago</span>
            <span className="text-text-body text-sm">{paymentLabels[sale.paymentMethod]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted text-sm">Estado</span>
            <span className={`text-sm font-medium ${sale.status === 'voided' ? 'text-gray-500' : 'text-success'}`}>
              {sale.status === 'voided' ? 'Anulada' : 'Completada'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm mb-6">
        <button
          onClick={() => setItemsOpen(!itemsOpen)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-bg-page transition-colors"
        >
          <h2 className="text-text-body font-heading font-semibold">Productos</h2>
          <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${itemsOpen ? '' : '-rotate-90'}`} />
        </button>
        {itemsOpen && (
          <div className="border-t border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3">Producto</th>
                  <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3">Cantidad</th>
                  <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3">Precio</th>
                  <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-border last:border-b-0 even:bg-bg-page">
                    <td className="px-6 py-3 text-text-body">{item.productName}</td>
                    <td className="px-6 py-3 text-right font-medium">{formatQuantity(item.quantity, item.saleUnit)}</td>
                    <td className="px-6 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-6 py-3 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={3} className="px-6 py-4 text-right text-text-body font-heading font-semibold">Total</td>
                  <td className="px-6 py-4 text-right text-lg font-heading font-semibold text-text-body">
                    {formatCurrency(sale.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={showVoid}
        onClose={() => setShowVoid(false)}
        title="Anular venta"
      >
        <p className="text-text-muted text-sm mb-4">
          Esta acción revertirá el inventario descontado y marcará la venta como anulada. Esta operación no se puede deshacer.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-text-muted text-sm mb-1">Motivo de anulación *</label>
            <input
              type="text"
              value={voidReason}
              onChange={e => setVoidReason(e.target.value)}
              placeholder="Ej: Venta cancelada por el cliente"
              className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowVoid(false)}
              className="rounded-lg border border-border text-text-muted px-4 py-2 text-sm hover:bg-bg-page transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleVoid}
              disabled={voiding || !voidReason.trim()}
              className="rounded-lg bg-danger text-white px-4 py-2 text-sm font-medium hover:bg-danger/90 transition-colors disabled:opacity-50"
            >
              {voiding ? 'Anulando...' : 'Confirmar anulación'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
