'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  ListProjectsRequestSchema,
  DuplicateIssueRequestSchema,
  DuplicateDocRequestSchema,
  type ProjectInfo,
} from '@/gen/centy_pb'
import '@/styles/components/MoveModal.css'

interface DuplicateModalProps {
  entityType: 'issue' | 'doc'
  entityId: string // UUID for issues, slug for docs
  entityTitle: string // For display purposes
  entitySlug?: string // For docs only
  currentProjectPath: string
  onClose: () => void
  onDuplicated: (newEntityId: string, targetProjectPath: string) => void
}

export function DuplicateModal({
  entityType,
  entityId,
  entityTitle,
  entitySlug,
  currentProjectPath,
  onClose,
  onDuplicated,
}: DuplicateModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [selectedProject, setSelectedProject] =
    useState<string>(currentProjectPath)
  const [newTitle, setNewTitle] = useState(`Copy of ${entityTitle}`)
  const [newSlug, setNewSlug] = useState(entitySlug ? `${entitySlug}-copy` : '') // Only for docs
  const [loading, setLoading] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load available projects (including current for duplicate)
  useEffect(() => {
    async function loadProjects() {
      try {
        const request = create(ListProjectsRequestSchema, {
          includeStale: false,
          includeUninitialized: false,
          includeArchived: false,
        })
        const response = await centyClient.listProjects(request)
        setProjects(response.projects)
        // Default to current project for duplicate
        setSelectedProject(currentProjectPath)
      } catch (err) {
        console.error('Failed to load projects:', err)
        setError('Failed to load projects')
      } finally {
        setLoadingProjects(false)
      }
    }

    loadProjects()
  }, [currentProjectPath])

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

  const handleDuplicate = useCallback(async () => {
    if (!selectedProject) return

    setLoading(true)
    setError(null)

    try {
      if (entityType === 'issue') {
        const request = create(DuplicateIssueRequestSchema, {
          sourceProjectPath: currentProjectPath,
          issueId: entityId,
          targetProjectPath: selectedProject,
          newTitle: newTitle || undefined,
        })
        const response = await centyClient.duplicateIssue(request)

        if (response.success && response.issue) {
          onDuplicated(response.issue.id, selectedProject)
        } else {
          setError(response.error || 'Failed to duplicate issue')
        }
      } else {
        const request = create(DuplicateDocRequestSchema, {
          sourceProjectPath: currentProjectPath,
          slug: entityId,
          targetProjectPath: selectedProject,
          newSlug: newSlug || undefined,
          newTitle: newTitle || undefined,
        })
        const response = await centyClient.duplicateDoc(request)

        if (response.success && response.doc) {
          onDuplicated(response.doc.slug, selectedProject)
        } else {
          setError(response.error || 'Failed to duplicate document')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate')
    } finally {
      setLoading(false)
    }
  }, [
    entityType,
    entityId,
    currentProjectPath,
    selectedProject,
    newTitle,
    newSlug,
    onDuplicated,
  ])

  const selectedProjectInfo = projects.find(p => p.path === selectedProject)
  const isSameProject = selectedProject === currentProjectPath

  return (
    <div className="move-modal-overlay">
      <div className="move-modal" ref={modalRef}>
        <div className="move-modal-header">
          <h3>Duplicate {entityType === 'issue' ? 'Issue' : 'Document'}</h3>
          <button className="move-modal-close" onClick={onClose}>
            x
          </button>
        </div>

        <div className="move-modal-body">
          {error && <div className="move-modal-error">{error}</div>}

          <div className="move-modal-info">
            <span className="move-modal-label">Duplicating:</span>
            <span className="move-modal-value">{entityTitle}</span>
          </div>

          <div className="move-modal-field">
            <label>Target Project</label>
            {loadingProjects ? (
              <div className="move-modal-loading">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="move-modal-empty">No projects available</div>
            ) : (
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="move-modal-select"
              >
                {projects.map(project => (
                  <option key={project.path} value={project.path}>
                    {project.userTitle || project.projectTitle || project.name}
                    {project.path === currentProjectPath ? ' (current)' : ''} (
                    {project.displayPath})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="move-modal-field">
            <label>New Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder={`Copy of ${entityTitle}`}
              className="move-modal-input"
            />
          </div>

          {entityType === 'doc' && (
            <div className="move-modal-field">
              <label>New Slug</label>
              <input
                type="text"
                value={newSlug}
                onChange={e => setNewSlug(e.target.value)}
                placeholder={`${entitySlug}-copy`}
                className="move-modal-input"
              />
              <span className="move-modal-hint">
                URL-friendly identifier for the new document
              </span>
            </div>
          )}

          {selectedProjectInfo && (
            <div className="move-modal-preview">
              <span className="move-modal-preview-label">
                A copy will be created in:
              </span>
              <span className="move-modal-preview-value">
                {selectedProjectInfo.name}
                {isSameProject && ' (same project)'}
              </span>
            </div>
          )}
        </div>

        <div className="move-modal-footer">
          <button className="move-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="move-modal-submit"
            onClick={handleDuplicate}
            disabled={loading || !selectedProject || projects.length === 0}
          >
            {loading ? 'Duplicating...' : 'Duplicate'}
          </button>
        </div>
      </div>
    </div>
  )
}
