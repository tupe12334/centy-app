'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  CreateIssueRequestSchema,
  IsInitializedRequestSchema,
} from '@/gen/centy_pb'
import { useProject } from '@/components/providers/ProjectProvider'
import { useProjectPathToUrl } from '@/components/providers/PathContextProvider'
import {
  AssetUploader,
  type AssetUploaderHandle,
  type PendingAsset,
} from '@/components/assets/AssetUploader'
import { TextEditor } from '@/components/shared/TextEditor'
import { useSaveShortcut } from '@/hooks/useSaveShortcut'
import { useStateManager } from '@/lib/state'

export function CreateIssue() {
  const router = useRouter()
  const params = useParams()
  const { projectPath, isInitialized, setIsInitialized } = useProject()
  const projectPathToUrl = useProjectPathToUrl()
  const stateManager = useStateManager()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState(2)
  const [status, setStatus] = useState(() => stateManager.getDefaultState())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([])
  const assetUploaderRef = useRef<AssetUploaderHandle>(null)
  const stateOptions = stateManager.getStateOptions()

  // Get the project URL base from params or resolve from projectPath
  const getProjectBase = useCallback(async () => {
    const org = params.organization as string | undefined
    const project = params.project as string | undefined

    if (org && project) {
      return `/${org}/${project}`
    }

    // Fall back to resolving from projectPath
    if (projectPath) {
      const result = await projectPathToUrl(projectPath)
      if (result) {
        return `/${result.orgSlug}/${result.projectName}`
      }
    }

    return null
  }, [params, projectPath, projectPathToUrl])

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
          status,
        })
        const response = await centyClient.createIssue(request)

        if (response.success) {
          if (pendingAssets.length > 0 && assetUploaderRef.current) {
            await assetUploaderRef.current.uploadAllPending(response.id)
          }
          // Navigate to the project-scoped issue detail page
          const base = await getProjectBase()
          if (base) {
            router.push(`${base}/issues/${response.issueNumber}` as Route)
          } else {
            // Fallback to issues list if we can't determine project base
            router.push('/')
          }
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
    [
      projectPath,
      title,
      description,
      priority,
      status,
      pendingAssets,
      router,
      getProjectBase,
    ]
  )

  const handleKeyboardSave = useCallback(() => {
    if (!projectPath.trim() || !title.trim() || loading) return
    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent
    handleSubmit(syntheticEvent)
  }, [projectPath, title, loading, handleSubmit])

  useSaveShortcut({
    onSave: handleKeyboardSave,
    enabled: !!projectPath.trim() && !!title.trim() && !loading,
  })

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
          <Link href="/">Initialize Project</Link>
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
          <TextEditor
            value={description}
            onChange={setDescription}
            format="md"
            mode="edit"
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
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {stateOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
            onClick={async () => {
              const base = await getProjectBase()
              router.push((base ? `${base}/issues` : '/') as Route)
            }}
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
