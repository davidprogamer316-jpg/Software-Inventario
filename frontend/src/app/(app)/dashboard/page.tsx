'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import type { DashboardData } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const PIE_COLORS = ['#E8823C', '#1A2333', '#6B7280', '#10B981', '#F59E0B']

export default function DashboardPage() {
  const { token, isAdmin, loading: authLoading } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.get<DashboardData>('/dashboard', token)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-r-transparent animate-spin" />
      </div>
    )
  }

  if (!data) return null

  const topProductsChart = data.topProducts.map(p => ({
    name: p.productName.length > 15 ? p.productName.slice(0, 15) + '...' : p.productName,
    quantity: p.totalQuantity,
    revenue: p.totalRevenue,
  }))

  const balance = data.incomeVsExpense.income - data.incomeVsExpense.expense

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-semibold text-brand">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Hoy"
          value={formatCurrency(data.today.total)}
          sub={`${data.today.count} ventas`}
          color="bg-accent/10 text-accent"
        />
        <KpiCard
          icon={<Calendar className="w-5 h-5" />}
          label="Esta semana"
          value={formatCurrency(data.week.total)}
          sub={`${data.week.count} ventas`}
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Este mes"
          value={formatCurrency(data.month.total)}
          sub={`${data.month.count} ventas`}
          color="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          icon={<Package className="w-5 h-5" />}
          label="Balance mensual"
          value={formatCurrency(balance)}
          sub={`Ingreso: ${formatCurrency(data.incomeVsExpense.income)} · Gasto: ${formatCurrency(data.incomeVsExpense.expense)}`}
          color={balance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Productos más vendidos (mes)
          </h2>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin ventas este mes</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topProductsChart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(value: number) => [formatCurrency(value), 'Ingreso']}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="#E8823C" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Ingresos vs Gastos (mes)
          </h2>
          {data.incomeVsExpense.income === 0 && data.incomeVsExpense.expense === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin movimientos este mes</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Ingresos', value: data.incomeVsExpense.income },
                    { name: 'Gastos', value: data.incomeVsExpense.expense },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                >
                  {[0, 1].map(i => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-6 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[0] }} />
              <span className="text-green-600">{formatCurrency(data.incomeVsExpense.income)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[1] }} />
              <span className="text-red-600">{formatCurrency(data.incomeVsExpense.expense)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Alertas de stock
            </h2>
            <Link href="/inventario?lowStock=true" className="text-xs text-accent hover:underline">
              Ver todos
            </Link>
          </div>
          {data.lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Todos los productos tienen stock suficiente</p>
          ) : (
            <div className="space-y-2">
              {data.lowStockProducts.slice(0, 5).map(p => (
                <div key={p._id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className={`w-4 h-4 shrink-0 ${
                      p.stockQuantity <= 0 ? 'text-red-500' : 'text-amber-500'
                    }`} />
                    <span className="text-sm text-brand truncate">{p.name}</span>
                  </div>
                  <span className={`text-sm font-medium shrink-0 ${
                    p.stockQuantity <= 0 ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {p.stockQuantity} / {p.minStock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Ventas recientes
            </h2>
            <Link href="/ventas" className="text-xs text-accent hover:underline">
              Ver todas
            </Link>
          </div>
          {data.recentSales.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin ventas registradas</p>
          ) : (
            <div className="space-y-2">
              {data.recentSales.map(sale => (
                <Link
                  key={sale._id}
                  href={`/ventas/${sale._id}`}
                  className="flex items-center justify-between py-1.5 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-brand truncate">{(sale as any).employeeId?.fullName || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{formatDate(sale.date)}</p>
                  </div>
                  <span className="text-sm font-medium text-brand shrink-0">{formatCurrency(sale.total)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-heading font-semibold text-brand mb-0.5">{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}
