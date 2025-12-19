'use client'

import { useDaemonStatus } from '@/components/providers/DaemonStatusProvider'

export function DemoModeIndicator() {
  const { status, exitDemoMode } = useDaemonStatus()

  // Only show when in demo mode
  if (status !== 'demo') {
    return null
  }

  return (
    <div className="demo-mode-indicator">
      <div className="demo-mode-indicator-content">
        <span className="demo-mode-indicator-badge">Demo Mode</span>
        <span className="demo-mode-indicator-text">
          You&apos;re exploring with sample data. Changes won&apos;t be saved.
        </span>
        <button className="demo-mode-exit-button" onClick={exitDemoMode}>
          Exit Demo
        </button>
      </div>
    </div>
  )
}
