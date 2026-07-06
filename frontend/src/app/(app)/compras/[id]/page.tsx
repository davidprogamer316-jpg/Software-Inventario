'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import type { Purchase } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, ShoppingBag } from 'lucide-react'

export default function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token } = useAuth()
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.get<Purchase>(`/purchases/${id}`, token)
      .then(setPurchase)
      .catch(() => router.push('/compras'))
      .finally(() => setLoading(false))
  }, [id, router, token])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-r-transparent animate-spin" />
      </div>
    )
  }

  if (!purchase) return null

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/compras')}
          className="p-2 rounded-lg text-gray-400 hover:text-accent hover:bg-accent/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <ShoppingBag className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-heading font-semibold text-brand">Compra</h1>
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
            <p className={`text-sm font-medium mt-1 ${purchase.paid ? 'text-green-600' : 'text-amber-600'}`}>
              {purchase.paid ? 'Pagada' : 'Pendiente'}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Productos</h3>
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
                  <td className="py-2 text-right">{formatCurrency(item.unitCost)}</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex justify-end">
            <div className="w-64 flex justify-between text-lg font-heading font-semibold text-brand">
              <span>Total</span>
              <span>{formatCurrency(purchase.total)}</span>
            </div>
          </div>
        </div>

        {purchase.notes && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notas</h3>
            <p className="text-sm text-gray-600">{purchase.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
