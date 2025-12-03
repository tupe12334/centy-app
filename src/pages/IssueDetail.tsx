import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { centyClient } from '../api/client.ts'
import { create } from '@bufbuild/protobuf'
import {
  GetIssueRequestSchema,
  UpdateIssueRequestSchema,
  DeleteIssueRequestSchema,
  ListAssetsRequestSchema,
  type Issue,
  type Asset,
} from '../gen/centy_pb.ts'
import { useProject } from '../context/ProjectContext.tsx'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard.ts'
import { AssetUploader } from '../components/AssetUploader.tsx'
import './IssueDetail.css'

const STATUS_OPTIONS = ['open', 'in-progress', 'closed'] as const

export function IssueDetail() {
  const { issueNumber } = useParams<{ issueNumber: string }>()
  const navigate = useNavigate()
  const { projectPath } = useProject()
  const { copyToClipboard } = useCopyToClipboard()

  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editPriority, setEditPriority] = useState(0) // 0 = no change, 1 = high, 2 = medium, 3 = low
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
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

  useEffect(() => {
    fetchIssue()
    fetchAssets()
  }, [fetchIssue, fetchAssets])

  // Close status dropdown when clicking outside
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

  // Handle inline status change (without entering full edit mode)
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
        navigate('/issues')
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
  }, [projectPath, issueNumber, navigate])

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (issue) {
      setEditTitle(issue.title)
      setEditDescription(issue.description)
      setEditStatus(issue.metadata?.status || 'open')
      setEditPriority(issue.metadata?.priority || 2)
    }
  }

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
        // Handle P1, P2, etc. format
        if (priorityLabel.startsWith('P') || priorityLabel.startsWith('p')) {
          const num = parseInt(priorityLabel.slice(1))
          if (num === 1) return 'priority-high'
          if (num === 2) return 'priority-medium'
          return 'priority-low'
        }
        return ''
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'status-open'
      case 'in-progress':
        return 'status-in-progress'
      case 'closed':
        return 'status-closed'
      default:
        return ''
    }
  }

  if (!projectPath) {
    return (
      <div className="issue-detail">
        <div className="error-message">
          No project path specified. Please go to the{' '}
          <Link to="/issues">issues list</Link> and select a project.
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
        <Link to="/issues" className="back-link">
          Back to Issues
        </Link>
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="issue-detail">
        <div className="error-message">Issue not found</div>
        <Link to="/issues" className="back-link">
          Back to Issues
        </Link>
      </div>
    )
  }

  return (
    <div className="issue-detail">
      <div className="issue-header">
        <Link to="/issues" className="back-link">
          Back to Issues
        </Link>

        <div className="issue-actions">
          {!isEditing ? (
            <>
              <button onClick={() => setIsEditing(true)} className="edit-btn">
                Edit
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
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="closed">Closed</option>
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
              <textarea
                id="edit-description"
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={10}
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
                  className={`status-badge status-badge-clickable ${getStatusClass(issue.metadata?.status || '')} ${updatingStatus ? 'updating' : ''}`}
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
                    {STATUS_OPTIONS.map(status => (
                      <li
                        key={status}
                        role="option"
                        aria-selected={status === issue.metadata?.status}
                        className={`status-option ${getStatusClass(status)} ${status === issue.metadata?.status ? 'selected' : ''}`}
                        onClick={() => handleStatusChange(status)}
                      >
                        {status}
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

            <div className="issue-description">
              <h3>Description</h3>
              {issue.description ? (
                <p>{issue.description}</p>
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
          </>
        )}
      </div>
    </div>
  )
}
