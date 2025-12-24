'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  ListDocsRequestSchema,
  DeleteDocRequestSchema,
  type Doc,
} from '@/gen/centy_pb'
import {
  usePathContext,
  useProjectPathToUrl,
} from '@/components/providers/PathContextProvider'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useAppLink } from '@/hooks/useAppLink'
import {
  ContextMenu,
  type ContextMenuItem,
} from '@/components/shared/ContextMenu'
import { MoveModal } from '@/components/shared/MoveModal'
import { DuplicateModal } from '@/components/shared/DuplicateModal'

export function DocsList() {
  const router = useRouter()
  const { projectPath, isInitialized } = usePathContext()
  const resolvePathToUrl = useProjectPathToUrl()
  const { copyToClipboard } = useCopyToClipboard()
  const { createLink, createProjectLink } = useAppLink()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    doc: Doc
  } | null>(null)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null)

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
    if (isInitialized === true) {
      fetchDocs()
    }
  }, [isInitialized, fetchDocs])

  const handleContextMenu = useCallback((e: React.MouseEvent, doc: Doc) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, doc })
  }, [])

  const handleMoveDoc = useCallback((doc: Doc) => {
    setSelectedDoc(doc)
    setShowMoveModal(true)
    setContextMenu(null)
  }, [])

  const handleDuplicateDoc = useCallback((doc: Doc) => {
    setSelectedDoc(doc)
    setShowDuplicateModal(true)
    setContextMenu(null)
  }, [])

  const handleMoved = useCallback(
    async (targetProjectPath: string) => {
      // Resolve path to org/project for URL navigation
      const result = await resolvePathToUrl(targetProjectPath)
      if (result) {
        const url = createProjectLink(
          result.orgSlug,
          result.projectName,
          'docs'
        )
        router.push(url)
      } else {
        router.push('/')
      }
    },
    [resolvePathToUrl, createProjectLink, router]
  )

  const handleDuplicated = useCallback(
    async (newSlug: string, targetProjectPath: string) => {
      if (targetProjectPath === projectPath) {
        // Same project - refresh and navigate to new doc
        fetchDocs()
        router.push(createLink(`/docs/${newSlug}`))
      } else {
        // Different project - resolve and redirect
        const result = await resolvePathToUrl(targetProjectPath)
        if (result) {
          const url = createProjectLink(
            result.orgSlug,
            result.projectName,
            `docs/${newSlug}`
          )
          router.push(url)
        } else {
          router.push('/')
        }
      }
      setShowDuplicateModal(false)
      setSelectedDoc(null)
    },
    [
      projectPath,
      router,
      fetchDocs,
      createLink,
      resolvePathToUrl,
      createProjectLink,
    ]
  )

  const contextMenuItems: ContextMenuItem[] = contextMenu
    ? [
        {
          label: 'View',
          onClick: () => {
            router.push(createLink(`/docs/${contextMenu.doc.slug}`))
            setContextMenu(null)
          },
        },
        {
          label: 'Move',
          onClick: () => handleMoveDoc(contextMenu.doc),
        },
        {
          label: 'Duplicate',
          onClick: () => handleDuplicateDoc(contextMenu.doc),
        },
      ]
    : []

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
          <Link href={createLink('/docs/new')} className="create-btn">
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
          <Link href="/">Initialize Project</Link>
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
              <Link href={createLink('/docs/new')}>
                Create your first document
              </Link>
            </div>
          ) : (
            <div className="docs-grid">
              {docs.map(doc => (
                <div
                  key={doc.slug}
                  className="doc-card context-menu-row"
                  onContextMenu={e => handleContextMenu(e, doc)}
                >
                  <div className="doc-card-content">
                    <Link
                      href={createLink(`/docs/${doc.slug}`)}
                      className="doc-card-link"
                    >
                      <h3 className="doc-title">{doc.title}</h3>
                    </Link>
                    <button
                      type="button"
                      className="doc-slug-copy-btn"
                      onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        copyToClipboard(doc.slug, `doc "${doc.slug}"`)
                      }}
                      title="Click to copy slug"
                    >
                      {doc.slug}
                    </button>
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
                  </div>
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

      {contextMenu && (
        <ContextMenu
          items={contextMenuItems}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}

      {showMoveModal && selectedDoc && (
        <MoveModal
          entityType="doc"
          entityId={selectedDoc.slug}
          entityTitle={selectedDoc.title}
          currentProjectPath={projectPath}
          onClose={() => {
            setShowMoveModal(false)
            setSelectedDoc(null)
          }}
          onMoved={handleMoved}
        />
      )}

      {showDuplicateModal && selectedDoc && (
        <DuplicateModal
          entityType="doc"
          entityId={selectedDoc.slug}
          entityTitle={selectedDoc.title}
          entitySlug={selectedDoc.slug}
          currentProjectPath={projectPath}
          onClose={() => {
            setShowDuplicateModal(false)
            setSelectedDoc(null)
          }}
          onDuplicated={handleDuplicated}
        />
      )}
    </div>
  )
}
