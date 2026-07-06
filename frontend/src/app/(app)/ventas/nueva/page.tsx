'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import type { Product } from '@/lib/types'
import ProductAutocomplete from '@/components/ProductAutocomplete'
import QuantityInput, { formatQuantity } from '@/components/QuantityInput'
import { formatCurrency } from '@/lib/utils'
import { Trash2, ShoppingCart, Plus } from 'lucide-react'

interface LineItem {
  product: Product
  quantity: number
  unitPrice: number
  subtotal: number
}

export default function NewSalePage() {
  const { token } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<LineItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addProduct(product: Product) {
    const existing = items.find(i => i.product._id === product._id)
    if (existing) {
      setItems(prev =>
        prev.map(i =>
          i.product._id === product._id
            ? { ...i, quantity: i.quantity + 1, subtotal: Math.round((i.quantity + 1) * i.unitPrice * 100) / 100 }
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

  function updateUnitPrice(productId: string, unitPrice: number) {
    setItems(prev =>
      prev.map(i =>
        i.product._id === productId
          ? { ...i, unitPrice, subtotal: Math.round(i.quantity * unitPrice * 100) / 100 }
          : i
      )
    )
  }

  function removeItem(productId: string) {
    setItems(prev => prev.filter(i => i.product._id !== productId))
  }

  const total = items.reduce((sum, i) => sum + i.subtotal, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return
    setSaving(true)
    setError('')

    try {
      const sale = await api.post<{ _id: string }>('/sales', {
        items: items.map(i => ({
          productId: i.product._id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        paymentMethod,
      }, token!)
      router.push(`/ventas/${sale._id}`)
    } catch (err: any) {
      setError(err.message || 'Error al crear la venta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-heading font-semibold text-text-body mb-6">
        Nueva venta
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <label className="block text-text-muted text-sm mb-2">Producto</label>
          <ProductAutocomplete
            onSelect={addProduct}
            token={token!}
            excludeOutOfStock
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
                    min={0.01}
                    max={item.product.stockQuantity}
                  />
                </div>

                <div className="w-28 text-right">
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={e => updateUnitPrice(item.product._id, parseFloat(e.target.value) || 0)}
                    step={0.01}
                    min={0}
                    className="w-full rounded-lg border border-border bg-bg-page px-3 py-2 text-sm text-text-body text-right outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
                  />
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
            <label className="block text-text-muted text-sm mb-1">Método de pago</label>
            <div className="flex gap-2">
              {(['cash', 'transfer', 'card'] as const).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    paymentMethod === method
                      ? 'bg-accent text-white'
                      : 'border border-border text-text-muted hover:bg-bg-page'
                  }`}
                >
                  {method === 'cash' ? 'Efectivo' : method === 'transfer' ? 'Transferencia' : 'Tarjeta'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-muted text-sm">Total</span>
            <span className="text-2xl font-heading font-semibold text-text-body">
              {formatCurrency(total)}
            </span>
          </div>

          <button
            type="submit"
            disabled={saving || items.length === 0}
            className="w-full rounded-lg bg-accent text-white px-5 py-3 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Confirmar venta
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
