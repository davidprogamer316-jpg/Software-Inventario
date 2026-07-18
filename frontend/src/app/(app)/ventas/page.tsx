'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import type { Sale, Employee } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Plus, Eye, AlertCircle, Filter, X,
  ChevronRight, ChevronDown,
} from 'lucide-react'

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function SalesListPage() {
  const { token, user, isAdmin, loading: authLoading } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])

  const [openYears, setOpenYears] = useState<Record<number, boolean>>({})
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({})
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({})

  const hasActiveFilters = filterEmployee || filterPayment || filterPaymentStatus

  useEffect(() => {
    if (!token) return
    api.get<Employee[]>('/employees', token).then(setEmployees).catch(() => {})
  }, [token])

  useEffect(() => {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams()
    if (filterEmployee) params.set('employeeId', filterEmployee)
    if (filterPayment) params.set('paymentMethod', filterPayment)
    if (filterPaymentStatus) params.set('paymentStatus', filterPaymentStatus)

    api.get<Sale[]>(`/sales?${params.toString()}`, token)
      .then(setSales)
      .finally(() => setLoading(false))
  }, [token, filterEmployee, filterPayment, filterPaymentStatus])

  const grouped = useMemo(() => {
    const years: Record<number, Record<number, Record<number, Sale[]>>> = {}

    for (const sale of sales) {
      const d = new Date(sale.date)
      const year = d.getFullYear()
      const month = d.getMonth() + 1
      const day = d.getDate()

      if (!years[year]) years[year] = {}
      if (!years[year][month]) years[year][month] = {}
      if (!years[year][month][day]) years[year][month][day] = []
      years[year][month][day].push(sale)
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
              .map(([day, sales]) => ({
                day: Number(day),
                sales: sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
              })),
          })),
      }))
  }, [sales])

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
    setFilterEmployee('')
    setFilterPayment('')
    setFilterPaymentStatus('')
  }

  const salespersonOptions = useMemo(() => {
    const options: { id: string; name: string }[] = []

    if (user && isAdmin) {
      options.push({ id: user._id, name: `${user.fullName} (Administrador)` })
    }

    for (const emp of employees) {
      if (emp.isActive && emp.userId) {
        options.push({ id: emp.userId, name: emp.fullName })
      }
    }

    return options
  }, [user, isAdmin, employees])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-semibold text-text-body">Ventas</h1>
        <div className="flex items-center gap-2">
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
          <Link
            href="/ventas/nueva"
            className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva venta
          </Link>
        </div>
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
            {!authLoading && isAdmin && (
              <select
                value={filterEmployee}
                onChange={e => setFilterEmployee(e.target.value)}
                className="rounded-lg border border-border bg-bg-page px-3 py-2 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
              >
                <option value="">Empleado</option>
                {salespersonOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            )}

            <select
              value={filterPayment}
              onChange={e => setFilterPayment(e.target.value)}
              className="rounded-lg border border-border bg-bg-page px-3 py-2 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
            >
              <option value="">Pago</option>
              {Object.entries(paymentLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select
              value={filterPaymentStatus}
              onChange={e => setFilterPaymentStatus(e.target.value)}
              className="rounded-lg border border-border bg-bg-page px-3 py-2 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
            >
              <option value="">Estado de pago</option>
              <option value="pending">Deuda</option>
              <option value="partial">Abonada</option>
              <option value="paid">Pagada</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-20 text-text-muted">No hay ventas registradas</div>
      ) : (
        <div className="space-y-2">
          {grouped.map(({ year, months }) => {
            const yearOpen = openYears[year]
            const yearTotal = months.reduce((sum, m) => sum + m.days.reduce((s, d) => s + d.sales.reduce((t, sale) => t + sale.total, 0), 0), 0)
            const yearCount = months.reduce((sum, m) => sum + m.days.reduce((s, d) => s + d.sales.length, 0), 0)

            return (
              <div key={year} className="bg-surface rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-bg-page transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {yearOpen ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                    <span className="font-heading font-semibold text-text-body">{year}</span>
                    <span className="text-xs text-text-muted">({yearCount} ventas)</span>
                  </div>
                  <span className="text-sm font-medium text-text-body">{formatCurrency(yearTotal)}</span>
                </button>

                {yearOpen && (
                  <div className="border-t border-border">
                    {months.map(({ month, days }) => {
                      const monthKey = `${year}-${month}`
                      const monthOpen = openMonths[monthKey]
                      const monthTotal = days.reduce((s, d) => s + d.sales.reduce((t, sale) => t + sale.total, 0), 0)
                      const monthCount = days.reduce((s, d) => s + d.sales.length, 0)

                      return (
                        <div key={monthKey}>
                          <button
                            onClick={() => toggleMonth(year, month)}
                            className="w-full flex items-center justify-between px-5 py-2.5 pl-10 text-left hover:bg-bg-page transition-colors text-sm"
                          >
                            <div className="flex items-center gap-2">
                              {monthOpen ? <ChevronDown className="w-3.5 h-3.5 text-text-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
                              <span className="font-medium text-text-body">{monthNames[month - 1]}</span>
                              <span className="text-xs text-text-muted">({monthCount} ventas)</span>
                            </div>
                            <span className="text-sm text-text-muted">{formatCurrency(monthTotal)}</span>
                          </button>

                          {monthOpen && (
                            <div className="border-t border-border">
                              {days.map(({ day, sales }) => {
                                const dayKey = `${year}-${month}-${day}`
                                const dayOpen = openDays[dayKey]
                                const dayTotal = sales.reduce((t, sale) => t + sale.total, 0)

                                return (
                                  <div key={dayKey}>
                                    <button
                                      onClick={() => toggleDay(year, month, day)}
                                      className="w-full flex items-center justify-between px-5 py-2 pl-16 text-left hover:bg-bg-page transition-colors text-sm"
                                    >
                                      <div className="flex items-center gap-2">
                                        {dayOpen ? <ChevronDown className="w-3.5 h-3.5 text-text-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
                                        <span className="text-text-body">Día {day}</span>
                                        <span className="text-xs text-text-muted">({sales.length} ventas)</span>
                                      </div>
                                      <span className="text-sm text-text-muted">{formatCurrency(dayTotal)}</span>
                                    </button>

                                    {dayOpen && (
                                      <div className="border-t border-border">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="border-b border-border">
                                              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-2 pl-16">Hora</th>
                                              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-2">Cliente</th>
                                              {!authLoading && isAdmin && <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-2 hidden sm:table-cell">Empleado</th>}
                                              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-2 hidden sm:table-cell">Pago</th>
                                              <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-2">Total</th>
                                              <th className="text-center text-text-muted text-xs font-medium uppercase tracking-wider px-6 py-2">Estado</th>
                                              <th className="px-6 py-2 w-20" />
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {sales.map(sale => (
                                              <tr key={sale._id} className="border-b border-border even:bg-bg-page last:border-b-0">
                                                <td className="px-6 py-2.5 pl-16 text-text-muted text-xs">
                                                  {new Date(sale.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-6 py-2.5 text-text-body">
                                                  {sale.customerName || <span className="text-text-muted">—</span>}
                                                </td>
                                                {!authLoading && isAdmin && (
                                                  <td className="px-6 py-2.5 text-text-muted hidden sm:table-cell text-xs">
                                                    {(sale as any).employeeId?.fullName || '—'}
                                                  </td>
                                                )}
                                                <td className="px-6 py-2.5 text-text-muted hidden sm:table-cell text-xs">
                                                  {paymentLabels[sale.paymentMethod] || sale.paymentMethod}
                                                </td>
                                                <td className="px-6 py-2.5 text-text-body text-right font-medium">
                                                  {formatCurrency(sale.total)}
                                                </td>
                                                <td className="px-6 py-2.5 text-center">
                                                  {sale.status === 'voided' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
                                                      <AlertCircle className="w-3 h-3" />
                                                      Anulada
                                                    </span>
                                                  ) : sale.paymentStatus === 'pending' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                                                      Deuda
                                                    </span>
                                                  ) : sale.paymentStatus === 'partial' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
                                                      Abonada
                                                    </span>
                                                  ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
                                                      Pagada
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="px-6 py-2.5">
                                                  <Link
                                                    href={`/ventas/${sale._id}`}
                                                    className="p-1 text-text-muted hover:text-accent transition-colors inline-flex"
                                                  >
                                                    <Eye className="w-4 h-4" />
                                                  </Link>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
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
