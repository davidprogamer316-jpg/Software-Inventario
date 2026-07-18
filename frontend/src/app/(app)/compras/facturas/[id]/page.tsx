'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import type { PurchaseInvoice } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, FileText, Download } from 'lucide-react'

export default function PurchaseInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token } = useAuth()
  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.get<PurchaseInvoice>(`/purchase-invoices/${id}`, token)
      .then(setInvoice)
      .catch(() => router.push('/compras'))
      .finally(() => setLoading(false))
  }, [id, router, token])

  async function handleDownload() {
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

  if (!invoice) return null

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/compras/${invoice.purchaseId}`)}
            className="p-2 rounded-lg text-gray-400 hover:text-accent hover:bg-accent/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <FileText className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-heading font-semibold text-brand">Factura de compra</h1>
        </div>
        <button
          onClick={handleDownload}
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Descargar PDF
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Factura de compra</p>
            <p className="text-lg font-heading font-semibold text-brand">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Fecha</p>
            <p className="font-medium text-brand">{formatDate(invoice.date)}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">Proveedor</p>
          <p className="font-medium text-brand">{invoice.providerName}</p>
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
              {invoice.items.map((item, i) => (
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
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
