'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import type { Product } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { formatQuantity } from '@/components/QuantityInput'
import Modal from '@/components/Modal'
import QuantityInput from '@/components/QuantityInput'
import { Plus, Pencil, AlertTriangle, PackageX, Search, ClipboardList, History } from 'lucide-react'

export default function InventoryPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockStatusFilter, setStockStatusFilter] = useState('')
  const [unitFilter, setUnitFilter] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Product | null>(null)
  const [stockAdjust, setStockAdjust] = useState<Product | null>(null)
  const [stockHistory, setStockHistory] = useState<Product | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ active: 'true', search })
    if (categoryFilter) params.set('category', categoryFilter)
    if (stockStatusFilter) params.set('stockStatus', stockStatusFilter)
    if (unitFilter) params.set('saleUnit', unitFilter)
    Promise.all([
      api.get<Product[]>(`/products?${params.toString()}`),
      api.get<string[]>('/products/categories'),
    ]).then(([prods, cats]) => {
      setProducts(prods)
      setCategories(cats)
    }).finally(() => setLoading(false))
  }, [search, categoryFilter, stockStatusFilter, unitFilter, refreshKey])

  const stockBadge = (product: Product) => {
    if (product.stockQuantity <= 0) return { class: 'bg-red-100 text-red-700', label: 'Agotado' }
    if (product.stockQuantity <= product.minStock) return { class: 'bg-amber-100 text-amber-700', label: 'Bajo stock' }
    return { class: 'bg-emerald-100 text-emerald-700', label: 'Stock OK' }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-semibold text-text-body">Inventario</h1>
        {!authLoading && isAdmin && (
          <button
            onClick={() => setEditing({} as Product)}
            className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar producto
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-lg border border-border bg-bg-page pl-10 pr-3.5 py-2 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-border bg-bg-page px-3.5 py-2 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        >
          <option value="">Todas las categorías</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={stockStatusFilter}
          onChange={e => setStockStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-bg-page px-3.5 py-2 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        >
          <option value="">Todos los estados</option>
          <option value="ok">Stock OK</option>
          <option value="low">Bajo stock</option>
          <option value="out">Agotado</option>
        </select>
        <select
          value={unitFilter}
          onChange={e => setUnitFilter(e.target.value)}
          className="rounded-lg border border-border bg-bg-page px-3.5 py-2 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        >
          <option value="">Todas las unidades</option>
          <option value="unit">Unidad</option>
          <option value="meter">Metro</option>
          <option value="centimeter">Centímetro</option>
        </select>
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
                <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3">SKU</th>
                <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3">Nombre</th>
                <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3 hidden sm:table-cell">Categoría</th>
                <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3">Unidad</th>
                <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3">Precio</th>
                <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3">Stock</th>
                <th className="text-center text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-3 hidden sm:table-cell">Estado</th>
                <th className="px-6 py-3 w-16" />
                {isAdmin && <th className="px-6 py-3 w-20" />}
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const badge = stockBadge(product)
                return (
                  <tr key={product._id} className="border-b border-border even:bg-bg-page">
                    <td className="px-6 py-3 text-text-muted font-mono text-xs">{product.sku}</td>
                    <td className="px-6 py-3 text-text-body font-medium">{product.name}</td>
                    <td className="px-6 py-3 text-text-muted hidden sm:table-cell">{product.category}</td>
                    <td className="px-6 py-3 text-text-muted text-xs uppercase">
                      {product.saleUnit === 'meter' ? 'm' : product.saleUnit === 'centimeter' ? 'cm' : 'uds'}
                    </td>
                    <td className="px-6 py-3 text-text-body text-right font-medium">{formatCurrency(product.salePrice)}</td>
                    <td className="px-6 py-3 text-right font-medium">{formatQuantity(product.stockQuantity, product.saleUnit)}</td>
                    <td className="px-6 py-3 hidden sm:table-cell">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${badge.class}`}>
                          {product.stockQuantity <= 0 ? <PackageX className="w-3 h-3" /> : product.stockQuantity <= product.minStock ? <AlertTriangle className="w-3 h-3" /> : null}
                          {badge.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setStockHistory(product)}
                        className="p-1.5 text-text-muted hover:text-accent transition-colors"
                        title="Ver historial de stock"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditing(product)}
                            className="p-1.5 text-text-muted hover:text-accent transition-colors"
                            title="Editar producto"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setStockAdjust(product)}
                            className="p-1.5 text-text-muted hover:text-accent transition-colors"
                            title="Ajustar stock"
                          >
                            <ClipboardList className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center text-text-muted">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?._id ? 'Editar producto' : 'Nuevo producto'}
      >
        <ProductForm
          product={editing}
          onSaved={() => {
            setEditing(null)
            setRefreshKey(k => k + 1)
          }}
        />
      </Modal>

      <Modal
        open={stockAdjust !== null}
        onClose={() => setStockAdjust(null)}
        title={`Ajustar stock: ${stockAdjust?.name || ''}`}
      >
        <StockAdjustForm
          product={stockAdjust}
          onSaved={() => {
            setStockAdjust(null)
            setRefreshKey(k => k + 1)
          }}
        />
      </Modal>

      <Modal
        open={stockHistory !== null}
        onClose={() => setStockHistory(null)}
        title={`Historial de stock: ${stockHistory?.name || ''}`}
      >
        <StockHistoryView
          product={stockHistory}
          onClose={() => setStockHistory(null)}
        />
      </Modal>
    </div>
  )
}

function StockAdjustForm({
  product,
  onSaved,
}: {
  product: Product | null
  onSaved: () => void
}) {
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  if (!product) return null
  const p = product

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) return
    setSaving(true)
    try {
      await api.patch(`/products/${p._id}/stock`, { quantity, reason })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-bg-page rounded-lg p-4 text-sm space-y-1">
        <p className="text-text-body">
          Stock actual: <span className="font-medium">{formatQuantity(p.stockQuantity, p.saleUnit)}</span>
        </p>
        <p className="text-text-muted text-xs">Ingresa una cantidad positiva para aumentar el stock, negativa para disminuir</p>
      </div>

      <div>
        <label className="block text-text-muted text-sm mb-1">Cantidad</label>
        <QuantityInput
          value={quantity}
          onChange={setQuantity}
          saleUnit={p.saleUnit}
          min={-p.stockQuantity}
        />
      </div>

      <div>
        <label className="block text-text-muted text-sm mb-1">Motivo *</label>
        <input
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
          placeholder="Ej: Merma, corrección de conteo, producto dañado..."
          className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || !reason.trim()}
          className="rounded-lg bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Aplicar ajuste'}
        </button>
      </div>
    </form>
  )
}

function StockHistoryView({
  product,
  onClose,
}: {
  product: Product | null
  onClose: () => void
}) {
  const [movements, setMovements] = useState<import('@/lib/types').StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!product?._id) return
    setLoading(true)
    api.get<import('@/lib/types').StockMovement[]>(`/products/${product._id}/stock-history`)
      .then(setMovements)
      .finally(() => setLoading(false))
  }, [product?._id])

  if (!product) return null

  const typeLabel = (type: string) => {
    switch (type) {
      case 'sale_out': return 'Venta'
      case 'purchase_in': return 'Compra'
      case 'manual_adjustment': return 'Ajuste manual'
      default: return type
    }
  }

  const typeColor = (type: string) => {
    switch (type) {
      case 'sale_out': return 'text-red-600 bg-red-50'
      case 'purchase_in': return 'text-emerald-600 bg-emerald-50'
      case 'manual_adjustment': return 'text-amber-600 bg-amber-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : movements.length === 0 ? (
        <p className="text-center text-text-muted py-8">No hay movimientos registrados</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-2">Fecha</th>
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-2">Tipo</th>
              <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-2">Cantidad</th>
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-2">Motivo</th>
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-2">Usuario</th>
            </tr>
          </thead>
          <tbody>
            {movements.map(m => (
              <tr key={m._id} className="border-b border-border even:bg-bg-page">
                <td className="px-4 py-2.5 text-text-body whitespace-nowrap">
                  {new Date(m.date).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor(m.type)}`}>
                    {typeLabel(m.type)}
                  </span>
                </td>
                <td className={`px-4 py-2.5 text-right font-mono font-medium ${m.quantity < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {m.quantity > 0 ? '+' : ''}{m.quantity}
                </td>
                <td className="px-4 py-2.5 text-text-muted max-w-[200px] truncate">
                  {m.reason || '-'}
                </td>
                <td className="px-4 py-2.5 text-text-body">
                  {typeof m.userId === 'object' ? m.userId.fullName : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function ProductForm({
  product,
  onSaved,
}: {
  product: Product | null
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    category: product?.category || '',
    spec: product?.spec || '',
    saleUnit: product?.saleUnit || 'unit',
    salePrice: product?.salePrice || 0,
    costPrice: product?.costPrice || 0,
    minStock: product?.minStock || 0,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (product?._id) {
        await api.put(`/products/${product._id}`, form)
      } else {
        await api.post('/products', form)
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-text-muted text-sm mb-1">SKU</label>
        <input
          type="text"
          value={form.sku}
          onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
          required
          className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label className="block text-text-muted text-sm mb-1">Nombre</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-text-muted text-sm mb-1">Categoría</label>
          <input
            type="text"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            required
            className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label className="block text-text-muted text-sm mb-1">Unidad de venta</label>
          <select
            value={form.saleUnit}
            onChange={e => setForm(f => ({ ...f, saleUnit: e.target.value as 'unit' | 'meter' | 'centimeter' }))}
            className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
          >
            <option value="unit">Unidad</option>
            <option value="meter">Metro</option>
            <option value="centimeter">Centímetro</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-text-muted text-sm mb-1">Precio de venta</label>
          <input
            type="number"
            value={form.salePrice}
            onChange={e => setForm(f => ({ ...f, salePrice: parseFloat(e.target.value) || 0 }))}
            required
            min={0}
            step={0.01}
            className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label className="block text-text-muted text-sm mb-1">Costo (opcional)</label>
          <input
            type="number"
            value={form.costPrice}
            onChange={e => setForm(f => ({ ...f, costPrice: parseFloat(e.target.value) || 0 }))}
            min={0}
            step={0.01}
            className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="block text-text-muted text-sm mb-1">Especificación (opcional)</label>
        <input
          type="text"
          value={form.spec}
          onChange={e => setForm(f => ({ ...f, spec: e.target.value }))}
          className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label className="block text-text-muted text-sm mb-1">Stock mínimo</label>
        <input
          type="number"
          value={form.minStock}
          onChange={e => setForm(f => ({ ...f, minStock: parseFloat(e.target.value) || 0 }))}
          min={0}
          step={0.01}
          className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : product?._id ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}
