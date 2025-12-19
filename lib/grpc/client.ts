'use client'

import { createClient, Client } from '@connectrpc/connect'
import { createGrpcWebTransport } from '@connectrpc/connect-web'
import { CentyDaemon } from '@/gen/centy_pb'
import { mockHandlers } from './mock-handlers'

const DEFAULT_DAEMON_URL = 'http://localhost:50051'
const DAEMON_URL_STORAGE_KEY = 'centy_daemon_url'
const DEMO_MODE_STORAGE_KEY = 'centy_demo_mode'

// Demo mode state
let demoModeEnabled = false

// Initialize demo mode from sessionStorage on load
if (typeof window !== 'undefined') {
  demoModeEnabled = sessionStorage.getItem(DEMO_MODE_STORAGE_KEY) === 'true'
}

// Enable demo mode
export function enableDemoMode(): void {
  demoModeEnabled = true
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(DEMO_MODE_STORAGE_KEY, 'true')
  }
}

// Disable demo mode
export function disableDemoMode(): void {
  demoModeEnabled = false
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(DEMO_MODE_STORAGE_KEY)
  }
}

// Check if demo mode is enabled
export function isDemoMode(): boolean {
  return demoModeEnabled
}

// Get the daemon URL from localStorage or use default
function getDaemonUrl(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_DAEMON_URL
  }
  return localStorage.getItem(DAEMON_URL_STORAGE_KEY) || DEFAULT_DAEMON_URL
}

// Set the daemon URL in localStorage
export function setDaemonUrl(url: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DAEMON_URL_STORAGE_KEY, url)
  // Trigger a page reload to reinitialize the client with the new URL
  window.location.reload()
}

// Get the current daemon URL (for display purposes)
export function getCurrentDaemonUrl(): string {
  return getDaemonUrl()
}

// Check if using default URL
export function isUsingDefaultDaemonUrl(): boolean {
  if (typeof window === 'undefined') return true
  return !localStorage.getItem(DAEMON_URL_STORAGE_KEY)
}

// Reset to default daemon URL
export function resetDaemonUrl(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(DAEMON_URL_STORAGE_KEY)
  window.location.reload()
}

const transport = createGrpcWebTransport({
  baseUrl: getDaemonUrl(),
})

// Create the real gRPC client
const realClient: Client<typeof CentyDaemon> = createClient(
  CentyDaemon,
  transport
)

// Create a proxy that intercepts calls when in demo mode
export const centyClient: Client<typeof CentyDaemon> = new Proxy(realClient, {
  get(target, prop: string) {
    const value = target[prop as keyof typeof target]

    // If not in demo mode, return the real client method
    if (!demoModeEnabled) {
      return value
    }

    // If the property is a function and we have a mock handler, use it
    if (typeof value === 'function') {
      const mockHandler = mockHandlers[prop]
      if (mockHandler) {
        return async (...args: unknown[]) => {
          try {
            return await mockHandler(args[0])
          } catch (error) {
            console.error(
              `[Demo Mode] Error in mock handler for ${prop}:`,
              error
            )
            throw error
          }
        }
      }
      // If no mock handler, still call the mock but log a warning
      console.warn(`[Demo Mode] No mock handler for method: ${prop}`)
      return async () => {
        throw new Error(`Method ${prop} is not available in demo mode`)
      }
    }

    return value
  },
})

// Expose mock mode API for E2E tests
if (typeof window !== 'undefined') {
  ;(window as Window & { __CENTY_MOCK__?: CentyMockAPI }).__CENTY_MOCK__ = {
    activate: enableDemoMode,
    deactivate: disableDemoMode,
    isActive: isDemoMode,
    setData: (data: Record<string, unknown>) => {
      // For future use: allow tests to inject custom mock data
      console.log('[Demo Mode] Custom data injection:', data)
    },
    reset: () => {
      disableDemoMode()
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    },
  }
}

// Type for the mock API
interface CentyMockAPI {
  activate: () => void
  deactivate: () => void
  isActive: () => boolean
  setData: (data: Record<string, unknown>) => void
  reset: () => void
}

// Extend Window interface
declare global {
  interface Window {
    __CENTY_MOCK__?: CentyMockAPI
  }
}
