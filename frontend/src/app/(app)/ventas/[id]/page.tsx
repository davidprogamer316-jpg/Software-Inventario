'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/AuthContext'
import { api, HttpError } from '@/lib/api'
import type { Sale, PaymentMethod } from '@/lib/types'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { formatQuantity } from '@/components/QuantityInput'
import Modal from '@/components/Modal'
import { ChevronDown, AlertCircle, FileText, Plus, Lock } from 'lucide-react'

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
}

const paymentStatusLabels: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Pago parcial',
  paid: 'Cancelado',
}

const paymentStatusColors: Record<string, string> = {
  pending: 'text-red-500',
  partial: 'text-amber-600',
  paid: 'text-green-600',
}

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { token, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [showVoid, setShowVoid] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [voiding, setVoiding] = useState(false)
  const [itemsOpen, setItemsOpen] = useState(true)
  const [creatingInvoice, setCreatingInvoice] = useState(false)

  const [showPayment, setShowPayment] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash')
  const [payRef, setPayRef] = useState('')
  const [paying, setPaying] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!token || !id) return
    api.get<Sale>(`/sales/${id}`, token)
      .then(setSale)
      .finally(() => setLoading(false))
  }, [token, id])

  async function handleCreateInvoice() {
    if (!token) return
    setCreatingInvoice(true)
    try {
      const invoice = await api.post<{ _id: string }>('/invoices/from-sale', { saleId: id }, token)
      router.push(`/facturas/${invoice._id}`)
    } catch {
      setCreatingInvoice(false)
    }
  }

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

  async function handleRecordPayment() {
    const amount = parseFloat(payAmount)
    if (isNaN(amount) || amount <= 0) return
    setPaying(true)
    try {
      const updated = await api.post<Sale>(`/sales/${id}/payments`, {
        amount,
        method: payMethod,
        reference: payRef || undefined,
      }, token!)
      setSale(updated)
      setShowPayment(false)
      setPayAmount('')
      setPayRef('')
    } catch (err) {
      if (err instanceof HttpError) {
        alert(err.message)
      }
    } finally {
      setPaying(false)
    }
  }

  async function handleClose() {
    setClosing(true)
    try {
      const updated = await api.patch<Sale>(`/sales/${id}/close`, {}, token!)
      setSale(updated)
    } catch (err) {
      if (err instanceof HttpError) {
        alert(err.message)
      }
    } finally {
      setClosing(false)
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

  const voided = sale.status === 'voided'
  const closed = sale.closed
  const balance = Math.max(0, Math.round((sale.total - sale.paidAmount) * 100) / 100)
  const payProgress = sale.total > 0
    ? Math.min(Math.floor((sale.paidAmount / sale.total) * 100), 100)
    : 0

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-text-body">Venta</h1>
          <p className="text-text-muted text-sm mt-1">{formatDate(sale.date)}</p>
        </div>
        <div className="flex items-center gap-2">
          {!authLoading && isAdmin && !voided && !closed && (
            <button
              onClick={() => setShowVoid(true)}
              className="rounded-lg border border-border text-text-muted px-4 py-2 text-sm hover:bg-bg-page transition-colors"
            >
              Anular
            </button>
          )}
          {!authLoading && isAdmin && !voided && !closed && balance <= 0 && (
            <button
              onClick={handleClose}
              disabled={closing}
              className="rounded-lg border border-green-200 text-green-600 px-4 py-2 text-sm hover:bg-green-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {closing ? 'Cerrando...' : 'Cerrar venta'}
            </button>
          )}
          {sale.status === 'completed' && (
            sale.invoiceId ? (
              <button
                onClick={() => router.push(`/facturas/${sale.invoiceId}`)}
                className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Ver factura
              </button>
            ) : (
              <button
                onClick={handleCreateInvoice}
                disabled={creatingInvoice}
                className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {creatingInvoice ? 'Generando...' : 'Factura'}
              </button>
            )
          )}
        </div>
      </div>

      {voided && (
        <div className="bg-gray-100 text-gray-500 rounded-lg px-4 py-3 text-sm mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Venta anulada: {sale.voidedReason}
        </div>
      )}

      {closed && !voided && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <Lock className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <p className="text-green-700 font-medium text-sm">Venta cerrada — no se pueden registrar más pagos ni cambios</p>
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
            <span className="text-text-body text-sm">{paymentMethodLabels[sale.paymentMethod]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted text-sm">Estado</span>
            <span className={`text-sm font-medium ${
              voided ? 'text-gray-500' : sale.paymentStatus === 'pending' ? 'text-red-500' : sale.paymentStatus === 'partial' ? 'text-amber-600' : 'text-green-600'
            }`}>
              {voided ? 'Anulada' : sale.paymentStatus === 'pending' ? 'Deuda' : sale.paymentStatus === 'partial' ? 'Abonada' : 'Pagada'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Estado de pago</h3>
            {!voided && !closed && (
              <button
                onClick={() => setShowPayment(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Registrar pago
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    sale.paidAmount >= sale.total ? 'bg-green-500' : 'bg-accent'
                  }`}
                  style={{ width: `${payProgress}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600 w-16 text-right">
                {payProgress}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-text-muted">Total</p>
                <p className="font-semibold text-text-body">{formatCurrency(sale.total)}</p>
              </div>
              <div>
                <p className="text-text-muted">Pagado</p>
                <p className="font-semibold text-green-600">{formatCurrency(sale.paidAmount)}</p>
              </div>
              <div>
                <p className="text-text-muted">Saldo</p>
                <p className={`font-semibold ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {balance > 0 ? formatCurrency(balance) : 'Cancelado'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sale.payments.length > 0 && (
        <div className="bg-surface rounded-xl border border-border shadow-sm mb-6">
          <div className="px-6 py-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Historial de pagos
            </h3>
            <div className="space-y-2">
              {sale.payments.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{formatDateTime(p.date)}</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {paymentMethodLabels[p.method]}
                    </span>
                    {p.reference && (
                      <span className="text-xs text-gray-400">Ref: {p.reference}</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-lg font-heading font-semibold text-brand mb-4">Registrar pago</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Monto</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={balance}
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent/50"
                  />
                  {balance > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(balance.toString())}
                      className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors shrink-0"
                    >
                      Pagar saldo
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Saldo pendiente: {formatCurrency(balance)}</p>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">Método de pago</label>
                <div className="flex gap-2">
                  {(['cash', 'transfer', 'card'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayMethod(method)}
                      className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        payMethod === method
                          ? 'bg-accent text-white'
                          : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {paymentMethodLabels[method]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">Referencia (opcional)</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  placeholder="Nº de recibo, transf., etc."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent/50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowPayment(false); setPayAmount(''); setPayRef('') }}
                className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={!payAmount || parseFloat(payAmount) <= 0 || parseFloat(payAmount) > balance || paying}
                className="px-4 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {paying ? 'Guardando...' : 'Registrar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
