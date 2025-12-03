import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { centyClient } from '../api/client.ts'
import { create } from '@bufbuild/protobuf'
import {
  ListDocsRequestSchema,
  DeleteDocRequestSchema,
  IsInitializedRequestSchema,
  type Doc,
} from '../gen/centy_pb.ts'
import { useProject } from '../context/ProjectContext.tsx'
import './DocsList.css'

export function DocsList() {
  const { projectPath, isInitialized, setIsInitialized } = useProject()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const checkInitialized = useCallback(
    async (path: string) => {
      if (!path.trim()) {
        setIsInitialized(null)
        return
      }

      try {
        const request = create(IsInitializedRequestSchema, {
          projectPath: path.trim(),
        })
        const response = await centyClient.isInitialized(request)
        setIsInitialized(response.initialized)
      } catch {
        setIsInitialized(false)
      }
    },
    [setIsInitialized]
  )

  const fetchDocs = useCallback(async () => {
    if (!projectPath.trim() || isInitialized !== true) return

    setLoading(true)
    setError(null)

    try {
      const request = create(ListDocsRequestSchema, {
        projectPath: projectPath.trim(),
      })
      const response = await centyClient.listDocs(request)
      setDocs(response.docs)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setLoading(false)
    }
  }, [projectPath, isInitialized])

  const handleDelete = useCallback(
    async (slug: string) => {
      if (!projectPath) return

      setDeleting(true)
      setError(null)

      try {
        const request = create(DeleteDocRequestSchema, {
          projectPath,
          slug,
        })
        const response = await centyClient.deleteDoc(request)

        if (response.success) {
          setDocs(prev => prev.filter(d => d.slug !== slug))
          setDeleteConfirm(null)
        } else {
          setError(response.error || 'Failed to delete document')
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to connect to daemon'
        )
      } finally {
        setDeleting(false)
      }
    },
    [projectPath]
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkInitialized(projectPath)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [projectPath, checkInitialized])

  useEffect(() => {
    if (isInitialized === true) {
      fetchDocs()
    }
  }, [isInitialized, fetchDocs])

  return (
    <div className="docs-list">
      <div className="docs-header">
        <h2>Documentation</h2>
        <div className="header-actions">
          {projectPath && isInitialized === true && (
            <button
              onClick={fetchDocs}
              disabled={loading}
              className="refresh-btn"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          )}
          <Link to="/docs/new" className="create-btn">
            + New Doc
          </Link>
        </div>
      </div>

      {!projectPath && (
        <div className="no-project-message">
          <p>Select a project from the header to view documentation</p>
        </div>
      )}

      {projectPath && isInitialized === false && (
        <div className="not-initialized-message">
          <p>Centy is not initialized in this directory</p>
          <Link to="/">Initialize Project</Link>
        </div>
      )}

      {projectPath && isInitialized === true && (
        <>
          {error && <div className="error-message">{error}</div>}

          {loading && docs.length === 0 ? (
            <div className="loading">Loading documentation...</div>
          ) : docs.length === 0 ? (
            <div className="empty-state">
              <p>No documentation found</p>
              <Link to="/docs/new">Create your first document</Link>
            </div>
          ) : (
            <div className="docs-grid">
              {docs.map(doc => (
                <div key={doc.slug} className="doc-card">
                  <Link to={`/docs/${doc.slug}`} className="doc-card-link">
                    <h3 className="doc-title">{doc.title}</h3>
                    <p className="doc-slug">{doc.slug}</p>
                    {doc.metadata && (
                      <div className="doc-meta">
                        <span className="doc-date">
                          Updated:{' '}
                          {doc.metadata.updatedAt
                            ? new Date(
                                doc.metadata.updatedAt
                              ).toLocaleDateString()
                            : '-'}
                        </span>
                      </div>
                    )}
                  </Link>
                  <button
                    className="doc-delete-btn"
                    onClick={e => {
                      e.preventDefault()
                      setDeleteConfirm(doc.slug)
                    }}
                    title="Delete document"
                  >
                    x
                  </button>
                  {deleteConfirm === doc.slug && (
                    <div className="delete-confirm-overlay">
                      <p>Delete &ldquo;{doc.title}&rdquo;?</p>
                      <div className="delete-confirm-actions">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="cancel-btn"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(doc.slug)}
                          disabled={deleting}
                          className="confirm-delete-btn"
                        >
                          {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
