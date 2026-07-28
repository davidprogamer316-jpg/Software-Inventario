'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/features/auth/AuthContext'
import { useIdleTimeout } from '@/features/auth/useIdleTimeout'
import Sidebar from '@/components/Sidebar'

const adminOnlyRoutes = ['/configuracion', '/empleados', '/finanzas', '/proveedores']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  useIdleTimeout(logout)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  useEffect(() => {
    if (!loading && user && !isAdmin && adminOnlyRoutes.some(r => pathname.startsWith(r))) {
      router.replace('/dashboard')
    }
  }, [loading, user, isAdmin, pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <Sidebar />
      <main className="md:ml-56 pt-16 md:pt-6 px-6 pb-6 min-h-screen">
        {children}
      </main>
    </>
  )
}
