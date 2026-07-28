'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const TIMEOUT_MS = 30 * 60 * 1000
const WARNING_MS = 2 * 60 * 1000
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart']

export function useIdleTimeout(logout: () => void) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [showWarning, setShowWarning] = useState(false)

  const handleLogout = useCallback(() => {
    clearTimeout(timerRef.current)
    clearTimeout(warningTimerRef.current)
    setShowWarning(false)
    logout()
    router.push('/login')
  }, [logout, router])

  const handleContinueSession = useCallback(() => {
    setShowWarning(false)
    resetTimers()
  }, [])

  const resetTimers = useCallback(() => {
    clearTimeout(timerRef.current)
    clearTimeout(warningTimerRef.current)
    setShowWarning(false)

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true)
    }, TIMEOUT_MS - WARNING_MS)

    timerRef.current = setTimeout(() => {
      handleLogout()
    }, TIMEOUT_MS)
  }, [handleLogout])

  useEffect(() => {
    resetTimers()

    const onActivity = () => {
      if (!showWarning) {
        resetTimers()
      }
    }

    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, onActivity))

    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(warningTimerRef.current)
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, onActivity))
    }
  }, [resetTimers, showWarning])

  return { showWarning, handleLogout, handleContinueSession }
}
