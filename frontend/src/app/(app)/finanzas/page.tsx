'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { api, HttpError } from '@/lib/api'
import type { Income, Expense } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import Modal from '@/components/Modal'
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react'

type Tab = 'income' | 'expense'

export default function FinancePage() {
  const { token, isAdmin, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<Tab>('income')
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  function fetchData() {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)

    Promise.all([
      api.get<Income[]>(`/finance/incomes?${params}`, token),
      api.get<Expense[]>(`/finance/expenses?${params}`, token),
    ]).then(([inc, exp]) => {
      setIncomes(inc)
      setExpenses(exp)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [token])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-semibold text-brand">Finanzas</h1>
        {!authLoading && isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {tab === 'income' ? 'Ingreso manual' : 'Gasto manual'}
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6 items-end">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setTab('income')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'income' ? 'bg-accent text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1.5" />
            Ingresos
          </button>
          <button
            onClick={() => setTab('expense')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'expense' ? 'bg-accent text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <TrendingDown className="w-4 h-4 inline mr-1.5" />
            Gastos
          </button>
        </div>

        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-lg bg-brand text-white text-sm hover:bg-brand/90 transition-colors"
        >
          Filtrar
        </button>
      </div>

      {authLoading || loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'income' ? (
        <TransactionList
          items={incomes}
          icon={<ArrowUpRight className="w-4 h-4" />}
          color="text-emerald-600 bg-emerald-50"
          emptyMsg="No hay ingresos registrados"
          formatAmount={(a) => formatCurrency(a)}
        />
      ) : (
        <TransactionList
          items={expenses}
          icon={<ArrowDownRight className="w-4 h-4" />}
          color="text-red-600 bg-red-50"
          emptyMsg="No hay gastos registrados"
          formatAmount={(a) => `-${formatCurrency(a)}`}
        />
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={tab === 'income' ? 'Nuevo ingreso manual' : 'Nuevo gasto manual'}
      >
        <CreateForm
          type={tab}
          token={token!}
          onCreated={() => {
            setShowCreate(false)
            fetchData()
          }}
        />
      </Modal>
    </div>
  )
}

function TransactionList({
  items,
  icon,
  color,
  emptyMsg,
  formatAmount,
}: {
  items: (Income | Expense)[]
  icon: React.ReactNode
  color: string
  emptyMsg: string
  formatAmount: (amount: number) => string
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">{emptyMsg}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              {icon}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-brand truncate">{item.description}</p>
              <p className="text-xs text-gray-400">
                {formatDate(item.date)}
                {'source' in item && item.source !== 'manual' && (
                  <span className="ml-2 text-accent">Automático</span>
                )}
              </p>
            </div>
          </div>
          <span className={`font-semibold shrink-0 ${
            'source' in item && item.source !== 'manual' ? 'text-gray-400' : 'text-brand'
          }`}>
            {formatAmount(item.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}

function CreateForm({ type, token, onCreated }: { type: 'income' | 'expense'; token: string; onCreated: () => void }) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || amount <= 0) return
    setSaving(true)
    setError('')
    try {
      const endpoint = type === 'income' ? '/finance/incomes' : '/finance/expenses'
      await api.post(endpoint, { description, amount, date: date || undefined }, token)
      onCreated()
    } catch (err) {
      if (err instanceof HttpError) setError(err.message)
      else setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      <div>
        <label className="block text-gray-500 text-sm mb-1">Descripción *</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label className="block text-gray-500 text-sm mb-1">Monto *</label>
        <input
          type="number"
          value={amount || ''}
          onChange={e => setAmount(parseFloat(e.target.value) || 0)}
          required
          min={0.01}
          step={0.01}
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label className="block text-gray-500 text-sm mb-1">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || !description.trim() || amount <= 0}
          className="rounded-lg bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
