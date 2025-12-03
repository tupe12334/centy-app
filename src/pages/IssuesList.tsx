import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { centyClient } from '../api/client.ts'
import { create } from '@bufbuild/protobuf'
import {
  ListIssuesRequestSchema,
  IsInitializedRequestSchema,
  type Issue,
} from '../gen/centy_pb.ts'
import { useProject } from '../context/ProjectContext.tsx'
import './IssuesList.css'

export function IssuesList() {
  const { projectPath, isInitialized, setIsInitialized } = useProject()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState(0) // 0 = all, 1 = high, 2 = medium, 3 = low

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

  const fetchIssues = useCallback(async () => {
    if (!projectPath.trim() || isInitialized !== true) return

    setLoading(true)
    setError(null)

    try {
      const request = create(ListIssuesRequestSchema, {
        projectPath: projectPath.trim(),
        status: statusFilter,
        priority: priorityFilter, // 0 = all
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

  const getPriorityClass = (priorityLabel: string) => {
    switch (priorityLabel.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'priority-high'
      case 'medium':
      case 'normal':
        return 'priority-medium'
      case 'low':
        return 'priority-low'
      default:
        // Handle P1, P2, etc. format
        if (priorityLabel.startsWith('P') || priorityLabel.startsWith('p')) {
          const num = parseInt(priorityLabel.slice(1))
          if (num === 1) return 'priority-high'
          if (num === 2) return 'priority-medium'
          return 'priority-low'
        }
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

      {!projectPath && (
        <div className="no-project-message">
          <p>Select a project from the header to view issues</p>
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
                onChange={e => setPriorityFilter(Number(e.target.value))}
              >
                <option value={0}>All</option>
                <option value={1}>High</option>
                <option value={2}>Medium</option>
                <option value={3}>Low</option>
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
                        <Link to={`/issues/${issue.issueNumber}`}>
                          #{issue.issueNumber}
                        </Link>
                      </td>
                      <td className="issue-title">
                        <Link to={`/issues/${issue.issueNumber}`}>
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
                          className={`priority-badge ${getPriorityClass(issue.metadata?.priorityLabel || '')}`}
                        >
                          {issue.metadata?.priorityLabel || 'unknown'}
                        </span>
                      </td>
                      <td className="issue-date">
                        {issue.metadata?.createdAt
                          ? new Date(
                              issue.metadata.createdAt
                            ).toLocaleDateString()
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
