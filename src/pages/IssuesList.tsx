import { useState, useCallback, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { centyClient } from '../api/client.ts'
import { create } from '@bufbuild/protobuf'
import {
  ListIssuesRequestSchema,
  IsInitializedRequestSchema,
  type Issue,
} from '../gen/centy_pb.ts'
import './IssuesList.css'

export function IssuesList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [projectPath, setProjectPath] = useState(
    searchParams.get('project') || ''
  )
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const checkInitialized = useCallback(async (path: string) => {
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
  }, [])

  const fetchIssues = useCallback(async () => {
    if (!projectPath.trim() || isInitialized !== true) return

    setLoading(true)
    setError(null)

    try {
      const request = create(ListIssuesRequestSchema, {
        projectPath: projectPath.trim(),
        status: statusFilter,
        priority: priorityFilter,
      })
      const response = await centyClient.listIssues(request)
      setIssues(response.issues)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setLoading(false)
    }
  }, [projectPath, statusFilter, priorityFilter, isInitialized])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkInitialized(projectPath)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [projectPath, checkInitialized])

  useEffect(() => {
    if (isInitialized === true) {
      fetchIssues()
    }
  }, [isInitialized, fetchIssues])

  const handleProjectPathChange = (path: string) => {
    setProjectPath(path)
    if (path.trim()) {
      setSearchParams({ project: path.trim() })
    } else {
      setSearchParams({})
    }
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'priority-high'
      case 'medium':
        return 'priority-medium'
      case 'low':
        return 'priority-low'
      default:
        return ''
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'status-open'
      case 'in-progress':
        return 'status-in-progress'
      case 'closed':
        return 'status-closed'
      default:
        return ''
    }
  }

  return (
    <div className="issues-list">
      <div className="issues-header">
        <h2>Issues</h2>
        <Link to="/issues/new" className="create-btn">
          + New Issue
        </Link>
      </div>

      <div className="project-selector">
        <label htmlFor="project-path">Project Path:</label>
        <input
          id="project-path"
          type="text"
          value={projectPath}
          onChange={e => handleProjectPathChange(e.target.value)}
          placeholder="/path/to/your/project"
        />
        {projectPath && isInitialized === false && (
          <p className="field-error">
            Centy is not initialized in this directory
          </p>
        )}
      </div>

      {isInitialized === true && (
        <>
          <div className="filters">
            <div className="filter-group">
              <label htmlFor="status-filter">Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="priority-filter">Priority:</label>
              <select
                id="priority-filter"
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <button
              onClick={fetchIssues}
              disabled={loading}
              className="refresh-btn"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading && issues.length === 0 ? (
            <div className="loading">Loading issues...</div>
          ) : issues.length === 0 ? (
            <div className="empty-state">
              <p>No issues found</p>
              <Link to="/issues/new">Create your first issue</Link>
            </div>
          ) : (
            <div className="issues-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map(issue => (
                    <tr key={issue.issueNumber}>
                      <td className="issue-number">
                        <Link
                          to={`/issues/${issue.issueNumber}?project=${encodeURIComponent(projectPath)}`}
                        >
                          #{issue.issueNumber}
                        </Link>
                      </td>
                      <td className="issue-title">
                        <Link
                          to={`/issues/${issue.issueNumber}?project=${encodeURIComponent(projectPath)}`}
                        >
                          {issue.title}
                        </Link>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(issue.metadata?.status || '')}`}
                        >
                          {issue.metadata?.status || 'unknown'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`priority-badge ${getPriorityClass(issue.metadata?.priority || '')}`}
                        >
                          {issue.metadata?.priority || 'unknown'}
                        </span>
                      </td>
                      <td className="issue-date">
                        {issue.metadata?.createdAt
                          ? new Date(issue.metadata.createdAt).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
