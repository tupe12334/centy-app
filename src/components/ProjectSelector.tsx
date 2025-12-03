import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  useFloating,
  autoUpdate,
  flip,
  shift,
  offset,
} from '@floating-ui/react'
import { centyClient } from '../api/client.ts'
import { create } from '@bufbuild/protobuf'
import { ListProjectsRequestSchema, type ProjectInfo } from '../gen/centy_pb.ts'
import { useProject } from '../context/ProjectContext.tsx'
import './ProjectSelector.css'

export function ProjectSelector() {
  const { projectPath, setProjectPath, setIsInitialized } = useProject()
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
      })
      const response = await centyClient.listProjects(request)
      setProjects(response.projects)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualPath.trim()) {
      setProjectPath(manualPath.trim())
      setIsInitialized(null) // Will be checked by the page
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
          ) : projects.length === 0 ? (
            <div className="project-selector-empty">
              <p>No tracked projects found</p>
              <p className="hint">
                Initialize a project with Centy to see it here
              </p>
            </div>
          ) : (
            <ul className="project-list" role="listbox">
              {projects.map(project => (
                <li
                  key={project.path}
                  role="option"
                  aria-selected={project.path === projectPath}
                  className={`project-item ${project.path === projectPath ? 'selected' : ''}`}
                  onClick={() => handleSelectProject(project)}
                >
                  <div className="project-item-main">
                    <span className="project-item-name">{project.name}</span>
                    {!project.initialized && (
                      <span className="project-badge not-initialized">
                        Not initialized
                      </span>
                    )}
                  </div>
                  <div className="project-item-details">
                    <span className="project-item-path" title={project.path}>
                      {project.path}
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
              to="/"
              className="init-project-btn"
              onClick={() => setIsOpen(false)}
            >
              ✨ Init Project
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
