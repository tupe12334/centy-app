'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  ListProjectsRequestSchema,
  UntrackProjectRequestSchema,
  type ProjectInfo,
} from '@/gen/centy_pb'
import {
  useArchivedProjects,
  useProject,
} from '@/components/providers/ProjectProvider'

export function ArchivedProjects() {
  const { archivedPaths, unarchiveProject, removeArchivedProject } =
    useArchivedProjects()
  const { setProjectPath, setIsInitialized } = useProject()
  const [allProjects, setAllProjects] = useState<ProjectInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingPath, setRemovingPath] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [confirmRemoveAll, setConfirmRemoveAll] = useState(false)
  const [removingAll, setRemovingAll] = useState(false)

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

  const handleRemove = async (projectPath: string) => {
    setRemovingPath(projectPath)
    setError(null)
    try {
      const request = create(UntrackProjectRequestSchema, { projectPath })
      const response = await centyClient.untrackProject(request)
      if (!response.success && response.error) {
        setError(response.error)
      } else {
        removeArchivedProject(projectPath)
        setAllProjects(prev => prev.filter(p => p.path !== projectPath))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove project')
    } finally {
      setRemovingPath(null)
      setConfirmRemove(null)
    }
  }

  const handleRemoveStale = (path: string) => {
    removeArchivedProject(path)
    setConfirmRemove(null)
  }

  const handleRemoveAll = async () => {
    setRemovingAll(true)
    setError(null)
    try {
      // Remove all projects tracked by daemon
      for (const project of archivedProjects) {
        const request = create(UntrackProjectRequestSchema, {
          projectPath: project.path,
        })
        const response = await centyClient.untrackProject(request)
        if (!response.success && response.error) {
          setError(response.error)
          setRemovingAll(false)
          setConfirmRemoveAll(false)
          return
        }
        removeArchivedProject(project.path)
      }
      // Remove all stale paths
      for (const path of archivedPathsNotInDaemon) {
        removeArchivedProject(path)
      }
      setAllProjects(prev => prev.filter(p => !archivedPaths.includes(p.path)))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to remove all projects'
      )
    } finally {
      setRemovingAll(false)
      setConfirmRemoveAll(false)
    }
  }

  const hasArchivedProjects =
    archivedProjects.length > 0 || archivedPathsNotInDaemon.length > 0

  return (
    <div className="archived-projects">
      <div className="archived-header">
        <h2>Archived Projects</h2>
        <div className="archived-header-actions">
          {hasArchivedProjects && !loading && (
            <>
              {confirmRemoveAll ? (
                <div className="remove-all-confirm">
                  <span className="confirm-text">Remove all permanently?</span>
                  <button
                    className="confirm-yes-btn"
                    onClick={handleRemoveAll}
                    disabled={removingAll}
                  >
                    {removingAll ? 'Removing...' : 'Yes'}
                  </button>
                  <button
                    className="confirm-no-btn"
                    onClick={() => setConfirmRemoveAll(false)}
                    disabled={removingAll}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  className="remove-all-btn"
                  onClick={() => setConfirmRemoveAll(true)}
                >
                  Remove all
                </button>
              )}
            </>
          )}
          <Link href="/" className="back-link">
            Back to Projects
          </Link>
        </div>
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
                <span className="archived-item-name">
                  {project.userTitle || project.projectTitle || project.name}
                </span>
                <span className="archived-item-path">
                  {project.displayPath}
                </span>
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
                {confirmRemove === project.path ? (
                  <>
                    <span className="confirm-text">Remove permanently?</span>
                    <button
                      className="confirm-yes-btn"
                      onClick={() => handleRemove(project.path)}
                      disabled={removingPath === project.path}
                    >
                      {removingPath === project.path ? 'Removing...' : 'Yes'}
                    </button>
                    <button
                      className="confirm-no-btn"
                      onClick={() => setConfirmRemove(null)}
                      disabled={removingPath === project.path}
                    >
                      No
                    </button>
                  </>
                ) : (
                  <>
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
                    <button
                      className="remove-btn"
                      onClick={() => setConfirmRemove(project.path)}
                    >
                      Remove
                    </button>
                  </>
                )}
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
                {confirmRemove === path ? (
                  <>
                    <span className="confirm-text">Remove permanently?</span>
                    <button
                      className="confirm-yes-btn"
                      onClick={() => handleRemoveStale(path)}
                    >
                      Yes
                    </button>
                    <button
                      className="confirm-no-btn"
                      onClick={() => setConfirmRemove(null)}
                    >
                      No
                    </button>
                  </>
                ) : (
                  <button
                    className="remove-btn"
                    onClick={() => setConfirmRemove(path)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
