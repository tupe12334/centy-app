'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  useFloating,
  autoUpdate,
  flip,
  shift,
  offset,
} from '@floating-ui/react'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  ListProjectsRequestSchema,
  RegisterProjectRequestSchema,
  SetProjectFavoriteRequestSchema,
  type ProjectInfo,
} from '@/gen/centy_pb'
import {
  useProject,
  useArchivedProjects,
} from '@/components/providers/ProjectProvider'
import { useOrganization } from '@/components/providers/OrganizationProvider'

export function ProjectSelector() {
  const { projectPath, setProjectPath, setIsInitialized } = useProject()
  const { isArchived, archiveProject } = useArchivedProjects()
  const { selectedOrgSlug, organizations } = useOrganization()
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [manualPath, setManualPath] = useState('')

  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    placement: 'bottom-start',
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const request = create(ListProjectsRequestSchema, {
        includeStale: false,
        // Filter by organization when one is selected
        organizationSlug:
          selectedOrgSlug !== null && selectedOrgSlug !== ''
            ? selectedOrgSlug
            : undefined,
        ungroupedOnly: selectedOrgSlug === '',
      })
      const response = await centyClient.listProjects(request)
      setProjects(response.projects)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [selectedOrgSlug])

  useEffect(() => {
    if (isOpen) {
      fetchProjects()
    }
  }, [isOpen, fetchProjects])

  const handleSelectProject = (project: ProjectInfo) => {
    setProjectPath(project.path)
    setIsInitialized(project.initialized)
    setIsOpen(false)
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (manualPath.trim()) {
      const path = manualPath.trim()
      try {
        // Register the project with the daemon
        const request = create(RegisterProjectRequestSchema, {
          projectPath: path,
        })
        const response = await centyClient.registerProject(request)
        if (response.success && response.project) {
          setProjectPath(path)
          setIsInitialized(response.project.initialized)
          // Add to projects list if not already there
          setProjects(prev => {
            if (prev.some(p => p.path === path)) return prev
            return [...prev, response.project!]
          })
        } else {
          // Still set the path even if registration fails
          setProjectPath(path)
          setIsInitialized(null)
        }
      } catch {
        // Fallback: set path without registration
        setProjectPath(path)
        setIsInitialized(null)
      }
      setManualPath('')
      setIsOpen(false)
    }
  }

  const getCurrentProjectName = () => {
    if (!projectPath) return 'Select Project'
    const project = projects.find(p => p.path === projectPath)
    if (project?.name) return project.name
    // Extract folder name from path
    const parts = projectPath.split('/')
    return parts[parts.length - 1] || projectPath
  }

  const handleArchiveProject = (
    e: React.MouseEvent,
    projectToArchive: ProjectInfo
  ) => {
    e.stopPropagation() // Prevent selecting the project
    archiveProject(projectToArchive.path)
    // If archiving the currently selected project, clear selection
    if (projectToArchive.path === projectPath) {
      setProjectPath('')
      setIsInitialized(null)
    }
  }

  const handleToggleFavorite = async (
    e: React.MouseEvent,
    project: ProjectInfo
  ) => {
    e.stopPropagation() // Prevent selecting the project
    try {
      const request = create(SetProjectFavoriteRequestSchema, {
        projectPath: project.path,
        isFavorite: !project.isFavorite,
      })
      const response = await centyClient.setProjectFavorite(request)
      if (response.success && response.project) {
        // Update the project in the list
        setProjects(prev =>
          prev.map(p => (p.path === project.path ? response.project! : p))
        )
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  // Filter out archived projects and sort favorites first
  const visibleProjects = projects
    .filter(p => !isArchived(p.path))
    .sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1
      if (!a.isFavorite && b.isFavorite) return 1
      return 0
    })

  // Group projects by organization when showing all (selectedOrgSlug === null)
  const groupedProjects = useMemo(() => {
    if (selectedOrgSlug !== null) {
      // When filtering by a specific org or ungrouped, just show flat list
      return null
    }

    const groups: Map<string, { name: string; projects: ProjectInfo[] }> =
      new Map()
    groups.set('', { name: 'Ungrouped', projects: [] })

    for (const project of visibleProjects) {
      const orgSlug = project.organizationSlug || ''
      if (!groups.has(orgSlug)) {
        const org = organizations.find(o => o.slug === orgSlug)
        groups.set(orgSlug, { name: org?.name || orgSlug, projects: [] })
      }
      groups.get(orgSlug)!.projects.push(project)
    }

    // Sort: organizations first (alphabetically), then ungrouped
    const sortedGroups = Array.from(groups.entries())
      .filter(([, g]) => g.projects.length > 0)
      .sort(([slugA], [slugB]) => {
        if (slugA === '' && slugB !== '') return 1
        if (slugA !== '' && slugB === '') return -1
        return slugA.localeCompare(slugB)
      })

    return sortedGroups
  }, [visibleProjects, selectedOrgSlug, organizations])

  return (
    <div className="project-selector-container">
      <button
        ref={refs.setReference}
        className="project-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="project-icon">📁</span>
        <span className="project-name">{getCurrentProjectName()}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="project-selector-dropdown"
        >
          <div className="project-selector-header">
            <h3>Select Project</h3>
            <button
              className="refresh-btn"
              onClick={fetchProjects}
              disabled={loading}
              title="Refresh project list"
            >
              ↻
            </button>
          </div>

          {error && <div className="project-selector-error">{error}</div>}

          {loading ? (
            <div className="project-selector-loading">Loading projects...</div>
          ) : visibleProjects.length === 0 ? (
            <div className="project-selector-empty">
              <p>No tracked projects found</p>
              <p className="hint">
                Initialize a project with Centy to see it here
              </p>
            </div>
          ) : groupedProjects ? (
            // Grouped view when showing all organizations
            <div className="project-list-grouped" role="listbox">
              {groupedProjects.map(([orgSlug, group]) => (
                <div key={orgSlug || '__ungrouped'} className="project-group">
                  <div className="project-group-header">
                    <span className="project-group-name">
                      {orgSlug ? `🏢 ${group.name}` : '📁 Ungrouped'}
                    </span>
                    <span className="project-group-count">
                      {group.projects.length}
                    </span>
                  </div>
                  <ul className="project-group-list">
                    {group.projects.map(project => (
                      <li
                        key={project.path}
                        role="option"
                        aria-selected={project.path === projectPath}
                        className={`project-item ${project.path === projectPath ? 'selected' : ''}`}
                        onClick={() => handleSelectProject(project)}
                      >
                        <div className="project-item-main">
                          <button
                            className={`favorite-btn ${project.isFavorite ? 'active' : ''}`}
                            onClick={e => handleToggleFavorite(e, project)}
                            title={
                              project.isFavorite
                                ? 'Remove from favorites'
                                : 'Add to favorites'
                            }
                          >
                            {project.isFavorite ? '★' : '☆'}
                          </button>
                          <span className="project-item-name">
                            {project.name}
                          </span>
                          {!project.initialized && (
                            <span className="project-badge not-initialized">
                              Not initialized
                            </span>
                          )}
                          <button
                            className="archive-btn"
                            onClick={e => handleArchiveProject(e, project)}
                            title="Archive project"
                          >
                            Archive
                          </button>
                        </div>
                        <div className="project-item-details">
                          <span
                            className="project-item-path"
                            title={project.displayPath}
                          >
                            {project.displayPath}
                          </span>
                          <div className="project-item-stats">
                            {project.initialized && (
                              <>
                                <span title="Issues">
                                  📋 {project.issueCount}
                                </span>
                                <span title="Docs">📄 {project.docCount}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            // Flat list when filtering by specific org
            <ul className="project-list" role="listbox">
              {visibleProjects.map(project => (
                <li
                  key={project.path}
                  role="option"
                  aria-selected={project.path === projectPath}
                  className={`project-item ${project.path === projectPath ? 'selected' : ''}`}
                  onClick={() => handleSelectProject(project)}
                >
                  <div className="project-item-main">
                    <button
                      className={`favorite-btn ${project.isFavorite ? 'active' : ''}`}
                      onClick={e => handleToggleFavorite(e, project)}
                      title={
                        project.isFavorite
                          ? 'Remove from favorites'
                          : 'Add to favorites'
                      }
                    >
                      {project.isFavorite ? '★' : '☆'}
                    </button>
                    <span className="project-item-name">{project.name}</span>
                    {!project.initialized && (
                      <span className="project-badge not-initialized">
                        Not initialized
                      </span>
                    )}
                    <button
                      className="archive-btn"
                      onClick={e => handleArchiveProject(e, project)}
                      title="Archive project"
                    >
                      Archive
                    </button>
                  </div>
                  <div className="project-item-details">
                    <span
                      className="project-item-path"
                      title={project.displayPath}
                    >
                      {project.displayPath}
                    </span>
                    <div className="project-item-stats">
                      {project.initialized && (
                        <>
                          <span title="Issues">📋 {project.issueCount}</span>
                          <span title="Docs">📄 {project.docCount}</span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="project-selector-actions">
            <Link
              href="/"
              className="init-project-btn"
              onClick={() => setIsOpen(false)}
            >
              ✨ Init Project
            </Link>
            <Link
              href="/archived"
              className="view-archived-link"
              onClick={() => setIsOpen(false)}
            >
              View Archived Projects
            </Link>
          </div>

          <div className="project-selector-manual">
            <form onSubmit={handleManualSubmit}>
              <input
                type="text"
                value={manualPath}
                onChange={e => setManualPath(e.target.value)}
                placeholder="Or enter path manually..."
                className="manual-path-input"
              />
              <button
                type="submit"
                disabled={!manualPath.trim()}
                className="manual-path-submit"
              >
                Go
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
