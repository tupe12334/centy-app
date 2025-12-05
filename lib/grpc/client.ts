'use client'

import { createClient, Client } from '@connectrpc/connect'
import { createGrpcWebTransport } from '@connectrpc/connect-web'
import { CentyDaemon } from '@/gen/centy_pb'

const DEFAULT_DAEMON_URL = 'http://localhost:50051'
const DAEMON_URL_STORAGE_KEY = 'centy_daemon_url'

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

export const centyClient: Client<typeof CentyDaemon> = createClient(
  CentyDaemon,
  transport
)
