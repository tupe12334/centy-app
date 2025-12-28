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
  vscodeAvailable: boolean | null // null = not yet checked
}

const DaemonStatusContext = createContext<DaemonStatusContextType | null>(null)

const CHECK_INTERVAL_MS = 10000 // Check every 10 seconds

export function DaemonStatusProvider({ children }: { children: ReactNode }) {
  // Always start with 'checking' to avoid hydration mismatch
  // (sessionStorage is not available during SSR)
  const [status, setStatus] = useState<DaemonStatus>('checking')
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [hasMounted, setHasMounted] = useState(false)
  const [vscodeAvailable, setVscodeAvailable] = useState<boolean | null>(null)

  // Check for demo mode after mount to avoid hydration mismatch
  // Also check for ?demo=true URL param to auto-enable demo mode
  useEffect(() => {
    // Schedule setState asynchronously to satisfy eslint react-hooks/set-state-in-effect
    const timeoutId = setTimeout(() => {
      // Check for ?demo=true URL param to auto-enable demo mode
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('demo') === 'true' && !isDemoMode()) {
        enableDemoMode()
        setStatus('demo')
        // Set vscodeAvailable for demo mode (check for test override)
        const testOverride = (
          window as Window & { __TEST_VSCODE_AVAILABLE__?: boolean }
        ).__TEST_VSCODE_AVAILABLE__
        setVscodeAvailable(testOverride ?? true)
        // Clean up URL by removing demo param and adding org/project (preserve current path)
        const newUrl = `${window.location.pathname}?org=${DEMO_ORG_SLUG}&project=${encodeURIComponent(DEMO_PROJECT_PATH)}`
        window.history.replaceState({}, '', newUrl)
      } else if (isDemoMode()) {
        setStatus('demo')
        // Set vscodeAvailable for demo mode (check for test override)
        const testOverride = (
          window as Window & { __TEST_VSCODE_AVAILABLE__?: boolean }
        ).__TEST_VSCODE_AVAILABLE__
        setVscodeAvailable(testOverride ?? true)
      }
      setHasMounted(true)
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [])

  const checkDaemonStatus = useCallback(async () => {
    // Skip health checks when in demo mode
    if (isDemoMode()) {
      setStatus('demo')
      // Check for test override first, then default to true for demo mode
      const testOverride = (
        window as Window & { __TEST_VSCODE_AVAILABLE__?: boolean }
      ).__TEST_VSCODE_AVAILABLE__
      setVscodeAvailable(testOverride ?? true)
      return
    }

    setStatus('checking')
    try {
      // Use getDaemonInfo as a health check - it also provides VS Code availability
      const daemonInfo = await centyClient.getDaemonInfo({})
      setStatus('connected')
      setVscodeAvailable(daemonInfo.vscodeAvailable)
    } catch {
      setStatus('disconnected')
      setVscodeAvailable(null)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMounted])

  return (
    <DaemonStatusContext.Provider
      value={{
        status,
        lastChecked,
        checkNow: checkDaemonStatus,
        enterDemoMode,
        exitDemoMode,
        demoProjectPath: DEMO_PROJECT_PATH,
        vscodeAvailable,
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
