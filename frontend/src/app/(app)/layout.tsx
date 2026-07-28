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
  const { showWarning, handleLogout, handleContinueSession } = useIdleTimeout(logout)

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
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 text-center">
            <h3 className="text-lg font-semibold text-primary mb-2">Sesión por expirar</h3>
            <p className="text-sm text-foreground/70 mb-6">
              Tu sesión expirará en 2 minutos por inactividad.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-background transition-colors"
              >
                Cerrar sesión
              </button>
              <button
                onClick={handleContinueSession}
                className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
