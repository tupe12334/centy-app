import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { centyClient } from '../api/client.ts'
import { create } from '@bufbuild/protobuf'
import {
  CreateIssueRequestSchema,
  IsInitializedRequestSchema,
} from '../gen/centy_pb.ts'
import './CreateIssue.css'

export function CreateIssue() {
  const navigate = useNavigate()
  const [projectPath, setProjectPath] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null)

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkInitialized(projectPath)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [projectPath, checkInitialized])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!projectPath.trim() || !title.trim()) return

      setLoading(true)
      setError(null)

      try {
        const request = create(CreateIssueRequestSchema, {
          projectPath: projectPath.trim(),
          title: title.trim(),
          description: description.trim(),
          priority,
          status: 'open',
        })
        const response = await centyClient.createIssue(request)

        if (response.success) {
          navigate(`/issues/${response.issueNumber}?project=${encodeURIComponent(projectPath.trim())}`)
        } else {
          setError(response.error || 'Failed to create issue')
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to connect to daemon'
        )
      } finally {
        setLoading(false)
      }
    },
    [projectPath, title, description, priority, navigate]
  )

  return (
    <div className="create-issue">
      <h2>Create New Issue</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="project-path">Project Path:</label>
          <input
            id="project-path"
            type="text"
            value={projectPath}
            onChange={e => setProjectPath(e.target.value)}
            placeholder="/path/to/your/project"
            required
          />
          {projectPath && isInitialized === false && (
            <p className="field-error">
              Centy is not initialized in this directory
            </p>
          )}
          {projectPath && isInitialized === true && (
            <p className="field-success">Centy project found</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Issue title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the issue..."
            rows={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority:</label>
          <select
            id="priority"
            value={priority}
            onChange={e => setPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="actions">
          <button
            type="button"
            onClick={() => navigate('/issues')}
            className="secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              !projectPath.trim() ||
              !title.trim() ||
              loading ||
              isInitialized === false
            }
            className="primary"
          >
            {loading ? 'Creating...' : 'Create Issue'}
          </button>
        </div>
      </form>
    </div>
  )
}
