'use client'

import { useState, useMemo } from 'react'
import {
  getCurrentDaemonUrl,
  setDaemonUrl,
  resetDaemonUrl,
  isUsingDefaultDaemonUrl,
} from '@/lib/grpc/client'

export function DaemonSettings() {
  const initialUrl = useMemo(() => getCurrentDaemonUrl(), [])
  const initialIsDefault = useMemo(() => isUsingDefaultDaemonUrl(), [])

  const [url, setUrl] = useState(initialUrl)
  const [isDefault] = useState(initialIsDefault)
  const [showHelp, setShowHelp] = useState(false)

  const handleSave = () => {
    if (url.trim()) {
      setDaemonUrl(url.trim())
    }
  }

  const handleReset = () => {
    resetDaemonUrl()
  }

  const isModified = url !== getCurrentDaemonUrl()

  return (
    <div className="daemon-settings">
      <p className="settings-description">
        Configure the URL of your Centy daemon. This allows the web app to
        connect to a daemon running on your local machine or a remote server.
      </p>

      <div className="daemon-url-input">
        <label htmlFor="daemon-url">Daemon URL</label>
        <div className="input-with-button">
          <input
            id="daemon-url"
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="http://localhost:50051"
          />
          <button
            onClick={handleSave}
            disabled={!isModified || !url.trim()}
            className="save-btn"
          >
            Save
          </button>
          {!isDefault && (
            <button onClick={handleReset} className="reset-btn">
              Reset to Default
            </button>
          )}
        </div>
        {!isDefault && (
          <span className="custom-url-badge">Using custom URL</span>
        )}
      </div>

      <button
        className="help-toggle"
        onClick={() => setShowHelp(!showHelp)}
        type="button"
      >
        {showHelp ? 'Hide' : 'Show'} setup instructions
      </button>

      {showHelp && (
        <div className="daemon-help">
          <h4>Using the Online App with Local Daemon</h4>
          <p>
            To use <code>app.centy.io</code> with a daemon running on your local
            machine, you need to:
          </p>
          <ol>
            <li>
              <strong>Start the daemon with CORS enabled:</strong>
              <pre>
                <code>centy-daemon --cors-origins=https://app.centy.io</code>
              </pre>
            </li>
            <li>
              <strong>
                Set the daemon URL above to your local daemon address
              </strong>{' '}
              (default: <code>http://localhost:50051</code>)
            </li>
          </ol>

          <h4>Exposing Your Local Daemon</h4>
          <p>
            If you want to access your daemon from outside your local network,
            you can use a tunneling service:
          </p>
          <ul>
            <li>
              <strong>ngrok:</strong>{' '}
              <code>ngrok http 50051 --host-header=localhost</code>
            </li>
            <li>
              <strong>Cloudflare Tunnel:</strong>{' '}
              <code>cloudflared tunnel --url http://localhost:50051</code>
            </li>
          </ul>
          <p>Then set the tunnel URL as your daemon URL above.</p>

          <h4>Security Considerations</h4>
          <ul>
            <li>
              Only expose your daemon to trusted origins using the{' '}
              <code>--cors-origins</code> flag
            </li>
            <li>
              Consider using HTTPS when exposing your daemon over the internet
            </li>
            <li>
              The daemon stores project data locally - be careful about who has
              access
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
