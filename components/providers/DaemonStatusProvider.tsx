'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  centyClient,
  enableDemoMode,
  disableDemoMode,
  isDemoMode,
} from '@/lib/grpc/client'
import { DEMO_ORG_SLUG, DEMO_PROJECT_PATH } from '@/lib/grpc/demo-data'

type DaemonStatus = 'connected' | 'disconnected' | 'checking' | 'demo'

interface DaemonStatusContextType {
  status: DaemonStatus
  lastChecked: Date | null
  checkNow: () => Promise<void>
  enterDemoMode: () => void
  exitDemoMode: () => void
  demoProjectPath: string
}

const DaemonStatusContext = createContext<DaemonStatusContextType | null>(null)

const CHECK_INTERVAL_MS = 10000 // Check every 10 seconds

export function DaemonStatusProvider({ children }: { children: ReactNode }) {
  // Always start with 'checking' to avoid hydration mismatch
  // (sessionStorage is not available during SSR)
  const [status, setStatus] = useState<DaemonStatus>('checking')
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [hasMounted, setHasMounted] = useState(false)

  // Check for demo mode after mount to avoid hydration mismatch
  useEffect(() => {
    // Schedule setState asynchronously to satisfy eslint react-hooks/set-state-in-effect
    const timeoutId = setTimeout(() => {
      if (isDemoMode()) {
        setStatus('demo')
      }
      setHasMounted(true)
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [])

  const checkDaemonStatus = useCallback(async () => {
    // Skip health checks when in demo mode
    if (isDemoMode()) {
      setStatus('demo')
      return
    }

    setStatus('checking')
    try {
      // Use listProjects as a health check - it's a lightweight call
      await centyClient.listProjects({})
      setStatus('connected')
    } catch {
      setStatus('disconnected')
    }
    setLastChecked(new Date())
  }, [])

  const enterDemoMode = useCallback(() => {
    enableDemoMode()
    setStatus('demo')
    // Navigate to demo org and project
    window.location.href = `/?org=${DEMO_ORG_SLUG}&project=${encodeURIComponent(DEMO_PROJECT_PATH)}`
  }, [])

  const exitDemoMode = useCallback(() => {
    disableDemoMode()
    setStatus('checking')
    // Trigger a check after exiting demo mode
    setTimeout(() => {
      checkDaemonStatus()
    }, 100)
  }, [checkDaemonStatus])

  // Initial check and periodic polling
  useEffect(() => {
    // Wait until after mount to avoid hydration issues
    if (!hasMounted) {
      return
    }

    // Skip polling when in demo mode (use isDemoMode() directly to avoid
    // status in deps which would cause infinite re-renders)
    if (isDemoMode()) {
      return
    }

    // Schedule initial check to avoid synchronous setState in effect
    const timeoutId = setTimeout(checkDaemonStatus, 0)
    const interval = setInterval(checkDaemonStatus, CHECK_INTERVAL_MS)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(interval)
    }
  }, [checkDaemonStatus, hasMounted])

  return (
    <DaemonStatusContext.Provider
      value={{
        status,
        lastChecked,
        checkNow: checkDaemonStatus,
        enterDemoMode,
        exitDemoMode,
        demoProjectPath: DEMO_PROJECT_PATH,
      }}
    >
      {children}
    </DaemonStatusContext.Provider>
  )
}

export function useDaemonStatus() {
  const context = useContext(DaemonStatusContext)
  if (!context) {
    throw new Error(
      'useDaemonStatus must be used within a DaemonStatusProvider'
    )
  }
  return context
}
