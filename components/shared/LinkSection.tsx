'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { route, type RouteLiteral } from 'nextjs-routes'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  ListLinksRequestSchema,
  DeleteLinkRequestSchema,
  LinkTargetType,
  type Link as LinkType,
} from '@/gen/centy_pb'
import { useProject } from '@/components/providers/ProjectProvider'
import { AddLinkModal } from './AddLinkModal'

interface LinkSectionProps {
  entityId: string
  entityType: 'issue' | 'doc' | 'pr'
  /** Whether the user can add/remove links (edit mode) */
  editable?: boolean
}

const targetTypeToProto: Record<string, LinkTargetType> = {
  issue: LinkTargetType.ISSUE,
  doc: LinkTargetType.DOC,
  pr: LinkTargetType.PR,
}

const protoToTargetType: Record<LinkTargetType, string> = {
  [LinkTargetType.UNSPECIFIED]: 'unknown',
  [LinkTargetType.ISSUE]: 'issue',
  [LinkTargetType.DOC]: 'doc',
  [LinkTargetType.PR]: 'pr',
}

export function LinkSection({
  entityId,
  entityType,
  editable = true,
}: LinkSectionProps) {
  const { projectPath } = useProject()
  const params = useParams()
  const [links, setLinks] = useState<LinkType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null)

  // Get project context for building routes
  const projectContext = useMemo(() => {
    const org = params?.organization as string | undefined
    const project = params?.project as string | undefined
    if (org && project) return { organization: org, project }
    return null
  }, [params])

  // Helper to build route for linked item
  const buildLinkRoute = useCallback(
    (targetType: LinkTargetType, targetId: string): RouteLiteral | '/' => {
      if (!projectContext) return '/'
      const targetTypeName = protoToTargetType[targetType]
      switch (targetTypeName) {
        case 'issue':
          return route({
            pathname: '/[organization]/[project]/issues/[issueId]',
            query: { ...projectContext, issueId: targetId },
          })
        case 'doc':
          return route({
            pathname: '/[organization]/[project]/docs/[slug]',
            query: { ...projectContext, slug: targetId },
          })
        case 'pr':
          return route({
            pathname: '/[organization]/[project]/pull-requests/[prNumber]',
            query: { ...projectContext, prNumber: targetId },
          })
        default:
          return '/'
      }
    },
    [projectContext]
  )

  const fetchLinks = useCallback(async () => {
    if (!projectPath || !entityId) return

    setLoading(true)
    setError(null)

    try {
      const request = create(ListLinksRequestSchema, {
        projectPath,
        entityId,
        entityType: targetTypeToProto[entityType],
      })
      const response = await centyClient.listLinks(request)
      setLinks(response.links)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load links')
    } finally {
      setLoading(false)
    }
  }, [projectPath, entityId, entityType])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  const handleDeleteLink = useCallback(
    async (link: LinkType) => {
      if (!projectPath || !entityId) return

      const linkKey = `${link.targetId}-${link.linkType}`
      setDeletingLinkId(linkKey)
      setError(null)

      try {
        const request = create(DeleteLinkRequestSchema, {
          projectPath,
          sourceId: entityId,
          sourceType: targetTypeToProto[entityType],
          targetId: link.targetId,
          targetType: link.targetType,
          linkType: link.linkType,
        })
        const response = await centyClient.deleteLink(request)

        if (response.success) {
          // Remove the deleted link from state
          setLinks(prev =>
            prev.filter(
              l =>
                !(l.targetId === link.targetId && l.linkType === link.linkType)
            )
          )
        } else {
          setError(response.error || 'Failed to delete link')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete link')
      } finally {
        setDeletingLinkId(null)
      }
    },
    [projectPath, entityId, entityType]
  )

  const handleLinkCreated = useCallback(() => {
    fetchLinks()
    setShowAddModal(false)
  }, [fetchLinks])

  // Group links by type
  const groupedLinks = links.reduce<Record<string, LinkType[]>>((acc, link) => {
    const type = link.linkType || 'related'
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(link)
    return acc
  }, {})

  const getLinkTypeDisplay = (linkType: string) => {
    return linkType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getTargetTypeIcon = (targetType: LinkTargetType) => {
    switch (targetType) {
      case LinkTargetType.ISSUE:
        return '!'
      case LinkTargetType.DOC:
        return 'D'
      case LinkTargetType.PR:
        return 'PR'
      default:
        return '?'
    }
  }

  if (loading) {
    return (
      <div className="link-section">
        <h3>Links</h3>
        <div className="link-section-loading">Loading links...</div>
      </div>
    )
  }

  return (
    <div className="link-section">
      <div className="link-section-header">
        <h3>Links</h3>
        {editable && (
          <button
            className="link-add-btn"
            onClick={() => setShowAddModal(true)}
            title="Add link"
          >
            + Add Link
          </button>
        )}
      </div>

      {error && <div className="link-section-error">{error}</div>}

      {links.length === 0 ? (
        <p className="link-section-empty">No linked items</p>
      ) : (
        <div className="link-groups">
          {Object.entries(groupedLinks).map(([linkType, typeLinks]) => (
            <div key={linkType} className="link-group">
              <div className="link-group-header">
                {getLinkTypeDisplay(linkType)}
              </div>
              <ul className="link-list">
                {typeLinks.map(link => {
                  const targetTypeName = protoToTargetType[link.targetType]
                  const linkKey = `${link.targetId}-${link.linkType}`
                  const isDeleting = deletingLinkId === linkKey

                  return (
                    <li key={linkKey} className="link-item">
                      <Link
                        href={buildLinkRoute(link.targetType, link.targetId)}
                        className="link-item-link"
                      >
                        <span
                          className={`link-type-icon link-type-${targetTypeName}`}
                        >
                          {getTargetTypeIcon(link.targetType)}
                        </span>
                        <span className="link-target-id">
                          {link.targetId.slice(0, 8)}...
                        </span>
                      </Link>
                      {editable && (
                        <button
                          className="link-delete-btn"
                          onClick={() => handleDeleteLink(link)}
                          disabled={isDeleting}
                          title="Remove link"
                        >
                          {isDeleting ? '...' : 'x'}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddLinkModal
          entityId={entityId}
          entityType={entityType}
          existingLinks={links}
          onClose={() => setShowAddModal(false)}
          onLinkCreated={handleLinkCreated}
        />
      )}
    </div>
  )
}
