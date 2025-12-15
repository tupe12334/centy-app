'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  ListProjectsRequestSchema,
  MoveIssueRequestSchema,
  MoveDocRequestSchema,
  type ProjectInfo,
} from '@/gen/centy_pb'
import '@/styles/components/MoveModal.css'

interface MoveModalProps {
  entityType: 'issue' | 'doc'
  entityId: string // UUID for issues, slug for docs
  entityTitle: string // For display purposes
  currentProjectPath: string
  onClose: () => void
  onMoved: (targetProjectPath: string, newEntityId?: string) => void
}

export function MoveModal({
  entityType,
  entityId,
  entityTitle,
  currentProjectPath,
  onClose,
  onMoved,
}: MoveModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [newSlug, setNewSlug] = useState('') // Only for docs
  const [loading, setLoading] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load available projects
  useEffect(() => {
    async function loadProjects() {
      try {
        const request = create(ListProjectsRequestSchema, {
          includeStale: false,
          includeUninitialized: false,
          includeArchived: false,
        })
        const response = await centyClient.listProjects(request)
        // Filter out current project
        const otherProjects = response.projects.filter(
          p => p.path !== currentProjectPath
        )
        setProjects(otherProjects)
        if (otherProjects.length > 0) {
          setSelectedProject(otherProjects[0].path)
        }
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

  const handleMove = useCallback(async () => {
    if (!selectedProject) return

    setLoading(true)
    setError(null)

    try {
      if (entityType === 'issue') {
        const request = create(MoveIssueRequestSchema, {
          sourceProjectPath: currentProjectPath,
          issueId: entityId,
          targetProjectPath: selectedProject,
        })
        const response = await centyClient.moveIssue(request)

        if (response.success) {
          onMoved(selectedProject, response.issue?.id)
        } else {
          setError(response.error || 'Failed to move issue')
        }
      } else {
        const request = create(MoveDocRequestSchema, {
          sourceProjectPath: currentProjectPath,
          slug: entityId,
          targetProjectPath: selectedProject,
          newSlug: newSlug || undefined,
        })
        const response = await centyClient.moveDoc(request)

        if (response.success) {
          onMoved(selectedProject, response.doc?.slug)
        } else {
          setError(response.error || 'Failed to move document')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move')
    } finally {
      setLoading(false)
    }
  }, [
    entityType,
    entityId,
    currentProjectPath,
    selectedProject,
    newSlug,
    onMoved,
  ])

  const selectedProjectInfo = projects.find(p => p.path === selectedProject)

  return (
    <div className="move-modal-overlay">
      <div className="move-modal" ref={modalRef}>
        <div className="move-modal-header">
          <h3>Move {entityType === 'issue' ? 'Issue' : 'Document'}</h3>
          <button className="move-modal-close" onClick={onClose}>
            x
          </button>
        </div>

        <div className="move-modal-body">
          {error && <div className="move-modal-error">{error}</div>}

          <div className="move-modal-info">
            <span className="move-modal-label">Moving:</span>
            <span className="move-modal-value">{entityTitle}</span>
          </div>

          <div className="move-modal-field">
            <label>Target Project</label>
            {loadingProjects ? (
              <div className="move-modal-loading">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="move-modal-empty">
                No other projects available
              </div>
            ) : (
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="move-modal-select"
              >
                {projects.map(project => (
                  <option key={project.path} value={project.path}>
                    {project.userTitle || project.projectTitle || project.name}{' '}
                    ({project.displayPath})
                  </option>
                ))}
              </select>
            )}
          </div>

          {entityType === 'doc' && (
            <div className="move-modal-field">
              <label>New Slug (optional - leave empty to keep current)</label>
              <input
                type="text"
                value={newSlug}
                onChange={e => setNewSlug(e.target.value)}
                placeholder={entityId}
                className="move-modal-input"
              />
              <span className="move-modal-hint">
                Change if the slug already exists in the target project
              </span>
            </div>
          )}

          {selectedProjectInfo && (
            <div className="move-modal-preview">
              <span className="move-modal-preview-label">
                This {entityType} will be moved to:
              </span>
              <span className="move-modal-preview-value">
                {selectedProjectInfo.name}
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
            onClick={handleMove}
            disabled={loading || !selectedProject || projects.length === 0}
          >
            {loading ? 'Moving...' : 'Move'}
          </button>
        </div>
      </div>
    </div>
  )
}
