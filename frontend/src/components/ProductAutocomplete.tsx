'use client'

import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import { api } from '@/lib/api'
import type { Product } from '@/lib/types'
import { formatQuantity } from './QuantityInput'

interface ProductAutocompleteProps {
  onSelect: (product: Product) => void
  token: string
  excludeOutOfStock?: boolean
}

export default function ProductAutocomplete({ onSelect, token, excludeOutOfStock }: ProductAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 1) {
      setResults([])
      setOpen(false)
      return
    }

    const timeout = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await api.get<Product[]>(`/products?search=${encodeURIComponent(query)}&active=true`, token)
        setResults(data)
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, token])

  function handleSelect(product: Product) {
    if (excludeOutOfStock && product.stockQuantity <= 0) return
    onSelect(product)
    setQuery('')
    setOpen(false)
  }

  const stockBadge = (product: Product) => {
    if (product.stockQuantity <= 0) return 'bg-red-100 text-red-700'
    if (product.stockQuantity <= product.minStock) return 'bg-amber-100 text-amber-700'
    return 'bg-emerald-100 text-emerald-700'
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar producto por nombre o SKU..."
          className="w-full rounded-lg border border-border bg-bg-page pl-10 pr-3.5 py-2.5 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-10 w-full bg-surface border border-border rounded-lg shadow-sm mt-1 max-h-60 overflow-y-auto">
          {results.map(product => {
            const outOfStock = excludeOutOfStock && product.stockQuantity <= 0
            return (
              <button
                key={product._id}
                onClick={() => handleSelect(product)}
                disabled={outOfStock}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-bg-page transition-colors border-b border-border last:border-b-0 ${
                  outOfStock ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div className="flex-1 text-left min-w-0">
                  <p className="text-text-body font-medium truncate">{product.name}</p>
                  <p className="text-text-muted text-xs">{product.sku}</p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p className="text-text-body font-medium">${product.salePrice.toLocaleString('es-CO')}</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${stockBadge(product)}`}>
                    {formatQuantity(product.stockQuantity, product.saleUnit)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {loading && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
