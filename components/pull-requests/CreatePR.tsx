'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  CreatePrRequestSchema,
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
import '@/styles/pages/CreatePR.css'

export function CreatePR() {
  const router = useRouter()
  const params = useParams()
  const { projectPath, isInitialized, setIsInitialized } = useProject()
  const projectPathToUrl = useProjectPathToUrl()

  const getProjectBase = useCallback(async () => {
    const org = params.organization as string | undefined
    const project = params.project as string | undefined
    if (org && project) return `/${org}/${project}`
    if (projectPath) {
      const result = await projectPathToUrl(projectPath)
      if (result) return `/${result.orgSlug}/${result.projectName}`
    }
    return null
  }, [params, projectPath, projectPathToUrl])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sourceBranch, setSourceBranch] = useState('')
  const [targetBranch, setTargetBranch] = useState('main')
  const [priority, setPriority] = useState(2)
  const [status, setStatus] = useState<'draft' | 'open'>('draft')
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
        const request = create(CreatePrRequestSchema, {
          projectPath: projectPath.trim(),
          title: title.trim(),
          description: description.trim(),
          sourceBranch: sourceBranch.trim() || undefined,
          targetBranch: targetBranch.trim() || 'main',
          priority,
          status,
        })
        const response = await centyClient.createPr(request)

        if (response.success) {
          if (pendingAssets.length > 0 && assetUploaderRef.current) {
            await assetUploaderRef.current.uploadAllPending(response.id, true)
          }
          router.push(`/pull-requests/${response.id}` as Route)
        } else {
          setError(response.error || 'Failed to create pull request')
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
      sourceBranch,
      targetBranch,
      priority,
      status,
      pendingAssets,
      router,
    ]
  )

  if (!projectPath) {
    return (
      <div className="create-pr">
        <h2>Create New Pull Request</h2>
        <div className="no-project-message">
          <p>Select a project from the header to create a pull request</p>
        </div>
      </div>
    )
  }

  if (isInitialized === false) {
    return (
      <div className="create-pr">
        <h2>Create New Pull Request</h2>
        <div className="not-initialized-message">
          <p>Centy is not initialized in this directory</p>
          <Link href="/">Initialize Project</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="create-pr">
      <h2>Create New Pull Request</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Pull request title"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="source-branch">Source Branch:</label>
            <input
              id="source-branch"
              type="text"
              value={sourceBranch}
              onChange={e => setSourceBranch(e.target.value)}
              placeholder="Auto-detected if empty"
            />
          </div>

          <div className="form-group">
            <label htmlFor="target-branch">Target Branch:</label>
            <input
              id="target-branch"
              type="text"
              value={targetBranch}
              onChange={e => setTargetBranch(e.target.value)}
              placeholder="main"
            />
          </div>
        </div>

        <div className="form-row">
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
              onChange={e => setStatus(e.target.value as 'draft' | 'open')}
            >
              <option value="draft">Draft</option>
              <option value="open">Open</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <TextEditor
            value={description}
            onChange={setDescription}
            format="md"
            mode="edit"
            placeholder="Describe the pull request..."
            minHeight={150}
          />
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
              router.push((base ? `${base}/pull-requests` : '/') as Route)
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
            {loading ? 'Creating...' : 'Create Pull Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
