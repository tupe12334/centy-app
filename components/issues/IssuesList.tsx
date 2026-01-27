'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { RouteLiteral } from 'nextjs-routes'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import { ListIssuesRequestSchema, type Issue } from '@/gen/centy_pb'
import {
  usePathContext,
  useProjectPathToUrl,
} from '@/components/providers/PathContextProvider'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useAppLink } from '@/hooks/useAppLink'
import { useLastSeenIssues } from '@/hooks/useLastSeenIssues'
import { useIssueTableSettings } from '@/hooks/useIssueTableSettings'
import { useStateManager } from '@/lib/state'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import {
  MultiSelect,
  type MultiSelectOption,
} from '@/components/shared/MultiSelect'
import {
  ContextMenu,
  type ContextMenuItem,
} from '@/components/shared/ContextMenu'
import { MoveModal } from '@/components/shared/MoveModal'
import { DuplicateModal } from '@/components/shared/DuplicateModal'
import { StandaloneWorkspaceModal } from '@/components/shared/StandaloneWorkspaceModal'

const PRIORITY_OPTIONS: MultiSelectOption[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const columnHelper = createColumnHelper<Issue>()

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

export function IssuesList() {
  const router = useRouter()
  const { projectPath, isInitialized } = usePathContext()
  const resolvePathToUrl = useProjectPathToUrl()
  const stateManager = useStateManager()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { copyToClipboard } = useCopyToClipboard()
  const { createLink, createProjectLink } = useAppLink()
  const { lastSeenMap } = useLastSeenIssues()

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    issue: Issue
  } | null>(null)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)

  // TanStack Table state - persisted per-project
  const { sorting, setSorting, columnFilters, setColumnFilters } =
    useIssueTableSettings()

  // Convert config states to MultiSelect options format
  const statusOptions: MultiSelectOption[] = useMemo(
    () =>
      stateManager.getStateOptions().map(opt => ({
        value: opt.value,
        label: opt.label,
      })),
    [stateManager]
  )

  const columns = useMemo(
    () => [
      columnHelper.accessor('displayNumber', {
        header: '#',
        cell: info => {
          const issueId = info.row.original.issueNumber
          const meta = info.table.options.meta as {
            copyToClipboard: (text: string, label?: string) => Promise<boolean>
          }
          return (
            <button
              type="button"
              className="issue-number-copy-btn"
              onClick={e => {
                e.stopPropagation()
                meta?.copyToClipboard(issueId, `issue #${info.getValue()}`)
              }}
              title="Click to copy UUID"
            >
              #{info.getValue()}
            </button>
          )
        },
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as number
          return String(value).includes(filterValue)
        },
      }),
      columnHelper.accessor('title', {
        header: 'Title',
        cell: info => {
          const meta = info.table.options.meta as {
            createLink: (path: string) => RouteLiteral
          }
          return (
            <Link
              href={meta.createLink(`/issues/${info.row.original.issueNumber}`)}
              className="issue-title-link"
            >
              {info.getValue()}
            </Link>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString',
      }),
      columnHelper.accessor(row => row.metadata?.status || 'unknown', {
        id: 'status',
        header: 'Status',
        cell: info => {
          const status = info.getValue()
          return (
            <span
              className={`status-badge ${stateManager.getStateClass(status)}`}
            >
              {status}
            </span>
          )
        },
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue) => {
          const status = row.getValue(columnId) as string
          // Multi-select filter: show if status is in selected values
          const selectedValues = filterValue as string[]
          if (!selectedValues || selectedValues.length === 0) {
            return true // Show all when nothing selected
          }
          return selectedValues.includes(status)
        },
      }),
      columnHelper.accessor(row => row.metadata?.priorityLabel || 'unknown', {
        id: 'priority',
        header: 'Priority',
        cell: info => {
          const priority = info.getValue()
          return (
            <span className={`priority-badge ${getPriorityClass(priority)}`}>
              {priority}
            </span>
          )
        },
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue) => {
          const priority = (row.getValue(columnId) as string).toLowerCase()
          // Multi-select filter: show if priority is in selected values
          const selectedValues = filterValue as string[]
          if (!selectedValues || selectedValues.length === 0) {
            return true // Show all when nothing selected
          }
          return selectedValues.includes(priority)
        },
        sortingFn: (rowA, rowB) => {
          const priorityOrder: Record<string, number> = {
            high: 1,
            critical: 1,
            p1: 1,
            medium: 2,
            normal: 2,
            p2: 2,
            low: 3,
            p3: 3,
            unknown: 4,
          }
          const a = (rowA.getValue('priority') as string).toLowerCase()
          const b = (rowB.getValue('priority') as string).toLowerCase()
          return (priorityOrder[a] || 4) - (priorityOrder[b] || 4)
        },
      }),
      columnHelper.accessor(row => row.metadata?.createdAt || '', {
        id: 'createdAt',
        header: 'Created',
        cell: info => {
          const date = info.getValue()
          return (
            <span className="issue-date-text">
              {date ? new Date(date).toLocaleDateString() : '-'}
            </span>
          )
        },
        enableColumnFilter: false,
        sortingFn: (rowA, rowB) => {
          const a = rowA.getValue('createdAt') as string
          const b = rowB.getValue('createdAt') as string
          if (!a && !b) return 0
          if (!a) return 1
          if (!b) return -1
          return new Date(a).getTime() - new Date(b).getTime()
        },
      }),
      columnHelper.accessor(row => lastSeenMap[row.id] || 0, {
        id: 'lastSeen',
        header: 'Last Seen',
        cell: info => {
          const timestamp = info.getValue()
          if (!timestamp) {
            return <span className="issue-not-seen">Never</span>
          }
          return (
            <span className="issue-date-text">
              {new Date(timestamp).toLocaleDateString()}
            </span>
          )
        },
        enableColumnFilter: false,
        sortingFn: (rowA, rowB) => {
          const a = rowA.getValue('lastSeen') as number
          const b = rowB.getValue('lastSeen') as number
          // Never-seen issues (0) sort to bottom
          if (a === 0 && b === 0) return 0
          if (a === 0) return 1
          if (b === 0) return -1
          return a - b
        },
      }),
    ],
    [lastSeenMap, stateManager]
  )

  const table = useReactTable({
    data: issues,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      copyToClipboard,
      createLink,
    },
  })

  const fetchIssues = useCallback(async () => {
    if (!projectPath.trim() || isInitialized !== true) return

    setLoading(true)
    setError(null)

    try {
      const request = create(ListIssuesRequestSchema, {
        projectPath: projectPath.trim(),
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
  }, [projectPath, isInitialized])

  useEffect(() => {
    if (isInitialized === true) {
      fetchIssues()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, projectPath])

  const handleContextMenu = useCallback((e: React.MouseEvent, issue: Issue) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, issue })
  }, [])

  const handleMoveIssue = useCallback((issue: Issue) => {
    setSelectedIssue(issue)
    setShowMoveModal(true)
    setContextMenu(null)
  }, [])

  const handleDuplicateIssue = useCallback((issue: Issue) => {
    setSelectedIssue(issue)
    setShowDuplicateModal(true)
    setContextMenu(null)
  }, [])

  const handleMoved = useCallback(
    async (targetProjectPath: string) => {
      // Resolve path to org/project for URL navigation
      const result = await resolvePathToUrl(targetProjectPath)
      if (result) {
        const url = createProjectLink(
          result.orgSlug,
          result.projectName,
          'issues'
        )
        router.push(url)
      } else {
        // Fallback to root if resolution fails
        router.push('/')
      }
    },
    [resolvePathToUrl, createProjectLink, router]
  )

  const handleDuplicated = useCallback(
    async (newIssueId: string, targetProjectPath: string) => {
      if (targetProjectPath === projectPath) {
        // Same project - refresh and navigate to new issue
        fetchIssues()
        router.push(createLink(`/issues/${newIssueId}`))
      } else {
        // Different project - resolve and redirect
        const result = await resolvePathToUrl(targetProjectPath)
        if (result) {
          const url = createProjectLink(
            result.orgSlug,
            result.projectName,
            `issues/${newIssueId}`
          )
          router.push(url)
        } else {
          router.push('/')
        }
      }
      setShowDuplicateModal(false)
      setSelectedIssue(null)
    },
    [
      projectPath,
      router,
      fetchIssues,
      createLink,
      resolvePathToUrl,
      createProjectLink,
    ]
  )

  const contextMenuItems: ContextMenuItem[] = contextMenu
    ? [
        {
          label: 'View',
          onClick: () => {
            router.push(createLink(`/issues/${contextMenu.issue.id}`))
            setContextMenu(null)
          },
        },
        {
          label: 'Move',
          onClick: () => handleMoveIssue(contextMenu.issue),
        },
        {
          label: 'Duplicate',
          onClick: () => handleDuplicateIssue(contextMenu.issue),
        },
      ]
    : []

  return (
    <div className="issues-list">
      <div className="issues-header">
        <h2>Issues</h2>
        <div className="header-actions">
          {projectPath && isInitialized === true && (
            <>
              <button
                onClick={() => setShowWorkspaceModal(true)}
                className="workspace-btn"
              >
                + New Workspace
              </button>
              <button
                onClick={fetchIssues}
                disabled={loading}
                className="refresh-btn"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </>
          )}
          <Link href={createLink('/issues/new')} className="create-btn">
            + New Issue
          </Link>
        </div>
      </div>

      {!projectPath && (
        <div className="no-project-message">
          <p>Select a project from the header to view issues</p>
        </div>
      )}

      {projectPath && isInitialized === false && (
        <div className="not-initialized-message">
          <p>Centy is not initialized in this directory</p>
          <Link href={createLink('/')}>Initialize Project</Link>
        </div>
      )}

      {projectPath && isInitialized === true && (
        <>
          {error && <div className="error-message">{error}</div>}

          {loading && issues.length === 0 ? (
            <div className="loading">Loading issues...</div>
          ) : issues.length === 0 ? (
            <div className="empty-state">
              <p>No issues found</p>
              <Link href={createLink('/issues/new')}>
                Create your first issue
              </Link>
            </div>
          ) : (
            <div className="issues-table">
              <table>
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id}>
                          <div className="th-content">
                            <button
                              type="button"
                              className={`sort-btn ${header.column.getIsSorted() ? 'sorted' : ''}`}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              <span className="sort-indicator">
                                {{
                                  asc: ' \u25B2',
                                  desc: ' \u25BC',
                                }[header.column.getIsSorted() as string] ?? ''}
                              </span>
                            </button>
                            {header.column.getCanFilter() &&
                              (header.column.id === 'status' ? (
                                <MultiSelect
                                  options={statusOptions}
                                  value={
                                    (header.column.getFilterValue() as string[]) ??
                                    []
                                  }
                                  onChange={values =>
                                    header.column.setFilterValue(
                                      values.length > 0 ? values : undefined
                                    )
                                  }
                                  placeholder="All"
                                  className="column-filter-multi"
                                />
                              ) : header.column.id === 'priority' ? (
                                <MultiSelect
                                  options={PRIORITY_OPTIONS}
                                  value={
                                    (header.column.getFilterValue() as string[]) ??
                                    []
                                  }
                                  onChange={values =>
                                    header.column.setFilterValue(
                                      values.length > 0 ? values : undefined
                                    )
                                  }
                                  placeholder="All"
                                  className="column-filter-multi"
                                />
                              ) : (
                                <input
                                  type="text"
                                  className="column-filter"
                                  placeholder="Filter..."
                                  value={
                                    (header.column.getFilterValue() as string) ??
                                    ''
                                  }
                                  onChange={e =>
                                    header.column.setFilterValue(e.target.value)
                                  }
                                />
                              ))}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr
                      key={row.original.issueNumber}
                      onContextMenu={e => handleContextMenu(e, row.original)}
                      className="context-menu-row"
                    >
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          className={
                            cell.column.id === 'displayNumber'
                              ? 'issue-number'
                              : cell.column.id === 'title'
                                ? 'issue-title'
                                : cell.column.id === 'createdAt'
                                  ? 'issue-date'
                                  : ''
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {contextMenu && (
        <ContextMenu
          items={contextMenuItems}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}

      {showMoveModal && selectedIssue && (
        <MoveModal
          entityType="issue"
          entityId={selectedIssue.id}
          entityTitle={selectedIssue.title}
          currentProjectPath={projectPath}
          onClose={() => {
            setShowMoveModal(false)
            setSelectedIssue(null)
          }}
          onMoved={handleMoved}
        />
      )}

      {showDuplicateModal && selectedIssue && (
        <DuplicateModal
          entityType="issue"
          entityId={selectedIssue.id}
          entityTitle={selectedIssue.title}
          currentProjectPath={projectPath}
          onClose={() => {
            setShowDuplicateModal(false)
            setSelectedIssue(null)
          }}
          onDuplicated={handleDuplicated}
        />
      )}

      {showWorkspaceModal && (
        <StandaloneWorkspaceModal
          projectPath={projectPath}
          onClose={() => setShowWorkspaceModal(false)}
        />
      )}
    </div>
  )
}
