import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { centyClient } from '../api/client.ts'
import { create } from '@bufbuild/protobuf'
import {
  CreateIssueRequestSchema,
  IsInitializedRequestSchema,
} from '../gen/centy_pb.ts'
import { useProject } from '../context/ProjectContext.tsx'
import {
  AssetUploader,
  type AssetUploaderHandle,
  type PendingAsset,
} from '../components/AssetUploader.tsx'
import { MarkdownEditor } from '../components/MarkdownEditor.tsx'
import './CreateIssue.css'

export function CreateIssue() {
  const navigate = useNavigate()
  const { projectPath, isInitialized, setIsInitialized } = useProject()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState(2) // 1=high, 2=medium, 3=low
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([])
  const assetUploaderRef = useRef<AssetUploaderHandle>(null)

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

  useEffect(() => {
    if (projectPath && isInitialized === null) {
      checkInitialized(projectPath)
    }
  }, [projectPath, isInitialized, checkInitialized])

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
          // Upload pending assets if any
          if (pendingAssets.length > 0 && assetUploaderRef.current) {
            await assetUploaderRef.current.uploadAllPending(response.id)
          }
          navigate(`/issues/${response.issueNumber}`)
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
    [projectPath, title, description, priority, pendingAssets, navigate]
  )

  if (!projectPath) {
    return (
      <div className="create-issue">
        <h2>Create New Issue</h2>
        <div className="no-project-message">
          <p>Select a project from the header to create an issue</p>
        </div>
      </div>
    )
  }

  if (isInitialized === false) {
    return (
      <div className="create-issue">
        <h2>Create New Issue</h2>
        <div className="not-initialized-message">
          <p>Centy is not initialized in this directory</p>
          <Link to="/">Initialize Project</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="create-issue">
      <h2>Create New Issue</h2>

      <form onSubmit={handleSubmit}>
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
          <MarkdownEditor
            value={description}
            onChange={setDescription}
            placeholder="Describe the issue..."
            minHeight={150}
          />
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority:</label>
          <select
            id="priority"
            value={priority}
            onChange={e => setPriority(Number(e.target.value))}
          >
            <option value={1}>High</option>
            <option value={2}>Medium</option>
            <option value={3}>Low</option>
          </select>
        </div>

        <div className="form-group">
          <label>Attachments:</label>
          <AssetUploader
            ref={assetUploaderRef}
            projectPath={projectPath}
            mode="create"
            onPendingChange={setPendingAssets}
          />
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
            disabled={!title.trim() || loading}
            className="primary"
          >
            {loading ? 'Creating...' : 'Create Issue'}
          </button>
        </div>
      </form>
    </div>
  )
}
