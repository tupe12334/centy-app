import { useState, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { centyClient } from '../api/client.ts'
import { create } from '@bufbuild/protobuf'
import {
  CreateDocRequestSchema,
  IsInitializedRequestSchema,
} from '../gen/centy_pb.ts'
import { useProject } from '../context/ProjectContext.tsx'
import './CreateDoc.css'

export function CreateDoc() {
  const navigate = useNavigate()
  const { projectPath, isInitialized, setIsInitialized } = useProject()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        const request = create(CreateDocRequestSchema, {
          projectPath: projectPath.trim(),
          title: title.trim(),
          content: content.trim(),
          slug: slug.trim() || undefined,
        })
        const response = await centyClient.createDoc(request)

        if (response.success) {
          navigate(`/docs/${response.slug}`)
        } else {
          setError(response.error || 'Failed to create document')
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to connect to daemon'
        )
      } finally {
        setLoading(false)
      }
    },
    [projectPath, title, content, slug, navigate]
  )

  if (!projectPath) {
    return (
      <div className="create-doc">
        <h2>Create New Document</h2>
        <div className="no-project-message">
          <p>Select a project from the header to create a document</p>
        </div>
      </div>
    )
  }

  if (isInitialized === false) {
    return (
      <div className="create-doc">
        <h2>Create New Document</h2>
        <div className="not-initialized-message">
          <p>Centy is not initialized in this directory</p>
          <Link to="/">Initialize Project</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="create-doc">
      <h2>Create New Document</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Document title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="slug">
            Slug (optional, auto-generated from title):
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="e.g., getting-started"
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Content (Markdown):</label>
          <textarea
            id="content"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your documentation in Markdown..."
            rows={15}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="actions">
          <button
            type="button"
            onClick={() => navigate('/docs')}
            className="secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || loading}
            className="primary"
          >
            {loading ? 'Creating...' : 'Create Document'}
          </button>
        </div>
      </form>
    </div>
  )
}
