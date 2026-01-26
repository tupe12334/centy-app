'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { route } from 'nextjs-routes'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  GetOrganizationRequestSchema,
  UpdateOrganizationRequestSchema,
  DeleteOrganizationRequestSchema,
  ListProjectsRequestSchema,
  type Organization,
  type ProjectInfo,
} from '@/gen/centy_pb'
import { useSaveShortcut } from '@/hooks/useSaveShortcut'

interface OrganizationDetailProps {
  orgSlug: string
}

export function OrganizationDetail({ orgSlug }: OrganizationDetailProps) {
  const router = useRouter()

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchOrganization = useCallback(async () => {
    if (!orgSlug) {
      setError('Missing organization slug')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const request = create(GetOrganizationRequestSchema, { slug: orgSlug })
      const response = await centyClient.getOrganization(request)

      if (!response.found || !response.organization) {
        setError('Organization not found')
        setLoading(false)
        return
      }

      const org = response.organization
      setOrganization(org)
      setEditName(org.name)
      setEditDescription(org.description || '')
      setEditSlug(org.slug)

      // Fetch projects in this organization
      const projectsRequest = create(ListProjectsRequestSchema, {
        organizationSlug: orgSlug,
      })
      const projectsResponse = await centyClient.listProjects(projectsRequest)
      setProjects(projectsResponse.projects)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      if (message.includes('unimplemented')) {
        setError(
          'Organizations feature is not available. Please update your daemon.'
        )
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }, [orgSlug])

  useEffect(() => {
    fetchOrganization()
  }, [fetchOrganization])

  const handleSave = useCallback(async () => {
    if (!orgSlug) return

    setSaving(true)
    setError(null)

    try {
      const request = create(UpdateOrganizationRequestSchema, {
        slug: orgSlug,
        name: editName,
        description: editDescription,
        newSlug: editSlug !== orgSlug ? editSlug : undefined,
      })
      const response = await centyClient.updateOrganization(request)

      if (response.success && response.organization) {
        setOrganization(response.organization)
        setIsEditing(false)
        // If slug changed, navigate to new URL
        if (response.organization.slug !== orgSlug) {
          router.push(
            route({
              pathname: '/organizations/[orgSlug]',
              query: { orgSlug: response.organization.slug },
            })
          )
        }
      } else {
        setError(response.error || 'Failed to update organization')
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      setError(message)
    } finally {
      setSaving(false)
    }
  }, [orgSlug, editName, editDescription, editSlug, router])

  const handleDelete = useCallback(async () => {
    if (!orgSlug) return

    setDeleting(true)
    setDeleteError(null)

    try {
      const request = create(DeleteOrganizationRequestSchema, { slug: orgSlug })
      const response = await centyClient.deleteOrganization(request)

      if (response.success) {
        router.push('/organizations')
      } else {
        setDeleteError(response.error || 'Failed to delete organization')
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      setDeleteError(message)
    } finally {
      setDeleting(false)
    }
  }, [orgSlug, router])

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (organization) {
      setEditName(organization.name)
      setEditDescription(organization.description || '')
      setEditSlug(organization.slug)
    }
  }

  useSaveShortcut({
    onSave: handleSave,
    enabled: isEditing && !saving && !!editName.trim(),
  })

  if (loading) {
    return (
      <div className="organization-detail">
        <div className="loading">Loading organization...</div>
      </div>
    )
  }

  if (error && !organization) {
    return (
      <div className="organization-detail">
        <div className="error-message">{error}</div>
        <Link href="/organizations" className="back-link">
          Back to Organizations
        </Link>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="organization-detail">
        <div className="error-message">Organization not found</div>
        <Link href="/organizations" className="back-link">
          Back to Organizations
        </Link>
      </div>
    )
  }

  return (
    <div className="organization-detail">
      <div className="organization-header">
        <Link href="/organizations" className="back-link">
          Back to Organizations
        </Link>

        <div className="organization-actions">
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
          <p>Are you sure you want to delete this organization?</p>
          {projects.length > 0 && (
            <p className="delete-warning">
              This organization has {projects.length} project(s). They will
              become ungrouped.
            </p>
          )}
          {deleteError && <p className="delete-error-message">{deleteError}</p>}
          <div className="delete-confirm-actions">
            <button
              onClick={() => {
                setShowDeleteConfirm(false)
                setDeleteError(null)
              }}
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

      <div className="organization-content">
        <div className="org-slug-badge">
          <code>{organization.slug}</code>
        </div>

        {isEditing ? (
          <div className="edit-form">
            <div className="form-group">
              <label htmlFor="edit-name">Name:</label>
              <input
                id="edit-name"
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Organization name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-slug">Slug:</label>
              <input
                id="edit-slug"
                type="text"
                value={editSlug}
                onChange={e => setEditSlug(e.target.value)}
                placeholder="organization-slug"
              />
              {editSlug !== organization.slug && (
                <p className="field-hint warning">
                  Changing the slug will update the URL. Make sure to update any
                  references.
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="edit-description">Description:</label>
              <textarea
                id="edit-description"
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
              />
            </div>
          </div>
        ) : (
          <>
            <h1 className="organization-name">{organization.name}</h1>

            <div className="organization-metadata">
              {organization.description && (
                <div className="metadata-row">
                  <span className="metadata-label">Description:</span>
                  <span className="metadata-value">
                    {organization.description}
                  </span>
                </div>
              )}

              <div className="metadata-row">
                <span className="metadata-label">Projects:</span>
                <span className="metadata-value">
                  {organization.projectCount}
                </span>
              </div>

              <div className="metadata-row">
                <span className="metadata-label">Created:</span>
                <span className="metadata-value">
                  {organization.createdAt
                    ? new Date(organization.createdAt).toLocaleString()
                    : '-'}
                </span>
              </div>

              {organization.updatedAt && (
                <div className="metadata-row">
                  <span className="metadata-label">Updated:</span>
                  <span className="metadata-value">
                    {new Date(organization.updatedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {projects.length > 0 && (
              <div className="organization-projects">
                <h3>Projects in this organization</h3>
                <ul className="project-list">
                  {projects.map(project => (
                    <li key={project.path} className="project-item">
                      <span className="project-name">
                        {project.userTitle ||
                          project.projectTitle ||
                          project.name}
                      </span>
                      <span className="project-path" title={project.path}>
                        {project.displayPath || project.path}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
