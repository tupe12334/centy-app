import { useDaemonStatus } from '../context/DaemonStatusContext.tsx'
import './DaemonDisconnectedOverlay.css'

export function DaemonDisconnectedOverlay() {
  const { status, checkNow } = useDaemonStatus()

  // Only show when disconnected (not during initial check)
  if (status !== 'disconnected') {
    return null
  }

  return (
    <div className="daemon-disconnected-overlay">
      <div className="daemon-disconnected-content">
        <div className="daemon-disconnected-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
        <h2>Daemon Not Connected</h2>
        <p>
          The Centy daemon is not running or cannot be reached.
          <br />
          Please start the daemon to use the application.
        </p>
        <div className="daemon-disconnected-instructions">
          <p>To start the daemon, run:</p>
          <code>centy-daemon</code>
        </div>
        <button className="daemon-retry-button" onClick={checkNow}>
          Retry Connection
        </button>
      </div>
    </div>
  )
}
