'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  GetPrRequestSchema,
  UpdatePrRequestSchema,
  DeletePrRequestSchema,
  type PullRequest,
  type Asset,
} from '@/gen/centy_pb'
import { useProject } from '@/components/providers/ProjectProvider'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useAppLink } from '@/hooks/useAppLink'
import { AssetUploader } from '@/components/assets/AssetUploader'
import { TextEditor } from '@/components/shared/TextEditor'
import { LinkSection } from '@/components/shared/LinkSection'
import { useEntityActions, EntityType } from '@/hooks/useEntityActions'
import { useActionShortcuts } from '@/hooks/useActionShortcuts'
import { ActionBar } from '@/components/shared/ActionBar'
import '@/styles/pages/PRDetail.css'

interface PRDetailProps {
  prNumber: string
}

export function PRDetail({ prNumber }: PRDetailProps) {
  const router = useRouter()
  const { projectPath } = useProject()
  const { copyToClipboard } = useCopyToClipboard()
  const { createLink } = useAppLink()

  // Get the project-scoped pull requests URL
  const prListUrl = createLink('/pull-requests')

  const [pr, setPr] = useState<PullRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editPriority, setEditPriority] = useState(0)
  const [editSourceBranch, setEditSourceBranch] = useState('')
  const [editTargetBranch, setEditTargetBranch] = useState('')
  const [saving, setSaving] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_deleting, setDeleting] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set())

  // Fetch entity actions from daemon
  const { actions } = useEntityActions(EntityType.PR, prNumber)

  const fetchPr = useCallback(async () => {
    if (!projectPath || !prNumber) {
      setError('Missing project path or PR number')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const request = create(GetPrRequestSchema, {
        projectPath,
        prId: prNumber,
      })
      const response = await centyClient.getPr(request)
      setPr(response)
      setEditTitle(response.title)
      setEditDescription(response.description)
      setEditStatus(response.metadata?.status || 'draft')
      setEditPriority(response.metadata?.priority || 2)
      setEditSourceBranch(response.metadata?.sourceBranch || '')
      setEditTargetBranch(response.metadata?.targetBranch || '')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setLoading(false)
    }
  }, [projectPath, prNumber])

  const fetchAssets = useCallback(async () => {
    // PR assets not supported in current API - only issue assets
    // Keeping function for future implementation
    setAssets([])
  }, [])

  useEffect(() => {
    fetchPr()
    fetchAssets()
  }, [fetchPr, fetchAssets])

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!projectPath || !prNumber || !pr) return
      if (newStatus === pr.metadata?.status) return

      setError(null)

      try {
        const request = create(UpdatePrRequestSchema, {
          projectPath,
          prId: prNumber,
          status: newStatus,
        })
        const response = await centyClient.updatePr(request)

        if (response.success && response.pr) {
          setPr(response.pr)
          setEditStatus(response.pr.metadata?.status || 'draft')
        } else {
          setError(response.error || 'Failed to update status')
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to connect to daemon'
        )
      }
    },
    [projectPath, prNumber, pr]
  )

  const handleSave = useCallback(async () => {
    if (!projectPath || !prNumber) return

    setSaving(true)
    setError(null)

    try {
      const request = create(UpdatePrRequestSchema, {
        projectPath,
        prId: prNumber,
        title: editTitle,
        description: editDescription,
        status: editStatus,
        priority: editPriority,
        sourceBranch: editSourceBranch,
        targetBranch: editTargetBranch,
      })
      const response = await centyClient.updatePr(request)

      if (response.success && response.pr) {
        setPr(response.pr)
        setIsEditing(false)
      } else {
        setError(response.error || 'Failed to update PR')
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
    prNumber,
    editTitle,
    editDescription,
    editStatus,
    editPriority,
    editSourceBranch,
    editTargetBranch,
  ])

  const handleDelete = useCallback(async () => {
    if (!projectPath || !prNumber) return

    setDeleting(true)
    setError(null)

    try {
      const request = create(DeletePrRequestSchema, {
        projectPath,
        prId: prNumber,
      })
      const response = await centyClient.deletePr(request)

      if (response.success) {
        router.push(prListUrl)
      } else {
        setError(response.error || 'Failed to delete PR')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setDeleting(false)
    }
  }, [projectPath, prNumber, router, prListUrl])

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (pr) {
      setEditTitle(pr.title)
      setEditDescription(pr.description)
      setEditStatus(pr.metadata?.status || 'draft')
      setEditPriority(pr.metadata?.priority || 2)
      setEditSourceBranch(pr.metadata?.sourceBranch || '')
      setEditTargetBranch(pr.metadata?.targetBranch || '')
    }
  }

  // Handle action from ActionBar
  const handleAction = useCallback(
    async (actionId: string) => {
      setLoadingActions(prev => new Set(prev).add(actionId))

      try {
        switch (actionId) {
          case 'edit':
            setIsEditing(true)
            break
          case 'delete':
            await handleDelete()
            break
          default:
            // Handle status changes (status:draft, status:open, etc.)
            if (actionId.startsWith('status:')) {
              const newStatus = actionId.replace('status:', '')
              await handleStatusChange(newStatus)
            }
        }
      } finally {
        setLoadingActions(prev => {
          const next = new Set(prev)
          next.delete(actionId)
          return next
        })
      }
    },
    [handleDelete, handleStatusChange]
  )

  // Set up keyboard shortcuts
  useActionShortcuts({
    actions,
    onAction: handleAction,
    enabled: !isEditing,
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

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'status-draft'
      case 'open':
        return 'status-open'
      case 'merged':
        return 'status-merged'
      case 'closed':
        return 'status-closed'
      default:
        return ''
    }
  }

  if (!projectPath) {
    return (
      <div className="pr-detail">
        <div className="error-message">
          No project path specified. Please go to the{' '}
          <Link href={prListUrl}>pull requests list</Link> and select a project.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="pr-detail">
        <div className="loading">Loading pull request...</div>
      </div>
    )
  }

  if (error && !pr) {
    return (
      <div className="pr-detail">
        <div className="error-message">{error}</div>
        <Link href={prListUrl} className="back-link">
          Back to Pull Requests
        </Link>
      </div>
    )
  }

  if (!pr) {
    return (
      <div className="pr-detail">
        <div className="error-message">Pull request not found</div>
        <Link href={prListUrl} className="back-link">
          Back to Pull Requests
        </Link>
      </div>
    )
  }

  return (
    <div className="pr-detail">
      <div className="pr-header">
        <Link href={prListUrl} className="back-link">
          Back to Pull Requests
        </Link>

        <div className="pr-actions">
          <ActionBar
            actions={actions}
            onAction={handleAction}
            loadingActions={loadingActions}
            isEditing={isEditing}
            onSave={handleSave}
            onCancel={handleCancelEdit}
            saving={saving}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="pr-content">
        <button
          type="button"
          className="pr-number-badge"
          onClick={() =>
            prNumber && copyToClipboard(prNumber, `PR #${pr.displayNumber}`)
          }
          title="Click to copy UUID"
        >
          #{pr.displayNumber}
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
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="merged">Merged</option>
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

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-source-branch">Source Branch:</label>
                <input
                  id="edit-source-branch"
                  type="text"
                  value={editSourceBranch}
                  onChange={e => setEditSourceBranch(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-target-branch">Target Branch:</label>
                <input
                  id="edit-target-branch"
                  type="text"
                  value={editTargetBranch}
                  onChange={e => setEditTargetBranch(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="edit-description">Description:</label>
              <TextEditor
                value={editDescription}
                onChange={setEditDescription}
                format="md"
                mode="edit"
                placeholder="Describe the pull request..."
                minHeight={200}
              />
            </div>

            <div className="form-group">
              <label>Attachments:</label>
              <AssetUploader
                projectPath={projectPath}
                prId={prNumber}
                mode="edit"
                initialAssets={assets}
                onAssetsChange={setAssets}
              />
            </div>
          </div>
        ) : (
          <>
            <h1 className="pr-title">{pr.title}</h1>

            <div className="pr-metadata">
              <span
                className={`status-badge ${getStatusClass(pr.metadata?.status || '')}`}
              >
                {pr.metadata?.status || 'unknown'}
              </span>
              <span
                className={`priority-badge ${getPriorityClass(pr.metadata?.priorityLabel || '')}`}
              >
                {pr.metadata?.priorityLabel || 'unknown'}
              </span>
            </div>

            <div className="pr-branches">
              <span className="branch-label">Branches:</span>
              <span className="branch-source">
                {pr.metadata?.sourceBranch || 'unknown'}
              </span>
              <span className="branch-arrow">→</span>
              <span className="branch-target">
                {pr.metadata?.targetBranch || 'unknown'}
              </span>
            </div>

            <div className="pr-dates">
              <span className="pr-date">
                Created:{' '}
                {pr.metadata?.createdAt
                  ? new Date(pr.metadata.createdAt).toLocaleString()
                  : '-'}
              </span>
              {pr.metadata?.updatedAt && (
                <span className="pr-date">
                  Updated: {new Date(pr.metadata.updatedAt).toLocaleString()}
                </span>
              )}
              {pr.metadata?.mergedAt && (
                <span className="pr-date merged">
                  Merged: {new Date(pr.metadata.mergedAt).toLocaleString()}
                </span>
              )}
              {pr.metadata?.closedAt && (
                <span className="pr-date closed">
                  Closed: {new Date(pr.metadata.closedAt).toLocaleString()}
                </span>
              )}
            </div>

            {pr.metadata?.reviewers && pr.metadata.reviewers.length > 0 && (
              <div className="pr-reviewers">
                <span className="reviewers-label">Reviewers:</span>
                {pr.metadata.reviewers.map((reviewer, index) => (
                  <span key={index} className="reviewer">
                    {reviewer}
                  </span>
                ))}
              </div>
            )}

            <div className="pr-description">
              <h3>Description</h3>
              {pr.description ? (
                <TextEditor value={pr.description} format="md" mode="display" />
              ) : (
                <p className="no-description">No description provided</p>
              )}
            </div>

            <div className="pr-assets">
              <h3>Attachments</h3>
              {assets.length > 0 ? (
                <AssetUploader
                  projectPath={projectPath}
                  prId={prNumber}
                  mode="edit"
                  initialAssets={assets}
                  onAssetsChange={setAssets}
                />
              ) : (
                <p className="no-assets">No attachments</p>
              )}
            </div>

            <LinkSection entityId={pr.id} entityType="pr" editable={true} />
          </>
        )}
      </div>
    </div>
  )
}
