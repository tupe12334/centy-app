'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  CreateLinkRequestSchema,
  GetAvailableLinkTypesRequestSchema,
  ListIssuesRequestSchema,
  ListDocsRequestSchema,
  ListPrsRequestSchema,
  LinkTargetType,
  type Link as LinkType,
  type LinkTypeInfo,
  type Issue,
  type Doc,
  type PullRequest,
} from '@/gen/centy_pb'
import { useProject } from '@/components/providers/ProjectProvider'

interface AddLinkModalProps {
  entityId: string
  entityType: 'issue' | 'doc' | 'pr'
  existingLinks: LinkType[]
  onClose: () => void
  onLinkCreated: () => void
}

type EntityItem = {
  id: string
  displayNumber?: number
  title: string
  type: 'issue' | 'doc' | 'pr'
}

const targetTypeToProto: Record<string, LinkTargetType> = {
  issue: LinkTargetType.ISSUE,
  doc: LinkTargetType.DOC,
  pr: LinkTargetType.PR,
}

export function AddLinkModal({
  entityId,
  entityType,
  existingLinks,
  onClose,
  onLinkCreated,
}: AddLinkModalProps) {
  const { projectPath } = useProject()
  const modalRef = useRef<HTMLDivElement>(null)

  const [linkTypes, setLinkTypes] = useState<LinkTypeInfo[]>([])
  const [selectedLinkType, setSelectedLinkType] = useState('')
  const [selectedTarget, setSelectedTarget] = useState<EntityItem | null>(null)
  const [targetTypeFilter, setTargetTypeFilter] = useState<
    'issue' | 'doc' | 'pr'
  >('issue')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<EntityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load available link types
  useEffect(() => {
    async function loadLinkTypes() {
      if (!projectPath) return

      try {
        const request = create(GetAvailableLinkTypesRequestSchema, {
          projectPath,
        })
        const response = await centyClient.getAvailableLinkTypes(request)
        setLinkTypes(response.linkTypes)
        if (response.linkTypes.length > 0) {
          setSelectedLinkType(response.linkTypes[0].name)
        }
      } catch (err) {
        console.error('Failed to load link types:', err)
      } finally {
        setLoadingTypes(false)
      }
    }

    loadLinkTypes()
  }, [projectPath])

  // Search for entities
  const searchEntities = useCallback(async () => {
    if (!projectPath) return

    setLoadingSearch(true)

    try {
      const results: EntityItem[] = []

      if (targetTypeFilter === 'issue') {
        const request = create(ListIssuesRequestSchema, { projectPath })
        const response = await centyClient.listIssues(request)
        results.push(
          ...response.issues
            .filter((i: Issue) => i.id !== entityId) // Exclude self
            .filter(
              (i: Issue) =>
                !existingLinks.some(
                  l => l.targetId === i.id && l.linkType === selectedLinkType
                )
            ) // Exclude existing links
            .filter(
              (i: Issue) =>
                !searchQuery ||
                i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                String(i.displayNumber).includes(searchQuery)
            )
            .map((i: Issue) => ({
              id: i.id,
              displayNumber: i.displayNumber,
              title: i.title,
              type: 'issue' as const,
            }))
        )
      } else if (targetTypeFilter === 'doc') {
        const request = create(ListDocsRequestSchema, { projectPath })
        const response = await centyClient.listDocs(request)
        results.push(
          ...response.docs
            .filter((d: Doc) => d.slug !== entityId) // Exclude self
            .filter(
              (d: Doc) =>
                !existingLinks.some(
                  l => l.targetId === d.slug && l.linkType === selectedLinkType
                )
            )
            .filter(
              (d: Doc) =>
                !searchQuery ||
                d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.slug.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((d: Doc) => ({
              id: d.slug,
              title: d.title,
              type: 'doc' as const,
            }))
        )
      } else if (targetTypeFilter === 'pr') {
        const request = create(ListPrsRequestSchema, { projectPath })
        const response = await centyClient.listPrs(request)
        results.push(
          ...response.prs
            .filter((p: PullRequest) => p.id !== entityId) // Exclude self
            .filter(
              (p: PullRequest) =>
                !existingLinks.some(
                  l => l.targetId === p.id && l.linkType === selectedLinkType
                )
            )
            .filter(
              (p: PullRequest) =>
                !searchQuery ||
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                String(p.displayNumber).includes(searchQuery)
            )
            .map((p: PullRequest) => ({
              id: p.id,
              displayNumber: p.displayNumber,
              title: p.title,
              type: 'pr' as const,
            }))
        )
      }

      setSearchResults(results)
    } catch (err) {
      console.error('Failed to search entities:', err)
    } finally {
      setLoadingSearch(false)
    }
  }, [
    projectPath,
    targetTypeFilter,
    searchQuery,
    entityId,
    existingLinks,
    selectedLinkType,
  ])

  useEffect(() => {
    searchEntities()
  }, [searchEntities])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleCreateLink = useCallback(async () => {
    if (!projectPath || !selectedTarget || !selectedLinkType) return

    setLoading(true)
    setError(null)

    try {
      const request = create(CreateLinkRequestSchema, {
        projectPath,
        sourceId: entityId,
        sourceType: targetTypeToProto[entityType],
        targetId: selectedTarget.id,
        targetType: targetTypeToProto[selectedTarget.type],
        linkType: selectedLinkType,
      })
      const response = await centyClient.createLink(request)

      if (response.success) {
        onLinkCreated()
      } else {
        setError(response.error || 'Failed to create link')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link')
    } finally {
      setLoading(false)
    }
  }, [
    projectPath,
    entityId,
    entityType,
    selectedTarget,
    selectedLinkType,
    onLinkCreated,
  ])

  const getInverseLinkType = (linkType: string) => {
    const type = linkTypes.find(t => t.name === linkType)
    return type?.inverse || linkType
  }

  const getEntityLabel = (item: EntityItem) => {
    if (item.displayNumber) {
      return `#${item.displayNumber} - ${item.title}`
    }
    return `${item.id} - ${item.title}`
  }

  return (
    <div className="link-modal-overlay">
      <div className="link-modal" ref={modalRef}>
        <div className="link-modal-header">
          <h3>Add Link</h3>
          <button className="link-modal-close" onClick={onClose}>
            x
          </button>
        </div>

        <div className="link-modal-body">
          {error && <div className="link-modal-error">{error}</div>}

          <div className="link-modal-field">
            <label>Link Type</label>
            {loadingTypes ? (
              <div className="link-modal-loading">Loading...</div>
            ) : (
              <select
                value={selectedLinkType}
                onChange={e => setSelectedLinkType(e.target.value)}
                className="link-modal-select"
              >
                {linkTypes.map(type => (
                  <option key={type.name} value={type.name}>
                    {type.name}{' '}
                    {type.description ? `- ${type.description}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="link-modal-field">
            <label>Target Type</label>
            <div className="link-modal-tabs">
              <button
                className={`link-modal-tab ${targetTypeFilter === 'issue' ? 'active' : ''}`}
                onClick={() => setTargetTypeFilter('issue')}
              >
                Issues
              </button>
              <button
                className={`link-modal-tab ${targetTypeFilter === 'doc' ? 'active' : ''}`}
                onClick={() => setTargetTypeFilter('doc')}
              >
                Docs
              </button>
              <button
                className={`link-modal-tab ${targetTypeFilter === 'pr' ? 'active' : ''}`}
                onClick={() => setTargetTypeFilter('pr')}
              >
                PRs
              </button>
            </div>
          </div>

          <div className="link-modal-field">
            <label>Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title or number..."
              className="link-modal-input"
            />
          </div>

          <div className="link-modal-field">
            <label>Select Target</label>
            <div className="link-modal-results">
              {loadingSearch ? (
                <div className="link-modal-loading">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="link-modal-empty">No items found</div>
              ) : (
                <ul className="link-modal-list">
                  {searchResults.slice(0, 10).map(item => (
                    <li
                      key={item.id}
                      className={`link-modal-item ${selectedTarget?.id === item.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTarget(item)}
                    >
                      <span className={`link-type-icon link-type-${item.type}`}>
                        {item.type === 'issue'
                          ? '!'
                          : item.type === 'doc'
                            ? 'D'
                            : 'PR'}
                      </span>
                      <span className="link-modal-item-label">
                        {getEntityLabel(item)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {selectedTarget && selectedLinkType && (
            <div className="link-modal-preview">
              <div className="link-preview-item">
                <span className="link-preview-label">This will create:</span>
                <span className="link-preview-text">
                  This {entityType} <strong>{selectedLinkType}</strong>{' '}
                  {selectedTarget.type} #
                  {selectedTarget.displayNumber ||
                    selectedTarget.id.slice(0, 8)}
                </span>
              </div>
              <div className="link-preview-item">
                <span className="link-preview-label">Inverse link:</span>
                <span className="link-preview-text">
                  {selectedTarget.type} #
                  {selectedTarget.displayNumber ||
                    selectedTarget.id.slice(0, 8)}{' '}
                  <strong>{getInverseLinkType(selectedLinkType)}</strong> this{' '}
                  {entityType}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="link-modal-footer">
          <button className="link-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="link-modal-submit"
            onClick={handleCreateLink}
            disabled={loading || !selectedTarget || !selectedLinkType}
          >
            {loading ? 'Creating...' : 'Create Link'}
          </button>
        </div>
      </div>
    </div>
  )
}
