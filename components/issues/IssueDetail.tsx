'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  GetIssueRequestSchema,
  UpdateIssueRequestSchema,
  DeleteIssueRequestSchema,
  ListAssetsRequestSchema,
  SpawnAgentRequestSchema,
  GetLlmWorkRequestSchema,
  OpenInTempVscodeRequestSchema,
  LlmAction,
  type Issue,
  type Asset,
  type LlmWorkSession,
} from '@/gen/centy_pb'
import { useProject } from '@/components/providers/ProjectProvider'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useLastSeenIssues } from '@/hooks/useLastSeenIssues'
import { useStateManager } from '@/lib/state'
import { AssetUploader } from '@/components/assets/AssetUploader'
import { TextEditor } from '@/components/shared/TextEditor'
import { LinkSection } from '@/components/shared/LinkSection'
import { MoveModal } from '@/components/shared/MoveModal'
import { DuplicateModal } from '@/components/shared/DuplicateModal'
import { useSaveShortcut } from '@/hooks/useSaveShortcut'
import { AssigneeSelector } from '@/components/users/AssigneeSelector'

interface IssueDetailProps {
  issueNumber: string
}

export function IssueDetail({ issueNumber }: IssueDetailProps) {
  const router = useRouter()
  const { projectPath } = useProject()
  const { copyToClipboard } = useCopyToClipboard()
  const { recordLastSeen } = useLastSeenIssues()
  const stateManager = useStateManager()
  const stateOptions = stateManager.getStateOptions()

  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editPriority, setEditPriority] = useState(0)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [spawningAgent, setSpawningAgent] = useState(false)
  const [openingInVscode, setOpeningInVscode] = useState(false)
  const [activeWork, setActiveWork] = useState<LlmWorkSession | null>(null)
  const [assignees, setAssignees] = useState<string[]>([])
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  const fetchIssue = useCallback(async () => {
    if (!projectPath || !issueNumber) {
      setError('Missing project path or issue number')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const request = create(GetIssueRequestSchema, {
        projectPath,
        issueId: issueNumber,
      })
      const response = await centyClient.getIssue(request)
      setIssue(response)
      setEditTitle(response.title)
      setEditDescription(response.description)
      setEditStatus(response.metadata?.status || 'open')
      setEditPriority(response.metadata?.priority || 2)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setLoading(false)
    }
  }, [projectPath, issueNumber])

  const fetchAssets = useCallback(async () => {
    if (!projectPath || !issueNumber) return

    try {
      const request = create(ListAssetsRequestSchema, {
        projectPath,
        issueId: issueNumber,
      })
      const response = await centyClient.listAssets(request)
      setAssets(response.assets)
    } catch (err) {
      console.error('Failed to load assets:', err)
    }
  }, [projectPath, issueNumber])

  const fetchActiveWork = useCallback(async () => {
    if (!projectPath) return

    try {
      const request = create(GetLlmWorkRequestSchema, {
        projectPath,
      })
      const response = await centyClient.getLlmWork(request)
      setActiveWork(response.hasActiveWork ? (response.session ?? null) : null)
    } catch (err) {
      // Silently fail - not critical if we can't check active work
      console.error('Failed to check active work:', err)
    }
  }, [projectPath])

  useEffect(() => {
    fetchIssue()
    fetchAssets()
    fetchActiveWork()
  }, [fetchIssue, fetchAssets, fetchActiveWork])

  // Record last seen timestamp when issue is viewed
  useEffect(() => {
    if (issue?.id) {
      recordLastSeen(issue.id)
    }
  }, [issue?.id, recordLastSeen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStatusDropdown(false)
      }
    }

    if (showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStatusDropdown])

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!projectPath || !issueNumber || !issue) return
      if (newStatus === issue.metadata?.status) {
        setShowStatusDropdown(false)
        return
      }

      setUpdatingStatus(true)
      setError(null)

      try {
        const request = create(UpdateIssueRequestSchema, {
          projectPath,
          issueId: issueNumber,
          status: newStatus,
        })
        const response = await centyClient.updateIssue(request)

        if (response.success && response.issue) {
          setIssue(response.issue)
          setEditStatus(response.issue.metadata?.status || 'open')
        } else {
          setError(response.error || 'Failed to update status')
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to connect to daemon'
        )
      } finally {
        setUpdatingStatus(false)
        setShowStatusDropdown(false)
      }
    },
    [projectPath, issueNumber, issue]
  )

  const handleSave = useCallback(async () => {
    if (!projectPath || !issueNumber) return

    setSaving(true)
    setError(null)

    try {
      const request = create(UpdateIssueRequestSchema, {
        projectPath,
        issueId: issueNumber,
        title: editTitle,
        description: editDescription,
        status: editStatus,
        priority: editPriority,
      })
      const response = await centyClient.updateIssue(request)

      if (response.success && response.issue) {
        setIssue(response.issue)
        setIsEditing(false)
      } else {
        setError(response.error || 'Failed to update issue')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setSaving(false)
    }
  }, [
    projectPath,
    issueNumber,
    editTitle,
    editDescription,
    editStatus,
    editPriority,
  ])

  const handleDelete = useCallback(async () => {
    if (!projectPath || !issueNumber) return

    setDeleting(true)
    setError(null)

    try {
      const request = create(DeleteIssueRequestSchema, {
        projectPath,
        issueId: issueNumber,
      })
      const response = await centyClient.deleteIssue(request)

      if (response.success) {
        router.push('/issues')
      } else {
        setError(response.error || 'Failed to delete issue')
        setShowDeleteConfirm(false)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }, [projectPath, issueNumber, router])

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (issue) {
      setEditTitle(issue.title)
      setEditDescription(issue.description)
      setEditStatus(issue.metadata?.status || 'open')
      setEditPriority(issue.metadata?.priority || 2)
    }
  }

  const handleSpawnPlan = useCallback(async () => {
    if (!projectPath || !issue) return

    setSpawningAgent(true)
    setError(null)

    try {
      const request = create(SpawnAgentRequestSchema, {
        projectPath,
        issueId: issue.id,
        action: LlmAction.PLAN,
        agentName: '',
        extraArgs: [],
      })
      const response = await centyClient.spawnAgent(request)

      if (response.success) {
        await fetchActiveWork()
      } else {
        setError(response.error || 'Failed to spawn AI agent')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setSpawningAgent(false)
    }
  }, [projectPath, issue, fetchActiveWork])

  const handleOpenInVscode = useCallback(async () => {
    if (!projectPath || !issue) return

    setOpeningInVscode(true)
    setError(null)

    try {
      const request = create(OpenInTempVscodeRequestSchema, {
        projectPath,
        issueId: issue.id,
        action: LlmAction.PLAN,
        agentName: '',
        ttlHours: 0,
      })
      const response = await centyClient.openInTempVscode(request)

      if (response.success) {
        if (!response.vscodeOpened) {
          setError(
            `Workspace created at ${response.workspacePath} but VS Code could not be opened automatically`
          )
        }
      } else {
        setError(response.error || 'Failed to open in VS Code')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setOpeningInVscode(false)
    }
  }, [projectPath, issue])

  const handleMoved = useCallback((targetProjectPath: string) => {
    // Redirect to the issue in the target project
    window.location.href = `/?project=${encodeURIComponent(targetProjectPath)}`
  }, [])

  const handleDuplicated = useCallback(
    (newIssueId: string, targetProjectPath: string) => {
      if (targetProjectPath === projectPath) {
        // Same project - navigate to the new issue
        router.push(`/issues/${newIssueId}`)
      } else {
        // Different project - redirect to target project
        window.location.href = `/?project=${encodeURIComponent(targetProjectPath)}`
      }
      setShowDuplicateModal(false)
    },
    [projectPath, router]
  )

  useSaveShortcut({
    onSave: handleSave,
    enabled: isEditing && !saving && !!editTitle.trim(),
  })

  const getPriorityClass = (priorityLabel: string) => {
    switch (priorityLabel.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'priority-high'
      case 'medium':
      case 'normal':
        return 'priority-medium'
      case 'low':
        return 'priority-low'
      default:
        if (priorityLabel.startsWith('P') || priorityLabel.startsWith('p')) {
          const num = parseInt(priorityLabel.slice(1))
          if (num === 1) return 'priority-high'
          if (num === 2) return 'priority-medium'
          return 'priority-low'
        }
        return ''
    }
  }

  if (!projectPath) {
    return (
      <div className="issue-detail">
        <div className="error-message">
          No project path specified. Please go to the{' '}
          <Link href="/issues">issues list</Link> and select a project.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="issue-detail">
        <div className="loading">Loading issue...</div>
      </div>
    )
  }

  if (error && !issue) {
    return (
      <div className="issue-detail">
        <div className="error-message">{error}</div>
        <Link href="/issues" className="back-link">
          Back to Issues
        </Link>
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="issue-detail">
        <div className="error-message">Issue not found</div>
        <Link href="/issues" className="back-link">
          Back to Issues
        </Link>
      </div>
    )
  }

  return (
    <div className="issue-detail">
      <div className="issue-header">
        <Link href="/issues" className="back-link">
          Back to Issues
        </Link>

        <div className="issue-actions">
          {!isEditing ? (
            <>
              <button
                onClick={handleSpawnPlan}
                disabled={spawningAgent || !!activeWork}
                className="ai-plan-btn"
                title={
                  activeWork
                    ? `Agent running on #${activeWork.displayNumber}`
                    : 'Generate AI plan'
                }
              >
                {spawningAgent ? 'Spawning...' : 'AI Plan'}
              </button>
              <button
                onClick={handleOpenInVscode}
                disabled={openingInVscode}
                className="vscode-btn"
                title="Open in a temporary VS Code workspace with AI agent"
              >
                {openingInVscode ? 'Opening...' : 'Open in VS Code'}
              </button>
              <button onClick={() => setIsEditing(true)} className="edit-btn">
                Edit
              </button>
              <button
                onClick={() => setShowMoveModal(true)}
                className="move-btn"
              >
                Move
              </button>
              <button
                onClick={() => setShowDuplicateModal(true)}
                className="duplicate-btn"
              >
                Duplicate
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="delete-btn"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={handleCancelEdit} className="cancel-btn">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="save-btn"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showDeleteConfirm && (
        <div className="delete-confirm">
          <p>Are you sure you want to delete this issue?</p>
          <div className="delete-confirm-actions">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="confirm-delete-btn"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      )}

      <div className="issue-content">
        <button
          type="button"
          className="issue-number-badge"
          onClick={() =>
            issueNumber &&
            copyToClipboard(issueNumber, `issue #${issue.displayNumber}`)
          }
          title="Click to copy UUID"
        >
          #{issue.displayNumber}
        </button>

        {isEditing ? (
          <div className="edit-form">
            <div className="form-group">
              <label htmlFor="edit-title">Title:</label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-status">Status:</label>
                <select
                  id="edit-status"
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                >
                  {stateOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-priority">Priority:</label>
                <select
                  id="edit-priority"
                  value={editPriority}
                  onChange={e => setEditPriority(Number(e.target.value))}
                >
                  <option value={1}>High</option>
                  <option value={2}>Medium</option>
                  <option value={3}>Low</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="edit-description">Description:</label>
              <TextEditor
                value={editDescription}
                onChange={setEditDescription}
                format="md"
                mode="edit"
                placeholder="Describe the issue..."
                minHeight={200}
              />
            </div>

            <div className="form-group">
              <label>Attachments:</label>
              <AssetUploader
                projectPath={projectPath}
                issueId={issueNumber}
                mode="edit"
                initialAssets={assets}
                onAssetsChange={setAssets}
              />
            </div>
          </div>
        ) : (
          <>
            <h1 className="issue-title">{issue.title}</h1>

            <div className="issue-metadata">
              <div className="status-selector" ref={statusDropdownRef}>
                <button
                  className={`status-badge status-badge-clickable ${stateManager.getStateClass(issue.metadata?.status || '')} ${updatingStatus ? 'updating' : ''}`}
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  disabled={updatingStatus}
                  aria-label="Change status"
                  aria-expanded={showStatusDropdown}
                  aria-haspopup="listbox"
                >
                  {updatingStatus
                    ? 'Updating...'
                    : issue.metadata?.status || 'unknown'}
                  <span className="status-dropdown-arrow" aria-hidden="true">
                    ▼
                  </span>
                </button>
                {showStatusDropdown && (
                  <ul
                    className="status-dropdown"
                    role="listbox"
                    aria-label="Status options"
                  >
                    {stateOptions.map(option => (
                      <li
                        key={option.value}
                        role="option"
                        aria-selected={option.value === issue.metadata?.status}
                        className={`status-option ${stateManager.getStateClass(option.value)} ${option.value === issue.metadata?.status ? 'selected' : ''}`}
                        onClick={() => handleStatusChange(option.value)}
                      >
                        {option.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <span
                className={`priority-badge ${getPriorityClass(issue.metadata?.priorityLabel || '')}`}
              >
                {issue.metadata?.priorityLabel || 'unknown'}
              </span>
              <span className="issue-date">
                Created:{' '}
                {issue.metadata?.createdAt
                  ? new Date(issue.metadata.createdAt).toLocaleString()
                  : '-'}
              </span>
              {issue.metadata?.updatedAt && (
                <span className="issue-date">
                  Updated: {new Date(issue.metadata.updatedAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="issue-assignees">
              <h4>Assignees</h4>
              <AssigneeSelector
                projectPath={projectPath}
                issueId={issueNumber}
                currentAssignees={assignees}
                onAssigneesChange={setAssignees}
              />
            </div>

            <div className="issue-description">
              <h3>Description</h3>
              {issue.description ? (
                <TextEditor
                  value={issue.description}
                  format="md"
                  mode="display"
                />
              ) : (
                <p className="no-description">No description provided</p>
              )}
            </div>

            <div className="issue-assets">
              <h3>Attachments</h3>
              {assets.length > 0 ? (
                <AssetUploader
                  projectPath={projectPath}
                  issueId={issueNumber}
                  mode="edit"
                  initialAssets={assets}
                  onAssetsChange={setAssets}
                />
              ) : (
                <p className="no-assets">No attachments</p>
              )}
            </div>

            <LinkSection
              entityId={issue.id}
              entityType="issue"
              editable={true}
            />
          </>
        )}
      </div>

      {showMoveModal && issue && (
        <MoveModal
          entityType="issue"
          entityId={issue.id}
          entityTitle={issue.title}
          currentProjectPath={projectPath}
          onClose={() => setShowMoveModal(false)}
          onMoved={handleMoved}
        />
      )}

      {showDuplicateModal && issue && (
        <DuplicateModal
          entityType="issue"
          entityId={issue.id}
          entityTitle={issue.title}
          currentProjectPath={projectPath}
          onClose={() => setShowDuplicateModal(false)}
          onDuplicated={handleDuplicated}
        />
      )}
    </div>
  )
}
