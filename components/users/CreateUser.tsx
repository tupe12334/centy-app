'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import { CreateUserRequestSchema } from '@/gen/centy_pb'
import { useProject } from '@/components/providers/ProjectProvider'
import { useSaveShortcut } from '@/hooks/useSaveShortcut'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CreateUser() {
  const router = useRouter()
  const params = useParams()
  const { projectPath, isInitialized } = useProject()

  const usersListUrl = useMemo(() => {
    const org = params.organization as string | undefined
    const project = params.project as string | undefined
    if (org && project) return `/${org}/${project}/users`
    return '/'
  }, [params])

  const [name, setName] = useState('')
  const [userId, setUserId] = useState('')
  const [userIdManuallySet, setUserIdManuallySet] = useState(false)
  const [email, setEmail] = useState('')
  const [gitUsernames, setGitUsernames] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-generate slug from name if not manually set
  useEffect(() => {
    if (!userIdManuallySet && name) {
      setUserId(generateSlug(name))
    }
  }, [name, userIdManuallySet])

  const handleUserIdChange = (value: string) => {
    setUserId(value)
    setUserIdManuallySet(true)
  }

  const handleAddGitUsername = () => {
    setGitUsernames([...gitUsernames, ''])
  }

  const handleRemoveGitUsername = (index: number) => {
    setGitUsernames(gitUsernames.filter((_, i) => i !== index))
  }

  const handleGitUsernameChange = (index: number, value: string) => {
    const updated = [...gitUsernames]
    updated[index] = value
    setGitUsernames(updated)
  }

  const handleSubmit = useCallback(async () => {
    if (!projectPath || !name.trim()) return

    setSaving(true)
    setError(null)

    try {
      const request = create(CreateUserRequestSchema, {
        projectPath,
        id: userId.trim() || undefined,
        name: name.trim(),
        email: email.trim() || undefined,
        gitUsernames: gitUsernames.filter(u => u.trim() !== ''),
      })
      const response = await centyClient.createUser(request)

      if (response.success && response.user) {
        router.push(`/users/${response.user.id}`)
      } else {
        const errorMsg = response.error || 'Failed to create user'
        if (errorMsg.includes('unimplemented')) {
          setError(
            'User management is not yet available. Please update your daemon to the latest version.'
          )
        } else {
          setError(errorMsg)
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      if (message.includes('unimplemented')) {
        setError(
          'User management is not yet available. Please update your daemon to the latest version.'
        )
      } else {
        setError(message)
      }
    } finally {
      setSaving(false)
    }
  }, [projectPath, name, userId, email, gitUsernames, router])

  useSaveShortcut({
    onSave: handleSubmit,
    enabled: !saving && !!name.trim() && !!projectPath,
  })

  if (!projectPath) {
    return (
      <div className="create-user">
        <div className="error-message">
          No project path specified. Please go to the{' '}
          <Link href={usersListUrl}>users list</Link> and select a project.
        </div>
      </div>
    )
  }

  if (isInitialized === false) {
    return (
      <div className="create-user">
        <div className="not-initialized-message">
          <p>Centy is not initialized in this directory</p>
          <Link href="/">Initialize Project</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="create-user">
      <div className="create-user-header">
        <Link href={usersListUrl} className="back-link">
          Back to Users
        </Link>
        <h2>Create New User</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form
        onSubmit={e => {
          e.preventDefault()
          handleSubmit()
        }}
        className="create-user-form"
      >
        <div className="form-group">
          <label htmlFor="name">
            Name <span className="required">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Display name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="userId">User ID</label>
          <input
            id="userId"
            type="text"
            value={userId}
            onChange={e => handleUserIdChange(e.target.value)}
            placeholder="Auto-generated from name"
          />
          <span className="form-hint">
            Unique identifier (slug format). Leave empty to auto-generate.
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address (optional)"
          />
        </div>

        <div className="form-group">
          <label>Git Usernames</label>
          <div className="git-usernames-list">
            {gitUsernames.map((username, index) => (
              <div key={index} className="git-username-item">
                <input
                  type="text"
                  value={username}
                  onChange={e => handleGitUsernameChange(index, e.target.value)}
                  placeholder="Git username"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveGitUsername(index)}
                  className="remove-git-username-btn"
                  title="Remove"
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddGitUsername}
              className="add-git-username-btn"
            >
              + Add Git Username
            </button>
          </div>
        </div>

        <div className="form-actions">
          <Link href={usersListUrl} className="cancel-btn">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="save-btn"
          >
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}
