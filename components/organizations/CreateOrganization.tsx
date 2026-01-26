'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { route } from 'nextjs-routes'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import { CreateOrganizationRequestSchema } from '@/gen/centy_pb'
import { useSaveShortcut } from '@/hooks/useSaveShortcut'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CreateOrganization() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallySet, setSlugManuallySet] = useState(false)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-generate slug from name if not manually set
  useEffect(() => {
    if (!slugManuallySet && name) {
      setSlug(generateSlug(name))
    }
  }, [name, slugManuallySet])

  const handleSlugChange = (value: string) => {
    setSlug(value)
    setSlugManuallySet(true)
  }

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) return

    setSaving(true)
    setError(null)

    try {
      const request = create(CreateOrganizationRequestSchema, {
        slug: slug.trim() || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
      })
      const response = await centyClient.createOrganization(request)

      if (response.success && response.organization) {
        router.push(
          route({
            pathname: '/organizations/[orgSlug]',
            query: { orgSlug: response.organization.slug },
          })
        )
      } else {
        const errorMsg = response.error || 'Failed to create organization'
        if (errorMsg.includes('unimplemented')) {
          setError(
            'Organizations feature is not available. Please update your daemon.'
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
          'Organizations feature is not available. Please update your daemon.'
        )
      } else {
        setError(message)
      }
    } finally {
      setSaving(false)
    }
  }, [name, slug, description, router])

  useSaveShortcut({
    onSave: handleSubmit,
    enabled: !saving && !!name.trim(),
  })

  return (
    <div className="create-organization">
      <div className="create-organization-header">
        <Link href="/organizations" className="back-link">
          Back to Organizations
        </Link>
        <h2>Create New Organization</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form
        onSubmit={e => {
          e.preventDefault()
          handleSubmit()
        }}
        className="create-organization-form"
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
            placeholder="Organization name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="slug">Slug</label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={e => handleSlugChange(e.target.value)}
            placeholder="Auto-generated from name"
          />
          <span className="form-hint">
            Unique identifier (kebab-case). Leave empty to auto-generate.
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
          />
        </div>

        <div className="form-actions">
          <Link href="/organizations" className="cancel-btn">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="save-btn"
          >
            {saving ? 'Creating...' : 'Create Organization'}
          </button>
        </div>
      </form>
    </div>
  )
}
