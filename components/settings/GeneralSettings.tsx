'use client'

import { useState, useCallback, useEffect } from 'react'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  GetDaemonInfoRequestSchema,
  ShutdownRequestSchema,
  RestartRequestSchema,
  GetLocalLlmConfigRequestSchema,
  UpdateLocalLlmConfigRequestSchema,
  type DaemonInfo,
  type LocalLlmConfig,
} from '@/gen/centy_pb'
import { DaemonSettings } from '@/components/settings/DaemonSettings'
import { AgentConfigEditor } from '@/components/settings/AgentConfigEditor'

export function GeneralSettings() {
  const [daemonInfo, setDaemonInfo] = useState<DaemonInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [shuttingDown, setShuttingDown] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [showShutdownConfirm, setShowShutdownConfirm] = useState(false)
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)

  // LLM Config state
  const [localLlmConfig, setLocalLlmConfig] = useState<
    LocalLlmConfig | undefined
  >(undefined)
  const [originalLocalLlmConfig, setOriginalLocalLlmConfig] = useState<
    LocalLlmConfig | undefined
  >(undefined)
  const [savingLlmConfig, setSavingLlmConfig] = useState(false)

  const isLlmConfigDirty =
    localLlmConfig && originalLocalLlmConfig
      ? JSON.stringify(localLlmConfig) !==
        JSON.stringify(originalLocalLlmConfig)
      : false

  const fetchDaemonInfo = useCallback(async () => {
    try {
      const request = create(GetDaemonInfoRequestSchema, {})
      const response = await centyClient.getDaemonInfo(request)
      setDaemonInfo(response)
    } catch (err) {
      console.error('Failed to fetch daemon info:', err)
    }
  }, [])

  const handleShutdown = useCallback(async () => {
    setShuttingDown(true)
    setError(null)

    try {
      const request = create(ShutdownRequestSchema, {})
      const response = await centyClient.shutdown(request)

      if (response.success) {
        setSuccess(response.message || 'Daemon is shutting down...')
      } else {
        setError('Failed to shutdown daemon')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setShuttingDown(false)
      setShowShutdownConfirm(false)
    }
  }, [])

  const handleRestart = useCallback(async () => {
    setRestarting(true)
    setError(null)

    try {
      const request = create(RestartRequestSchema, {})
      const response = await centyClient.restart(request)

      if (response.success) {
        setSuccess(response.message || 'Daemon is restarting...')
      } else {
        setError('Failed to restart daemon')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setRestarting(false)
      setShowRestartConfirm(false)
    }
  }, [])

  const fetchGlobalLlmConfig = useCallback(async () => {
    try {
      const request = create(GetLocalLlmConfigRequestSchema, {
        projectPath: '',
      })
      const response = await centyClient.getLocalLlmConfig(request)
      setLocalLlmConfig(response.config)
      setOriginalLocalLlmConfig(
        response.config ? structuredClone(response.config) : undefined
      )
    } catch (err) {
      console.error('Failed to fetch global LLM config:', err)
    }
  }, [])

  const handleSaveLlmConfig = useCallback(async () => {
    if (!localLlmConfig) return

    setSavingLlmConfig(true)
    setError(null)
    setSuccess(null)

    try {
      const request = create(UpdateLocalLlmConfigRequestSchema, {
        projectPath: '',
        config: localLlmConfig,
      })
      const response = await centyClient.updateLocalLlmConfig(request)

      if (response.success && response.config) {
        setSuccess('Agent configuration saved successfully')
        setLocalLlmConfig(response.config)
        setOriginalLocalLlmConfig(structuredClone(response.config))
      } else {
        setError(response.error || 'Failed to save agent configuration')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setSavingLlmConfig(false)
    }
  }, [localLlmConfig])

  const handleResetLlmConfig = useCallback(() => {
    if (originalLocalLlmConfig) {
      setLocalLlmConfig(structuredClone(originalLocalLlmConfig))
    }
  }, [originalLocalLlmConfig])

  useEffect(() => {
    fetchDaemonInfo()
    fetchGlobalLlmConfig()
  }, [fetchDaemonInfo, fetchGlobalLlmConfig])

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>General Settings</h2>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <section className="settings-section">
        <h3>Daemon Information</h3>
        <div className="settings-card">
          {daemonInfo ? (
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Version</span>
                <span className="info-value">{daemonInfo.version}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Available Versions</span>
                <span className="info-value">
                  {daemonInfo.availableVersions.length > 0
                    ? daemonInfo.availableVersions.join(', ')
                    : 'None'}
                </span>
              </div>
            </div>
          ) : (
            <div className="loading-inline">Loading daemon info...</div>
          )}

          <div className="daemon-controls">
            <button
              onClick={() => setShowRestartConfirm(true)}
              className="restart-btn"
              disabled={restarting}
            >
              {restarting ? 'Restarting...' : 'Restart Daemon'}
            </button>
            <button
              onClick={() => setShowShutdownConfirm(true)}
              className="shutdown-btn"
              disabled={shuttingDown}
            >
              {shuttingDown ? 'Shutting down...' : 'Shutdown Daemon'}
            </button>
          </div>

          {showRestartConfirm && (
            <div className="confirm-dialog">
              <p>Are you sure you want to restart the daemon?</p>
              <div className="confirm-actions">
                <button
                  onClick={() => setShowRestartConfirm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button onClick={handleRestart} className="confirm-btn">
                  Yes, Restart
                </button>
              </div>
            </div>
          )}

          {showShutdownConfirm && (
            <div className="confirm-dialog danger">
              <p>
                Are you sure you want to shutdown the daemon? You will need to
                manually restart it.
              </p>
              <div className="confirm-actions">
                <button
                  onClick={() => setShowShutdownConfirm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button onClick={handleShutdown} className="confirm-danger-btn">
                  Yes, Shutdown
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="settings-section">
        <h3>Daemon Connection</h3>
        <div className="settings-card">
          <DaemonSettings />
        </div>
      </section>

      <section className="settings-section">
        <h3>Agent Configuration</h3>
        {isLlmConfigDirty && (
          <span className="unsaved-indicator">Unsaved changes</span>
        )}
        <div className="settings-card">
          <AgentConfigEditor
            config={localLlmConfig}
            onChange={setLocalLlmConfig}
            scope="global"
          />
        </div>
        <div className="settings-actions">
          <button
            type="button"
            onClick={handleResetLlmConfig}
            disabled={!isLlmConfigDirty || savingLlmConfig}
            className="reset-btn"
          >
            Reset Changes
          </button>
          <button
            type="button"
            onClick={handleSaveLlmConfig}
            disabled={!isLlmConfigDirty || savingLlmConfig}
            className="save-btn"
          >
            {savingLlmConfig ? 'Saving...' : 'Save Agent Configuration'}
          </button>
        </div>
      </section>
    </div>
  )
}
