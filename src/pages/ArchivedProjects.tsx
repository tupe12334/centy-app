import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { centyClient } from '../api/client.ts'
import { create } from '@bufbuild/protobuf'
import { ListProjectsRequestSchema, type ProjectInfo } from '../gen/centy_pb.ts'
import { useArchivedProjects, useProject } from '../context/ProjectContext.tsx'
import './ArchivedProjects.css'

export function ArchivedProjects() {
  const { archivedPaths, unarchiveProject } = useArchivedProjects()
  const { setProjectPath, setIsInitialized } = useProject()
  const [allProjects, setAllProjects] = useState<ProjectInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const request = create(ListProjectsRequestSchema, { includeStale: true })
      const response = await centyClient.listProjects(request)
      setAllProjects(response.projects)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Filter to only show archived projects
  const archivedProjects = allProjects.filter(p =>
    archivedPaths.includes(p.path)
  )

  // Also show archived paths that may not be in daemon (stale/deleted)
  const archivedPathsNotInDaemon = archivedPaths.filter(
    path => !allProjects.some(p => p.path === path)
  )

  const handleRestore = (projectPath: string) => {
    unarchiveProject(projectPath)
  }

  const handleRestoreAndSelect = (project: ProjectInfo) => {
    unarchiveProject(project.path)
    setProjectPath(project.path)
    setIsInitialized(project.initialized)
  }

  return (
    <div className="archived-projects">
      <div className="archived-header">
        <h2>Archived Projects</h2>
        <Link to="/issues" className="back-link">
          Back to Issues
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading projects...</div>
      ) : archivedProjects.length === 0 &&
        archivedPathsNotInDaemon.length === 0 ? (
        <div className="empty-state">
          <p>No archived projects</p>
          <p className="hint">
            Archive projects from the project selector to see them here
          </p>
        </div>
      ) : (
        <ul className="archived-list">
          {archivedProjects.map(project => (
            <li key={project.path} className="archived-item">
              <div className="archived-item-info">
                <span className="archived-item-name">{project.name}</span>
                <span className="archived-item-path">{project.path}</span>
                <div className="archived-item-stats">
                  <span>Issues: {project.issueCount}</span>
                  <span>Docs: {project.docCount}</span>
                  {!project.initialized && (
                    <span className="not-initialized-badge">
                      Not initialized
                    </span>
                  )}
                </div>
              </div>
              <div className="archived-item-actions">
                <button
                  className="restore-btn"
                  onClick={() => handleRestore(project.path)}
                >
                  Restore
                </button>
                <button
                  className="restore-select-btn"
                  onClick={() => handleRestoreAndSelect(project)}
                >
                  Restore & Select
                </button>
              </div>
            </li>
          ))}
          {archivedPathsNotInDaemon.map(path => (
            <li key={path} className="archived-item stale">
              <div className="archived-item-info">
                <span className="archived-item-name">
                  {path.split('/').pop() || path}
                </span>
                <span className="archived-item-path">{path}</span>
                <div className="archived-item-stats">
                  <span className="stale-badge">Not tracked by daemon</span>
                </div>
              </div>
              <div className="archived-item-actions">
                <button
                  className="restore-btn"
                  onClick={() => handleRestore(path)}
                >
                  Remove from Archive
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
