'use client'

import { useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import type { Product } from '@/lib/types'
import ProductAutocomplete from '@/components/ProductAutocomplete'
import QuantityInput from '@/components/QuantityInput'
import { formatCurrency } from '@/lib/utils'
import { Trash2, FileDown, AlertCircle } from 'lucide-react'

interface LineItem {
  product: Product
  quantity: number
  unitPrice: number
  subtotal: number
}

export default function CotizarPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<LineItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  function addProduct(product: Product) {
    const existing = items.find(i => i.product._id === product._id)
    if (existing) {
      const newQty = existing.quantity + 1
      setItems(prev =>
        prev.map(i =>
          i.product._id === product._id
            ? { ...i, quantity: newQty, subtotal: Math.round(newQty * i.unitPrice * 100) / 100 }
            : i
        )
      )
    } else {
      const subtotal = Math.round(product.salePrice * 100) / 100
      setItems(prev => [...prev, { product, quantity: 1, unitPrice: product.salePrice, subtotal }])
    }
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems(prev =>
      prev.map(i =>
        i.product._id === productId
          ? { ...i, quantity, subtotal: Math.round(quantity * i.unitPrice * 100) / 100 }
          : i
      )
    )
  }

  function removeItem(productId: string) {
    setItems(prev => prev.filter(i => i.product._id !== productId))
  }

  const total = items.reduce((sum, i) => sum + i.subtotal, 0)

  async function handleGenerate() {
    if (items.length === 0) return
    setGenerating(true)
    setError('')

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const res = await fetch(`${API_URL}/quotations/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map(i => ({
            productName: i.product.name,
            saleUnit: i.product.saleUnit,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            subtotal: i.subtotal,
          })),
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          notes: notes || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Error al generar cotización' }))
        throw new Error(err.message)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cotizacion-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Error al generar la cotización')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-heading font-semibold text-text-body mb-6">
        Cotizar
      </h1>

      <div className="space-y-6">
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <label className="block text-text-muted text-sm mb-2">Producto</label>
          <ProductAutocomplete
            onSelect={addProduct}
            token={token!}
          />
        </div>

        {items.length > 0 && (
          <div className="bg-surface rounded-xl border border-border shadow-sm divide-y divide-border">
            {items.map(item => (
              <div key={item.product._id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-text-body font-medium text-sm truncate">{item.product.name}</p>
                  <p className="text-text-muted text-xs">{item.product.sku}</p>
                </div>

                <div className="w-24">
                  <QuantityInput
                    value={item.quantity}
                    onChange={qty => updateQuantity(item.product._id, qty)}
                    saleUnit={item.product.saleUnit}
                    min={item.product.saleUnit === 'unit' ? 1 : 0.01}
                  />
                </div>

                <div className="w-24 text-right text-text-body font-medium text-sm">
                  {formatCurrency(item.unitPrice)}
                </div>

                <div className="w-24 text-right text-text-body font-medium text-sm">
                  {formatCurrency(item.subtotal)}
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.product._id)}
                  className="p-1.5 text-text-muted hover:text-danger transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-muted text-sm mb-1">Cliente (opcional)</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Nombre"
                className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-text-muted text-sm mb-1">Teléfono (opcional)</label>
              <input
                type="text"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="Teléfono"
                className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-text-muted text-sm mb-1">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Condiciones, observaciones, etc."
              rows={3}
              className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-muted text-sm">Total</span>
            <span className="text-2xl font-heading font-semibold text-text-body">
              {formatCurrency(total)}
            </span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || items.length === 0}
            className="w-full rounded-lg bg-accent text-white px-5 py-3 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Generar PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
