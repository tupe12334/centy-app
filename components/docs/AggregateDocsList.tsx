'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import { ListDocsRequestSchema, type Doc } from '@/gen/centy_pb'
import { getProjects } from '@/lib/project-resolver'
import { useAppLink } from '@/hooks/useAppLink'

interface AggregateDoc extends Doc {
  projectName: string
  orgSlug: string | null
  projectPath: string
}

export function AggregateDocsList() {
  const { createProjectLink } = useAppLink()
  const [docs, setDocs] = useState<AggregateDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllDocs = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Get all initialized projects
      const projects = await getProjects()
      const initializedProjects = projects.filter(p => p.initialized)

      // Fetch docs from each project in parallel
      const docPromises = initializedProjects.map(async project => {
        try {
          const request = create(ListDocsRequestSchema, {
            projectPath: project.path,
          })
          const response = await centyClient.listDocs(request)
          return response.docs.map(doc => ({
            ...doc,
            projectName: project.name,
            orgSlug: project.organizationSlug || null,
            projectPath: project.path,
          }))
        } catch {
          // Skip projects that fail to load
          console.warn(`Failed to fetch docs from ${project.name}`)
          return []
        }
      })

      const docArrays = await Promise.all(docPromises)
      const allDocs = docArrays.flat()

      // Sort by updated date (most recent first)
      allDocs.sort((a, b) => {
        const dateA = a.metadata?.updatedAt
          ? new Date(a.metadata.updatedAt).getTime()
          : 0
        const dateB = b.metadata?.updatedAt
          ? new Date(b.metadata.updatedAt).getTime()
          : 0
        return dateB - dateA
      })

      setDocs(allDocs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch docs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllDocs()
  }, [fetchAllDocs])

  return (
    <div className="docs-list">
      <div className="docs-header">
        <h2>All Docs</h2>
        <div className="header-actions">
          <button
            onClick={fetchAllDocs}
            disabled={loading}
            className="refresh-btn"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <p className="aggregate-note">
        Showing docs from all projects. Select a project to create new docs.
      </p>

      {error && <div className="error-message">{error}</div>}

      {loading && docs.length === 0 ? (
        <div className="loading">Loading docs from all projects...</div>
      ) : docs.length === 0 ? (
        <div className="empty-state">
          <p>No docs found across any projects</p>
        </div>
      ) : (
        <div className="docs-grid">
          {docs.map(doc => (
            <div key={`${doc.projectPath}-${doc.slug}`} className="doc-card">
              <div className="doc-project">
                <Link
                  href={createProjectLink(doc.orgSlug, doc.projectName, 'docs')}
                  className="project-link"
                >
                  {doc.projectName}
                </Link>
              </div>
              <Link
                href={createProjectLink(
                  doc.orgSlug,
                  doc.projectName,
                  `docs/${doc.slug}`
                )}
                className="doc-title"
              >
                {doc.title || doc.slug}
              </Link>
              {doc.metadata?.updatedAt && (
                <div className="doc-date">
                  Updated:{' '}
                  {new Date(doc.metadata.updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
