'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthContext'
import type { Invoice } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  FileText, Eye, Download, Filter, X,
  ChevronRight, ChevronDown,
} from 'lucide-react'

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function InvoiceListPage() {
  const { token } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [filterDate, setFilterDate] = useState('')
  const [filterSearch, setFilterSearch] = useState('')

  const [openYears, setOpenYears] = useState<Record<number, boolean>>({})
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({})
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({})

  const hasActiveFilters = filterDate || filterSearch

  useEffect(() => {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams()
    if (filterDate) {
      params.set('startDate', filterDate)
      const next = new Date(filterDate)
      next.setDate(next.getDate() + 1)
      params.set('endDate', next.toISOString().slice(0, 10))
    }
    if (filterSearch) params.set('search', filterSearch)

    api.get<Invoice[]>(`/invoices?${params.toString()}`, token)
      .then(setInvoices)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, filterDate, filterSearch])

  const grouped = useMemo(() => {
    const years: Record<number, Record<number, Record<number, Invoice[]>>> = {}

    for (const inv of invoices) {
      const d = new Date(inv.date)
      const year = d.getFullYear()
      const month = d.getMonth() + 1
      const day = d.getDate()

      if (!years[year]) years[year] = {}
      if (!years[year][month]) years[year][month] = {}
      if (!years[year][month][day]) years[year][month][day] = []
      years[year][month][day].push(inv)
    }

    return Object.entries(years)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, months]) => ({
        year: Number(year),
        months: Object.entries(months)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([month, days]) => ({
            month: Number(month),
            days: Object.entries(days)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([day, invoices]) => ({
                day: Number(day),
                invoices: invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
              })),
          })),
      }))
  }, [invoices])

  function toggleYear(year: number) {
    setOpenYears(prev => ({ ...prev, [year]: !prev[year] }))
  }

  function toggleMonth(year: number, month: number) {
    const key = `${year}-${month}`
    setOpenMonths(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleDay(year: number, month: number, day: number) {
    const key = `${year}-${month}-${day}`
    setOpenDays(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function clearFilters() {
    setFilterDate('')
    setFilterSearch('')
  }

  async function handleDownload(id: string) {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${id}.pdf`
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-semibold text-brand">Facturas</h1>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
            filtersOpen || hasActiveFilters
              ? 'border-accent text-accent bg-accent/5'
              : 'border-border text-text-muted hover:bg-bg-page'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {filtersOpen && (
        <div className="bg-surface rounded-xl border border-border p-4 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-body">Filtros</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-text-muted hover:text-accent flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="rounded-lg border border-border bg-bg-page px-3.5 py-2 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
            />
            <input
              type="text"
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              placeholder="Número de factura (INV-...)"
              className="rounded-lg border border-border bg-bg-page px-3.5 py-2 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors w-64"
            />
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay facturas aún</p>
          <p className="text-gray-400 text-sm mt-1">
            Las facturas se generan desde una venta
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {grouped.map(({ year, months }) => {
            const yearOpen = openYears[year]
            const yearCount = months.reduce((sum, m) => sum + m.days.reduce((s, d) => s + d.invoices.length, 0), 0)

            return (
              <div key={year} className="bg-surface rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-bg-page transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {yearOpen ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                    <span className="font-heading font-semibold text-text-body">{year}</span>
                    <span className="text-xs text-text-muted">({yearCount} factura{yearCount !== 1 ? 's' : ''})</span>
                  </div>
                </button>

                {yearOpen && (
                  <div className="border-t border-border">
                    {months.map(({ month, days }) => {
                      const monthKey = `${year}-${month}`
                      const monthOpen = openMonths[monthKey]
                      const monthCount = days.reduce((s, d) => s + d.invoices.length, 0)

                      return (
                        <div key={monthKey}>
                          <button
                            onClick={() => toggleMonth(year, month)}
                            className="w-full flex items-center justify-between px-5 py-2.5 pl-10 text-left hover:bg-bg-page transition-colors text-sm"
                          >
                            <div className="flex items-center gap-2">
                              {monthOpen ? <ChevronDown className="w-3.5 h-3.5 text-text-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
                              <span className="font-medium text-text-body">{monthNames[month - 1]}</span>
                              <span className="text-xs text-text-muted">({monthCount} factura{monthCount !== 1 ? 's' : ''})</span>
                            </div>
                          </button>

                          {monthOpen && (
                            <div className="border-t border-border">
                              {days.map(({ day, invoices }) => {
                                const dayKey = `${year}-${month}-${day}`
                                const dayOpen = openDays[dayKey]

                                return (
                                  <div key={dayKey}>
                                    <button
                                      onClick={() => toggleDay(year, month, day)}
                                      className="w-full flex items-center justify-between px-5 py-2 pl-16 text-left hover:bg-bg-page transition-colors text-sm"
                                    >
                                      <div className="flex items-center gap-2">
                                        {dayOpen ? <ChevronDown className="w-3.5 h-3.5 text-text-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
                                        <span className="text-text-body">Día {day}</span>
                                        <span className="text-xs text-text-muted">({invoices.length} factura{invoices.length !== 1 ? 's' : ''})</span>
                                      </div>
                                    </button>

                                    {dayOpen && (
                                      <div className="border-t border-border">
                                        {invoices.map(inv => {
                                          const cancelled = inv.status === 'cancelled'
                                          return (
                                            <div
                                              key={inv._id}
                                              className={`flex items-center justify-between gap-4 px-5 py-3 pl-20 ${
                                                cancelled ? 'opacity-70' : ''
                                              } even:bg-bg-page`}
                                            >
                                              <div className="flex items-center gap-4 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                  cancelled ? 'bg-red-50 text-red-400' : 'bg-accent/10 text-accent'
                                                }`}>
                                                  <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                  <p className="text-sm font-medium text-text-body truncate">{inv.invoiceNumber}</p>
                                                  <p className="text-xs text-text-muted">
                                                    {inv.customerName || 'Consumidor Final'}
                                                  </p>
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-3 shrink-0">
                                                <div className="text-right">
                                                  <p className="text-sm font-semibold text-text-body">{formatCurrency(inv.total)}</p>
                                                  <p className={`text-xs font-medium ${
                                                    cancelled ? 'text-red-500' : 'text-green-600'
                                                  }`}>
                                                    {cancelled ? 'Cancelada' : 'Emitida'}
                                                  </p>
                                                </div>

                                                <Link
                                                  href={`/facturas/${inv._id}`}
                                                  className="p-1.5 text-text-muted hover:text-accent transition-colors"
                                                >
                                                  <Eye className="w-4 h-4" />
                                                </Link>

                                                <button
                                                  onClick={() => handleDownload(inv._id)}
                                                  className="p-1.5 text-text-muted hover:text-accent transition-colors"
                                                >
                                                  <Download className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
