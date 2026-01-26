'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  OpenStandaloneVscodeRequestSchema,
  OpenStandaloneTerminalRequestSchema,
} from '@/gen/centy_pb'
import { EditorType } from '@/gen/centy_pb'
import { useDaemonStatus } from '@/components/providers/DaemonStatusProvider'
import '@/styles/components/StandaloneWorkspaceModal.css'

interface StandaloneWorkspaceModalProps {
  projectPath: string
  onClose: () => void
  onCreated?: (workspacePath: string) => void
}

const TTL_OPTIONS = [
  { value: 1, label: '1 hour' },
  { value: 4, label: '4 hours' },
  { value: 12, label: '12 hours (default)' },
  { value: 24, label: '24 hours' },
  { value: 48, label: '48 hours' },
]

export function StandaloneWorkspaceModal({
  projectPath,
  onClose,
  onCreated,
}: StandaloneWorkspaceModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const { editors } = useDaemonStatus()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ttlHours, setTtlHours] = useState(12)
  const [selectedEditor, setSelectedEditor] = useState<EditorType>(
    EditorType.VSCODE
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check editor availability
  const isEditorAvailable = useCallback(
    (type: EditorType): boolean => {
      const editor = editors.find(e => e.editorType === type)
      return editor?.available ?? false
    },
    [editors]
  )

  // Set initial editor based on availability
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (
        !isEditorAvailable(EditorType.VSCODE) &&
        isEditorAvailable(EditorType.TERMINAL)
      ) {
        setSelectedEditor(EditorType.TERMINAL)
      }
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [isEditorAvailable])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleCreate = useCallback(async () => {
    if (!projectPath) return

    setLoading(true)
    setError(null)

    try {
      if (selectedEditor === EditorType.VSCODE) {
        const request = create(OpenStandaloneVscodeRequestSchema, {
          projectPath,
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          agentName: '',
          ttlHours,
        })
        const response = await centyClient.openStandaloneVscode(request)

        if (response.success) {
          onCreated?.(response.workspacePath)
          onClose()
        } else {
          setError(response.error || 'Failed to create workspace')
        }
      } else {
        const request = create(OpenStandaloneTerminalRequestSchema, {
          projectPath,
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          agentName: '',
          ttlHours,
        })
        const response = await centyClient.openStandaloneTerminal(request)

        if (response.success) {
          onCreated?.(response.workspacePath)
          onClose()
        } else {
          setError(response.error || 'Failed to create workspace')
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create workspace'
      )
    } finally {
      setLoading(false)
    }
  }, [
    projectPath,
    name,
    description,
    ttlHours,
    selectedEditor,
    onCreated,
    onClose,
  ])

  const hasAvailableEditor =
    isEditorAvailable(EditorType.VSCODE) ||
    isEditorAvailable(EditorType.TERMINAL)

  return (
    <div className="standalone-modal-overlay">
      <div className="standalone-modal" ref={modalRef}>
        <div className="standalone-modal-header">
          <h3>New Standalone Workspace</h3>
          <button className="standalone-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="standalone-modal-body">
          {error && <div className="standalone-modal-error">{error}</div>}

          <div className="standalone-modal-description">
            Create a temporary workspace without associating it with an issue.
            Great for quick experiments or exploratory work.
          </div>

          <div className="standalone-modal-field">
            <label htmlFor="workspace-name">Name (optional)</label>
            <input
              id="workspace-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Experiment with new API"
              className="standalone-modal-input"
            />
          </div>

          <div className="standalone-modal-field">
            <label htmlFor="workspace-description">
              Description (optional)
            </label>
            <textarea
              id="workspace-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What would you like to work on in this workspace?"
              className="standalone-modal-textarea"
              rows={3}
            />
          </div>

          <div className="standalone-modal-field">
            <label htmlFor="workspace-ttl">Workspace Duration</label>
            <select
              id="workspace-ttl"
              value={ttlHours}
              onChange={e => setTtlHours(Number(e.target.value))}
              className="standalone-modal-select"
            >
              {TTL_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="standalone-modal-field">
            <label>Open In</label>
            <div className="standalone-modal-editor-options">
              <button
                type="button"
                className={`standalone-editor-option ${selectedEditor === EditorType.VSCODE ? 'selected' : ''} ${!isEditorAvailable(EditorType.VSCODE) ? 'disabled' : ''}`}
                onClick={() =>
                  isEditorAvailable(EditorType.VSCODE) &&
                  setSelectedEditor(EditorType.VSCODE)
                }
                disabled={!isEditorAvailable(EditorType.VSCODE)}
              >
                <VscodeIcon />
                <span>VS Code</span>
                {!isEditorAvailable(EditorType.VSCODE) && (
                  <span className="unavailable-badge">Not available</span>
                )}
              </button>
              <button
                type="button"
                className={`standalone-editor-option ${selectedEditor === EditorType.TERMINAL ? 'selected' : ''} ${!isEditorAvailable(EditorType.TERMINAL) ? 'disabled' : ''}`}
                onClick={() =>
                  isEditorAvailable(EditorType.TERMINAL) &&
                  setSelectedEditor(EditorType.TERMINAL)
                }
                disabled={!isEditorAvailable(EditorType.TERMINAL)}
              >
                <TerminalIcon />
                <span>Terminal</span>
                {!isEditorAvailable(EditorType.TERMINAL) && (
                  <span className="unavailable-badge">Not available</span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="standalone-modal-footer">
          <button className="standalone-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="standalone-modal-submit"
            onClick={handleCreate}
            disabled={loading || !hasAvailableEditor}
          >
            {loading ? 'Creating...' : 'Create Workspace'}
          </button>
        </div>
      </div>
    </div>
  )
}

// VS Code icon component
function VscodeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.583 17.222L8.528 8.167 2.75 13.944v2.111l4.917 4.195 9.916-3.028zm0-10.444L8.528 15.833 2.75 10.056V7.944l4.917-4.194 9.916 3.028zM2.75 10.056L8.528 12 2.75 13.944v-3.888zm14.833 10.166L21.25 18v-12l-3.667 2.222v7.778l.028 2.222z" />
    </svg>
  )
}

// Terminal icon component
function TerminalIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  )
}
