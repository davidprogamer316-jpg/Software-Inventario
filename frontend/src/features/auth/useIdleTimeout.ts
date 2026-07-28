'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

const TIMEOUT_MS = 30 * 60 * 1000
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart']

export function useIdleTimeout(logout: () => void) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleLogout = useCallback(() => {
    clearTimeout(timerRef.current)
    logout()
    router.push('/login')
  }, [logout, router])

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      handleLogout()
    }, TIMEOUT_MS)
  }, [handleLogout])

  useEffect(() => {
    resetTimer()

    const onActivity = () => resetTimer()

    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, onActivity))

    return () => {
      clearTimeout(timerRef.current)
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, onActivity))
    }
  }, [resetTimer])
}
