'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  GetUserRequestSchema,
  UpdateUserRequestSchema,
  DeleteUserRequestSchema,
  type User,
} from '@/gen/centy_pb'
import { useProject } from '@/components/providers/ProjectProvider'
import { useSaveShortcut } from '@/hooks/useSaveShortcut'

interface UserDetailProps {
  userId: string
}

export function UserDetail({ userId }: UserDetailProps) {
  const router = useRouter()
  const params = useParams()
  const { projectPath } = useProject()

  const usersListUrl = useMemo(() => {
    const org = params.organization as string | undefined
    const project = params.project as string | undefined
    if (org && project) return `/${org}/${project}/users` as Route
    return '/' as Route
  }, [params])

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editGitUsernames, setEditGitUsernames] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const fetchUser = useCallback(async () => {
    if (!projectPath || !userId) {
      setError('Missing project path or user ID')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const request = create(GetUserRequestSchema, {
        projectPath,
        userId,
      })
      const response = await centyClient.getUser(request)
      setUser(response)
      setEditName(response.name)
      setEditEmail(response.email || '')
      setEditGitUsernames([...response.gitUsernames])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      if (message.includes('unimplemented')) {
        setError(
          'User management is not yet available. Please update your daemon to the latest version.'
        )
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }, [projectPath, userId])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const handleSave = useCallback(async () => {
    if (!projectPath || !userId) return

    setSaving(true)
    setError(null)

    try {
      const request = create(UpdateUserRequestSchema, {
        projectPath,
        userId,
        name: editName,
        email: editEmail,
        gitUsernames: editGitUsernames.filter(u => u.trim() !== ''),
      })
      const response = await centyClient.updateUser(request)

      if (response.success && response.user) {
        setUser(response.user)
        setIsEditing(false)
      } else {
        const errorMsg = response.error || 'Failed to update user'
        if (errorMsg.includes('unimplemented')) {
          setError(
            'User management is not yet available. Please update your daemon to the latest version.'
          )
        } else {
          setError(errorMsg)
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      if (message.includes('unimplemented')) {
        setError(
          'User management is not yet available. Please update your daemon to the latest version.'
        )
      } else {
        setError(message)
      }
    } finally {
      setSaving(false)
    }
  }, [projectPath, userId, editName, editEmail, editGitUsernames])

  const handleDelete = useCallback(async () => {
    if (!projectPath || !userId) return

    setDeleting(true)
    setError(null)

    try {
      const request = create(DeleteUserRequestSchema, {
        projectPath,
        userId,
      })
      const response = await centyClient.deleteUser(request)

      if (response.success) {
        router.push(usersListUrl)
      } else {
        const errorMsg = response.error || 'Failed to delete user'
        if (errorMsg.includes('unimplemented')) {
          setError(
            'User management is not yet available. Please update your daemon to the latest version.'
          )
        } else {
          setError(errorMsg)
        }
        setShowDeleteConfirm(false)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      if (message.includes('unimplemented')) {
        setError(
          'User management is not yet available. Please update your daemon to the latest version.'
        )
      } else {
        setError(message)
      }
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }, [projectPath, userId, router])

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (user) {
      setEditName(user.name)
      setEditEmail(user.email || '')
      setEditGitUsernames([...user.gitUsernames])
    }
  }

  const handleAddGitUsername = () => {
    setEditGitUsernames([...editGitUsernames, ''])
  }

  const handleRemoveGitUsername = (index: number) => {
    setEditGitUsernames(editGitUsernames.filter((_, i) => i !== index))
  }

  const handleGitUsernameChange = (index: number, value: string) => {
    const updated = [...editGitUsernames]
    updated[index] = value
    setEditGitUsernames(updated)
  }

  useSaveShortcut({
    onSave: handleSave,
    enabled: isEditing && !saving && !!editName.trim(),
  })

  if (!projectPath) {
    return (
      <div className="user-detail">
        <div className="error-message">
          No project path specified. Please go to the{' '}
          <Link href={usersListUrl}>users list</Link> and select a project.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="user-detail">
        <div className="loading">Loading user...</div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="user-detail">
        <div className="error-message">{error}</div>
        <Link href={usersListUrl} className="back-link">
          Back to Users
        </Link>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="user-detail">
        <div className="error-message">User not found</div>
        <Link href={usersListUrl} className="back-link">
          Back to Users
        </Link>
      </div>
    )
  }

  return (
    <div className="user-detail">
      <div className="user-header">
        <Link href={usersListUrl} className="back-link">
          Back to Users
        </Link>

        <div className="user-actions">
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
                disabled={saving || !editName.trim()}
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
          <p>Are you sure you want to delete this user?</p>
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

      <div className="user-content">
        <div className="user-id-badge">@{user.id}</div>

        {isEditing ? (
          <div className="edit-form">
            <div className="form-group">
              <label htmlFor="edit-name">Name:</label>
              <input
                id="edit-name"
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Display name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-email">Email:</label>
              <input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                placeholder="Email address (optional)"
              />
            </div>

            <div className="form-group">
              <label>Git Usernames:</label>
              <div className="git-usernames-list">
                {editGitUsernames.map((username, index) => (
                  <div key={index} className="git-username-item">
                    <input
                      type="text"
                      value={username}
                      onChange={e =>
                        handleGitUsernameChange(index, e.target.value)
                      }
                      placeholder="Git username"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGitUsername(index)}
                      className="remove-git-username-btn"
                      title="Remove"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddGitUsername}
                  className="add-git-username-btn"
                >
                  + Add Git Username
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h1 className="user-name">{user.name}</h1>

            <div className="user-metadata">
              <div className="metadata-row">
                <span className="metadata-label">Email:</span>
                <span className="metadata-value">
                  {user.email || <span className="no-value">Not set</span>}
                </span>
              </div>

              <div className="metadata-row">
                <span className="metadata-label">Git Usernames:</span>
                <span className="metadata-value">
                  {user.gitUsernames.length > 0 ? (
                    user.gitUsernames.map((username, i) => (
                      <span key={i} className="git-username-badge">
                        {username}
                      </span>
                    ))
                  ) : (
                    <span className="no-value">None</span>
                  )}
                </span>
              </div>

              <div className="metadata-row">
                <span className="metadata-label">Created:</span>
                <span className="metadata-value">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleString()
                    : '-'}
                </span>
              </div>

              {user.updatedAt && (
                <div className="metadata-row">
                  <span className="metadata-label">Updated:</span>
                  <span className="metadata-value">
                    {new Date(user.updatedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
