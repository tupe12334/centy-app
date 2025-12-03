import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { centyClient } from '../api/client.ts'
import { create } from '@bufbuild/protobuf'
import {
  GetDocRequestSchema,
  UpdateDocRequestSchema,
  DeleteDocRequestSchema,
  type Doc,
} from '../gen/centy_pb.ts'
import { useProject } from '../context/ProjectContext.tsx'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard.ts'
import { MarkdownEditor } from '../components/MarkdownEditor.tsx'
import './DocDetail.css'

export function DocDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { projectPath } = useProject()
  const { copyToClipboard } = useCopyToClipboard()

  const [doc, setDoc] = useState<Doc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const fetchDoc = useCallback(async () => {
    if (!projectPath || !slug) {
      setError('Missing project path or document slug')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const request = create(GetDocRequestSchema, {
        projectPath,
        slug,
      })
      const response = await centyClient.getDoc(request)
      setDoc(response)
      setEditTitle(response.title)
      setEditContent(response.content)
      setEditSlug('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setLoading(false)
    }
  }, [projectPath, slug])

  useEffect(() => {
    fetchDoc()
  }, [fetchDoc])

  const handleSave = useCallback(async () => {
    if (!projectPath || !slug) return

    setSaving(true)
    setError(null)

    try {
      const request = create(UpdateDocRequestSchema, {
        projectPath,
        slug,
        title: editTitle,
        content: editContent,
        newSlug: editSlug || undefined,
      })
      const response = await centyClient.updateDoc(request)

      if (response.success && response.doc) {
        setDoc(response.doc)
        setIsEditing(false)
        // If slug changed, navigate to new URL
        if (editSlug && editSlug !== slug) {
          navigate(`/docs/${editSlug}`, { replace: true })
        }
      } else {
        setError(response.error || 'Failed to update document')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setSaving(false)
    }
  }, [projectPath, slug, editTitle, editContent, editSlug, navigate])

  const handleDelete = useCallback(async () => {
    if (!projectPath || !slug) return

    setDeleting(true)
    setError(null)

    try {
      const request = create(DeleteDocRequestSchema, {
        projectPath,
        slug,
      })
      const response = await centyClient.deleteDoc(request)

      if (response.success) {
        navigate('/docs')
      } else {
        setError(response.error || 'Failed to delete document')
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
  }, [projectPath, slug, navigate])

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (doc) {
      setEditTitle(doc.title)
      setEditContent(doc.content)
      setEditSlug('')
    }
  }

  if (!projectPath) {
    return (
      <div className="doc-detail">
        <div className="error-message">
          No project path specified. Please go to the{' '}
          <Link to="/docs">documentation list</Link> and select a project.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="doc-detail">
        <div className="loading">Loading document...</div>
      </div>
    )
  }

  if (error && !doc) {
    return (
      <div className="doc-detail">
        <div className="error-message">{error}</div>
        <Link to="/docs" className="back-link">
          Back to Documentation
        </Link>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="doc-detail">
        <div className="error-message">Document not found</div>
        <Link to="/docs" className="back-link">
          Back to Documentation
        </Link>
      </div>
    )
  }

  return (
    <div className="doc-detail">
      <div className="doc-header">
        <Link to="/docs" className="back-link">
          Back to Documentation
        </Link>

        <div className="doc-actions">
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
          <p>Are you sure you want to delete this document?</p>
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

      <div className="doc-content">
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

            <div className="form-group">
              <label htmlFor="edit-slug">
                Slug (leave empty to keep current):
              </label>
              <input
                id="edit-slug"
                type="text"
                value={editSlug}
                onChange={e => setEditSlug(e.target.value)}
                placeholder={doc.slug}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-content">Content (Markdown):</label>
              <MarkdownEditor
                value={editContent}
                onChange={setEditContent}
                placeholder="Write your documentation in Markdown..."
                minHeight={400}
              />
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="doc-slug-badge"
              onClick={() => slug && copyToClipboard(slug, `doc "${slug}"`)}
              title="Click to copy slug"
            >
              {doc.slug}
            </button>
            <h1 className="doc-title">{doc.title}</h1>

            <div className="doc-metadata">
              {doc.metadata?.createdAt && (
                <span className="doc-date">
                  Created: {new Date(doc.metadata.createdAt).toLocaleString()}
                </span>
              )}
              {doc.metadata?.updatedAt && (
                <span className="doc-date">
                  Updated: {new Date(doc.metadata.updatedAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="doc-body">
              {doc.content ? (
                <pre className="doc-content-pre">{doc.content}</pre>
              ) : (
                <p className="no-content">No content</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
