'use client'

import { useState, useCallback, useEffect } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  InitRequestSchema,
  GetReconciliationPlanRequestSchema,
  ExecuteReconciliationRequestSchema,
  ReconciliationDecisionsSchema,
  type ReconciliationPlan,
  type InitResponse,
  type FileInfo,
  FileType,
} from '@/gen/centy_pb'

type InitStep = 'input' | 'plan' | 'executing' | 'success' | 'error'

export function InitProject() {
  const [projectPath, setProjectPath] = useState('')
  const [step, setStep] = useState<InitStep>('input')
  const [plan, setPlan] = useState<ReconciliationPlan | null>(null)
  const [result, setResult] = useState<InitResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedRestore, setSelectedRestore] = useState<Set<string>>(new Set())
  const [selectedReset, setSelectedReset] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [isTauri, setIsTauri] = useState(false)
  const [hasWebDirectoryPicker, setHasWebDirectoryPicker] = useState(false)
  const [showPathHint, setShowPathHint] = useState(false)

  useEffect(() => {
    // Check if running in Tauri (which supports full path directory picking)
    setIsTauri(typeof window !== 'undefined' && '__TAURI__' in window)
    // Check if browser supports File System Access API
    setHasWebDirectoryPicker(
      typeof window !== 'undefined' && 'showDirectoryPicker' in window
    )
  }, [])

  const handleSelectFolder = useCallback(async () => {
    try {
      if (isTauri) {
        // Use Tauri's native file picker (provides full path)
        const selected = await open({
          directory: true,
          multiple: false,
          title: 'Select Project Folder',
        })
        if (selected) {
          setProjectPath(selected as string)
        }
      } else if (hasWebDirectoryPicker) {
        // Use File System Access API for web browsers
        // Note: This API only provides folder name, not full path
        const dirHandle = await window.showDirectoryPicker({
          mode: 'read',
        })
        // Show the folder name - user will need to provide the full path
        setProjectPath(dirHandle.name)
        setShowPathHint(true)
      }
    } catch (err) {
      // User cancelled or error occurred
      if ((err as Error).name !== 'AbortError') {
        console.error('Failed to select folder:', err)
      }
    }
  }, [isTauri, hasWebDirectoryPicker])

  const handleQuickInit = useCallback(async () => {
    if (!projectPath.trim()) return

    setLoading(true)
    setError(null)

    try {
      const request = create(InitRequestSchema, {
        projectPath: projectPath.trim(),
        force: true,
      })
      const response = await centyClient.init(request)

      if (response.success) {
        setResult(response)
        setStep('success')
      } else {
        setError(response.error || 'Initialization failed')
        setStep('error')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
      setStep('error')
    } finally {
      setLoading(false)
    }
  }, [projectPath])

  const handleGetPlan = useCallback(async () => {
    if (!projectPath.trim()) return

    setLoading(true)
    setError(null)

    try {
      const request = create(GetReconciliationPlanRequestSchema, {
        projectPath: projectPath.trim(),
      })
      const response = await centyClient.getReconciliationPlan(request)
      setPlan(response)
      setStep('plan')

      // Pre-select all files to restore by default
      setSelectedRestore(new Set(response.toRestore.map(f => f.path)))
      // Don't pre-select files to reset (safer default)
      setSelectedReset(new Set())
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
      setStep('error')
    } finally {
      setLoading(false)
    }
  }, [projectPath])

  const handleExecutePlan = useCallback(async () => {
    if (!projectPath.trim()) return

    setLoading(true)
    setStep('executing')

    try {
      const decisions = create(ReconciliationDecisionsSchema, {
        restore: Array.from(selectedRestore),
        reset: Array.from(selectedReset),
      })

      const request = create(ExecuteReconciliationRequestSchema, {
        projectPath: projectPath.trim(),
        decisions,
      })
      const response = await centyClient.executeReconciliation(request)

      if (response.success) {
        setResult(response)
        setStep('success')
      } else {
        setError(response.error || 'Initialization failed')
        setStep('error')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
      setStep('error')
    } finally {
      setLoading(false)
    }
  }, [projectPath, selectedRestore, selectedReset])

  const toggleRestore = useCallback((path: string) => {
    setSelectedRestore(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const toggleReset = useCallback((path: string) => {
    setSelectedReset(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const handleReset = useCallback(() => {
    setStep('input')
    setPlan(null)
    setResult(null)
    setError(null)
    setSelectedRestore(new Set())
    setSelectedReset(new Set())
  }, [])

  const renderFileList = (files: FileInfo[], title: string) => {
    if (files.length === 0) return null

    return (
      <div className="file-list">
        <h4>{title}</h4>
        <ul>
          {files.map(file => (
            <li key={file.path}>
              <span className="file-icon">
                {file.fileType === FileType.DIRECTORY ? '📁' : '📄'}
              </span>
              <span className="file-path">{file.path}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const renderCheckboxList = (
    files: FileInfo[],
    title: string,
    selected: Set<string>,
    toggle: (path: string) => void,
    description: string
  ) => {
    if (files.length === 0) return null

    return (
      <div className="file-list checkbox-list">
        <h4>{title}</h4>
        <p className="description">{description}</p>
        <ul>
          {files.map(file => (
            <li key={file.path}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.has(file.path)}
                  onChange={() => toggle(file.path)}
                />
                <span className="file-icon">
                  {file.fileType === FileType.DIRECTORY ? '📁' : '📄'}
                </span>
                <span className="file-path">{file.path}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="init-project">
      <h2>Initialize Centy Project</h2>

      {step === 'input' && (
        <div className="input-step">
          <p>
            Create a <code>.centy</code> folder to track issues and
            documentation for your project.
          </p>

          <div className="path-input">
            <label htmlFor="project-path">Project Path:</label>
            <div className="input-row">
              <input
                id="project-path"
                type="text"
                value={projectPath}
                onChange={e => {
                  setProjectPath(e.target.value)
                  setShowPathHint(false)
                }}
                placeholder="/path/to/your/project"
              />
              {(isTauri || hasWebDirectoryPicker) && (
                <button
                  type="button"
                  onClick={handleSelectFolder}
                  className="browse-btn"
                >
                  Browse...
                </button>
              )}
            </div>
            {showPathHint && (
              <p className="path-hint">
                Enter the full path to your project folder (e.g.,
                /Users/you/projects/{projectPath})
              </p>
            )}
          </div>

          <div className="actions">
            <button
              onClick={handleQuickInit}
              disabled={!projectPath.trim() || loading}
              className="primary"
            >
              {loading ? 'Initializing...' : 'Quick Init'}
            </button>
            <button
              onClick={handleGetPlan}
              disabled={!projectPath.trim() || loading}
              className="secondary"
            >
              {loading ? 'Loading...' : 'Review Changes'}
            </button>
          </div>
        </div>
      )}

      {step === 'plan' && plan && (
        <div className="plan-step">
          <h3>Reconciliation Plan</h3>
          <p>
            Review what will happen when initializing <code>{projectPath}</code>
          </p>

          {renderFileList(plan.toCreate, 'Files to Create')}

          {renderCheckboxList(
            plan.toRestore,
            'Files to Restore',
            selectedRestore,
            toggleRestore,
            'These files were deleted but exist in the manifest. Select which to restore.'
          )}

          {renderCheckboxList(
            plan.toReset,
            'Files to Reset',
            selectedReset,
            toggleReset,
            'These files were modified. Select which to reset to original.'
          )}

          {renderFileList(plan.upToDate, 'Up to Date')}
          {renderFileList(plan.userFiles, 'User Files (unchanged)')}

          <div className="actions">
            <button onClick={handleReset} className="secondary">
              Cancel
            </button>
            <button
              onClick={handleExecutePlan}
              disabled={loading}
              className="primary"
            >
              {loading ? 'Executing...' : 'Apply Changes'}
            </button>
          </div>
        </div>
      )}

      {step === 'executing' && (
        <div className="executing-step">
          <div className="spinner" />
          <p>Initializing project...</p>
        </div>
      )}

      {step === 'success' && result && (
        <div className="success-step">
          <h3>Success!</h3>
          <p>
            Centy has been initialized in <code>{projectPath}</code>
          </p>

          {result.created.length > 0 && (
            <div className="result-section">
              <h4>Created:</h4>
              <ul>
                {result.created.map(path => (
                  <li key={path}>{path}</li>
                ))}
              </ul>
            </div>
          )}

          {result.restored.length > 0 && (
            <div className="result-section">
              <h4>Restored:</h4>
              <ul>
                {result.restored.map(path => (
                  <li key={path}>{path}</li>
                ))}
              </ul>
            </div>
          )}

          {result.reset.length > 0 && (
            <div className="result-section">
              <h4>Reset:</h4>
              <ul>
                {result.reset.map(path => (
                  <li key={path}>{path}</li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={handleReset} className="primary">
            Initialize Another Project
          </button>
        </div>
      )}

      {step === 'error' && (
        <div className="error-step">
          <h3>Error</h3>
          <p className="error-message">{error}</p>
          <button onClick={handleReset} className="primary">
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
