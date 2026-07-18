'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/AuthContext'
import { HttpError } from '@/lib/api'
import { ShieldOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [locked, setLocked] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLocked('')
    setSubmitting(true)

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status === 423) {
          setLocked(err.message)
        } else {
          setError(err.message)
        }
      } else {
        setError('Error de conexión')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/8 blur-3xl" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/15 text-accent text-2xl font-bold font-heading ring-1 ring-accent/20 flex items-center justify-center">
            T
          </div>
        </div>

        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-white text-xl font-heading font-semibold text-center mb-8">
            Iniciar sesión
          </h1>

          {locked && (
            <div className="mb-6 bg-orange-500/10 border border-orange-400/30 rounded-xl px-4 py-3 flex items-start gap-3">
              <ShieldOff className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-orange-300 text-sm">{locked}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/50 text-sm mb-1.5">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent/50 transition-colors placeholder:text-white/20"
                placeholder="admin@tubogest.com"
              />
            </div>

            <div>
              <label className="block text-white/50 text-sm mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent/50 transition-colors placeholder:text-white/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-accent text-brand font-semibold px-4 py-3 hover:bg-accent/90 transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-white/20 text-xs text-center mt-6">
          Eurometales ERP v0.1
        </p>
      </div>
    </div>
  )
}
