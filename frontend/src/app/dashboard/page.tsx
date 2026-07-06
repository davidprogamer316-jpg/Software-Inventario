'use client'

import { useAuth } from '@/features/auth/AuthContext'

export default function DashboardPage() {
  const { isAdmin } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold text-text-body mb-6">
        Dashboard
      </h1>
      <p className="text-text-muted">
        {isAdmin ? 'Panel de administración' : 'Tus ventas'}
      </p>
    </div>
  )
}
