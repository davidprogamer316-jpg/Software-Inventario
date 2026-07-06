'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/AuthContext'
import { api, HttpError } from '@/lib/api'
import type { Product, Provider } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import ProductAutocomplete from '@/components/ProductAutocomplete'
import QuantityInput from '@/components/QuantityInput'
import { Trash2, ShoppingBag } from 'lucide-react'

interface LineItem {
  product: Product
  quantity: number
  unitCost: number
  subtotal: number
}

export default function NewPurchasePage() {
  const router = useRouter()
  const { token } = useAuth()
  const [providers, setProviders] = useState<Provider[]>([])
  const [providerId, setProviderId] = useState('')
  const [items, setItems] = useState<LineItem[]>([])
  const [paid, setPaid] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    api.get<Provider[]>('/providers', token).then(setProviders).catch(() => {})
  }, [token])

  const total = items.reduce((sum, i) => sum + i.subtotal, 0)

  function handleAddProduct(product: Product) {
    const existing = items.find(i => i.product._id === product._id)
    if (existing) {
      setItems(prev => prev.map(i =>
        i.product._id === product._id
          ? { ...i, quantity: i.quantity + 1, subtotal: Math.round((i.quantity + 1) * i.unitCost * 100) / 100 }
          : i
      ))
    } else {
      const unitCost = product.costPrice || 0
      setItems(prev => [...prev, {
        product,
        quantity: 1,
        unitCost,
        subtotal: unitCost,
      }])
    }
  }

  function handleRemoveItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function handleQuantityChange(index: number, quantity: number) {
    setItems(prev => prev.map((i, idx) =>
      idx === index
        ? { ...i, quantity, subtotal: Math.round(quantity * i.unitCost * 100) / 100 }
        : i
    ))
  }

  function handleUnitCostChange(index: number, unitCost: number) {
    setItems(prev => prev.map((i, idx) =>
      idx === index
        ? { ...i, unitCost, subtotal: Math.round(i.quantity * unitCost * 100) / 100 }
        : i
    ))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!providerId || items.length === 0) return
    setSaving(true)
    setError('')

    try {
      const purchase = await api.post<{ _id: string }>('/purchases', {
        providerId,
        items: items.map(i => ({
          productId: i.product._id,
          quantity: i.quantity,
          unitCost: i.unitCost,
        })),
        paid,
        notes: notes || undefined,
      }, token!)
      router.push(`/compras/${purchase._id}`)
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message)
      } else {
        setError('Error de conexión')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingBag className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-heading font-semibold text-brand">Nueva compra</h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Proveedor</h2>
          <select
            value={providerId}
            onChange={e => setProviderId(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
          >
            <option value="">Seleccionar proveedor...</option>
            {providers.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Productos</h2>
          <ProductAutocomplete onSelect={handleAddProduct} token={token!} />

          {items.length > 0 && (
            <div className="space-y-2 mt-4">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand">{item.product.name}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-24">
                        <QuantityInput
                          value={item.quantity}
                          onChange={q => handleQuantityChange(i, q)}
                          saleUnit={item.product.saleUnit}
                        />
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          value={item.unitCost}
                          onChange={e => handleUnitCostChange(i, parseFloat(e.target.value) || 0)}
                          min={0}
                          step={0.01}
                          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
                        />
                      </div>
                      <span className="text-sm font-medium text-brand w-24 text-right">
                        {formatCurrency(item.subtotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(i)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              Busca y selecciona productos para agregar a la compra
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="paid"
              checked={paid}
              onChange={e => setPaid(e.target.checked)}
              className="rounded border-gray-300 text-accent focus:ring-accent/40"
            />
            <label htmlFor="paid" className="text-sm text-gray-600">Compra pagada</label>
          </div>
          <div>
            <label className="block text-gray-500 text-sm mb-1">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors resize-none h-20"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-heading font-semibold text-brand">{formatCurrency(total)}</p>
          </div>
          <button
            type="submit"
            disabled={saving || !providerId || items.length === 0}
            className="rounded-lg bg-accent text-white px-6 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Registrar compra'}
          </button>
        </div>
      </form>
    </div>
  )
}
