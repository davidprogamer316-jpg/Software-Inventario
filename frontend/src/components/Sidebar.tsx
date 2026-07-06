'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/AuthContext'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Users,
  Wallet,
  FileText,
  Settings,
  LogOut,
  X,
  Menu,
} from 'lucide-react'

const adminLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { href: '/inventario', label: 'Inventario', icon: Package },
  { href: '/proveedores', label: 'Proveedores', icon: Truck },
  { href: '/finanzas', label: 'Ingresos / Egresos', icon: Wallet },
  { href: '/empleados', label: 'Empleados', icon: Users },
  { href: '/facturas', label: 'Facturas', icon: FileText },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

const employeeLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { href: '/inventario', label: 'Inventario', icon: Package },
  { href: '/facturas', label: 'Facturas', icon: FileText },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const { user, isAdmin, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const links = isAdmin ? adminLinks : employeeLinks

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-brand text-white/80 hover:text-white"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-56 bg-brand shadow-lg
          transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent text-sm font-bold font-heading flex items-center justify-center">
              T
            </div>
            <span className="text-white font-heading font-semibold text-sm">TuboGest</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden text-white/60 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-0.5">
          {links.map(link => {
            const Icon = link.icon
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`
                  relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors
                  ${active
                    ? 'bg-white/15 text-accent font-medium'
                    : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                  }
                `}
              >
                {active && (
                  <span className="absolute left-0 w-1 h-5 rounded-r-full bg-accent" />
                )}
                <Icon className="w-4 h-4 shrink-0" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/10 text-white/60 flex items-center justify-center text-sm font-medium">
              {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-[10px] uppercase tracking-wide text-accent/80">
                {isAdmin ? 'Admin' : 'Empleado'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/40 hover:text-white/60 text-xs transition-colors w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
