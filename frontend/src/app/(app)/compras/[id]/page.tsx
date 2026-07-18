'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/AuthContext'
import { api, HttpError } from '@/lib/api'
import type { Purchase, PaymentMethod } from '@/lib/types'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { ArrowLeft, ShoppingBag, Plus, Lock, FileText, Pencil, Check, X, Download } from 'lucide-react'

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
}

export default function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token, isAdmin } = useAuth()
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [receiving, setReceiving] = useState(false)

  const [showPayment, setShowPayment] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash')
  const [payRef, setPayRef] = useState('')
  const [paying, setPaying] = useState(false)
  const [closing, setClosing] = useState(false)

  const [editNotes, setEditNotes] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editCosts, setEditCosts] = useState(false)
  const [costInputs, setCostInputs] = useState<Record<string, string>>({})
  const [savingCosts, setSavingCosts] = useState(false)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)

  useEffect(() => {
    if (!token) return
    api.get<Purchase>(`/purchases/${id}`, token)
      .then(setPurchase)
      .catch(() => router.push('/compras'))
      .finally(() => setLoading(false))
  }, [id, router, token])

  async function handleReceive() {
    setReceiving(true)
    try {
      const updated = await api.patch<Purchase>(`/purchases/${id}/receive`, {}, token!)
      setPurchase(updated)
    } finally {
      setReceiving(false)
    }
  }

  async function handleRecordPayment() {
    const amount = parseFloat(payAmount)
    if (isNaN(amount) || amount <= 0) return
    setPaying(true)
    try {
      const updated = await api.post<Purchase>(`/purchases/${id}/payments`, {
        amount,
        method: payMethod,
        reference: payRef || undefined,
      }, token!)
      setPurchase(updated)
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
      const updated = await api.patch<Purchase>(`/purchases/${id}/close`, {}, token!)
      setPurchase(updated)
    } catch (err) {
      if (err instanceof HttpError) {
        alert(err.message)
      }
    } finally {
      setClosing(false)
    }
  }

  function startEdit() {
    if (!purchase) return
    setEditNotes(purchase.notes || '')
    setEditing(true)
  }

  async function handleSaveEdit() {
    setSaving(true)
    try {
      const updated = await api.put<Purchase>(`/purchases/${id}`, {
        notes: editNotes || undefined,
      }, token!)
      setPurchase(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function startEditCosts() {
    if (!purchase) return
    const inputs: Record<string, string> = {}
    for (const item of purchase.items) {
      inputs[item.productId] = item.unitCost.toString()
    }
    setCostInputs(inputs)
    setEditCosts(true)
  }

  async function handleSaveCosts() {
    if (!purchase) return
    setSavingCosts(true)
    try {
      const items = purchase.items.map(item => ({
        productId: item.productId,
        unitCost: parseFloat(costInputs[item.productId]) || 0,
      }))
      const updated = await api.put<Purchase>(`/purchases/${id}/items`, { items }, token!)
      setPurchase(updated)
      setEditCosts(false)
    } catch (err) {
      if (err instanceof HttpError) {
        alert(err.message)
      }
    } finally {
      setSavingCosts(false)
    }
  }

  async function handleGenerateInvoice() {
    if (!token) return
    setGeneratingInvoice(true)
    try {
      const invoice = await api.post<{ _id: string }>('/purchase-invoices/from-purchase', { purchaseId: id }, token)
      const updated = await api.get<Purchase>(`/purchases/${id}`, token)
      setPurchase(updated)
      router.push(`/compras/facturas/${invoice._id}`)
    } catch (err) {
      if (err instanceof HttpError) {
        alert(err.message)
      }
    } finally {
      setGeneratingInvoice(false)
    }
  }

  async function handleDownload(id: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/purchase-invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-compra-${id}.pdf`
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

  if (!purchase) return null

  const closed = purchase.closed
  const balance = Math.max(0, Math.round((purchase.total - purchase.paidAmount) * 100) / 100)
  const payProgress = purchase.total > 0
    ? Math.min(Math.floor((purchase.paidAmount / purchase.total) * 100), 100)
    : 0

  const statusText = purchase.received && purchase.paymentStatus === 'paid'
    ? 'Recibida y pagada'
    : purchase.received
    ? 'Recibida'
    : purchase.paymentStatus === 'paid'
    ? 'Pagada'
    : purchase.paymentStatus === 'partial'
    ? 'Abonada'
    : 'Pendiente'

  const statusColor = purchase.received
    ? 'text-green-600'
    : purchase.paymentStatus === 'paid'
    ? 'text-green-600'
    : purchase.paymentStatus === 'partial'
    ? 'text-amber-600'
    : 'text-red-500'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/compras')}
            className="p-2 rounded-lg text-gray-400 hover:text-accent hover:bg-accent/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <ShoppingBag className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-heading font-semibold text-brand">Compra</h1>
        </div>
        <div className="flex items-center gap-2">
          {purchase.purchaseInvoiceId ? (
            <>
              <button
                onClick={() => router.push(`/compras/facturas/${purchase.purchaseInvoiceId}`)}
                className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm font-medium hover:bg-accent/20 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Ver factura
              </button>
              <button
                onClick={() => handleDownload(purchase.purchaseInvoiceId!)}
                className="p-2 text-gray-400 hover:text-accent transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={handleGenerateInvoice}
              disabled={generatingInvoice}
              className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {generatingInvoice ? 'Generando...' : 'Factura de compra'}
            </button>
          )}
          {!closed && balance <= 0 && (
            <button
              onClick={handleClose}
              disabled={closing}
              className="rounded-lg border border-green-200 text-green-600 px-4 py-2 text-sm hover:bg-green-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {closing ? 'Cerrando...' : 'Cerrar'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Proveedor</p>
            <p className="font-medium text-brand">{purchase.providerName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Fecha</p>
            <p className="font-medium text-brand">{formatDate(purchase.date)}</p>
            <p className={`text-sm font-bold mt-1 ${statusColor}`}>{statusText}</p>
          </div>
        </div>

        {closed && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <Lock className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-green-700 font-medium text-sm">Compra cerrada — no se pueden registrar más pagos ni cambios</p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado de pago</h3>
            {!closed && (
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
                    purchase.paidAmount >= purchase.total ? 'bg-green-500' : 'bg-accent'
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
                <p className="text-gray-500">Total</p>
                <p className="font-semibold text-brand">{formatCurrency(purchase.total)}</p>
              </div>
              <div>
                <p className="text-gray-500">Pagado</p>
                <p className="font-semibold text-green-600">{formatCurrency(purchase.paidAmount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Saldo</p>
                <p className={`font-semibold ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {balance > 0 ? formatCurrency(balance) : 'Cancelado'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!purchase.received && purchase.paymentStatus === 'paid' && (
          <button
            onClick={handleReceive}
            disabled={receiving}
            className="w-full rounded-lg bg-accent text-white px-4 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            {receiving ? 'Guardando...' : 'Marcar como recibida'}
          </button>
        )}

        {!purchase.received && purchase.paymentStatus !== 'paid' && (
          <div className="w-full rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 text-center">
            La compra debe estar totalmente pagada antes de recibirla
          </div>
        )}

        {purchase.payments.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Historial de pagos
            </h3>
            <div className="space-y-2">
              {purchase.payments.map((p, i) => (
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
                  <span className="text-sm font-semibold text-red-600">
                    -{formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Productos</h3>
            {!editCosts && !purchase.received && (
              <button
                onClick={startEditCosts}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-accent transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar costos
              </button>
            )}
          </div>

          {editCosts ? (
            <div className="space-y-3">
              {purchase.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand">{item.productName}</p>
                    <p className="text-xs text-gray-400">Cant: {item.quantity}</p>
                  </div>
                  <div className="w-28">
                    <input
                      type="number"
                      value={costInputs[item.productId] || '0'}
                      onChange={e => setCostInputs(prev => ({ ...prev, [item.productId]: e.target.value }))}
                      min={0}
                      step={0.01}
                      className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
                    />
                  </div>
                </div>
              ))}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleSaveCosts}
                  disabled={savingCosts}
                  className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  {savingCosts ? 'Guardando...' : 'Guardar costos'}
                </button>
                <button
                  onClick={() => setEditCosts(false)}
                  className="rounded-lg border border-gray-200 text-gray-600 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-gray-400 font-medium">Producto</th>
                  <th className="text-right pb-2 text-gray-400 font-medium">Cant.</th>
                  <th className="text-right pb-2 text-gray-400 font-medium">C. Unit</th>
                  <th className="text-right pb-2 text-gray-400 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-brand">{item.productName}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">
                      {item.unitCost > 0 ? formatCurrency(item.unitCost) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {item.subtotal > 0 ? formatCurrency(item.subtotal) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex justify-end">
            <div className="w-64 flex justify-between text-lg font-heading font-semibold text-brand">
              <span>Total</span>
              <span>{purchase.total > 0 ? formatCurrency(purchase.total) : (
                <span className="text-gray-300">—</span>
              )}</span>
            </div>
          </div>
        </div>

        {editing ? (
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Editar notas</h3>
            <div>
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-gray-200 text-gray-600 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
            <div>
              {purchase.notes && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notas</h3>
                  <p className="text-sm text-gray-600">{purchase.notes}</p>
                </div>
              )}
            </div>
            {!purchase.received && (
              <button
                onClick={startEdit}
                className="rounded-lg border border-gray-200 text-gray-600 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Editar notas
              </button>
            )}
          </div>
        )}
      </div>

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
