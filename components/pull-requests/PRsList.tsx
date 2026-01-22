'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { Route } from 'next'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  ListPrsRequestSchema,
  IsInitializedRequestSchema,
  type PullRequest,
} from '@/gen/centy_pb'
import { useProject } from '@/components/providers/ProjectProvider'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import {
  MultiSelect,
  type MultiSelectOption,
} from '@/components/shared/MultiSelect'
import '@/styles/pages/PRsList.css'

const STATUS_OPTIONS: MultiSelectOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'merged', label: 'Merged' },
  { value: 'closed', label: 'Closed' },
]

const PRIORITY_OPTIONS: MultiSelectOption[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const columnHelper = createColumnHelper<PullRequest>()

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
      if (priorityLabel.startsWith('P') || priorityLabel.startsWith('p')) {
        const num = parseInt(priorityLabel.slice(1))
        if (num === 1) return 'priority-high'
        if (num === 2) return 'priority-medium'
        return 'priority-low'
      }
      return ''
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'draft':
      return 'status-draft'
    case 'open':
      return 'status-open'
    case 'merged':
      return 'status-merged'
    case 'closed':
      return 'status-closed'
    default:
      return ''
  }
}

export function PRsList() {
  const params = useParams()
  const { projectPath, isInitialized, setIsInitialized } = useProject()
  const [prs, setPrs] = useState<PullRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { copyToClipboard } = useCopyToClipboard()

  // Get the project-scoped PR URL
  const prBaseUrl = useMemo(() => {
    const org = params.organization as string | undefined
    const project = params.project as string | undefined
    if (org && project) {
      return `/${org}/${project}/pull-requests`
    }
    return '/'
  }, [params])

  // TanStack Table state - default sort by createdAt descending (newest first)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: 'status', value: ['draft', 'open'] },
  ])

  const columns = useMemo(
    () => [
      columnHelper.accessor('displayNumber', {
        header: '#',
        cell: info => {
          const prId = info.row.original.id
          const meta = info.table.options.meta as {
            copyToClipboard: (text: string, label?: string) => Promise<boolean>
          }
          return (
            <button
              type="button"
              className="pr-number-copy-btn"
              onClick={e => {
                e.stopPropagation()
                meta?.copyToClipboard(prId, `PR #${info.getValue()}`)
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
        cell: info => (
          <Link
            href={`/pull-requests/${info.row.original.id}`}
            className="pr-title-link"
          >
            {info.getValue()}
          </Link>
        ),
        enableColumnFilter: true,
        filterFn: 'includesString',
      }),
      columnHelper.accessor(row => row.metadata?.status || 'unknown', {
        id: 'status',
        header: 'Status',
        cell: info => {
          const status = info.getValue()
          return (
            <span className={`status-badge ${getStatusClass(status)}`}>
              {status}
            </span>
          )
        },
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue) => {
          const status = row.getValue(columnId) as string
          const selectedValues = filterValue as string[]
          if (!selectedValues || selectedValues.length === 0) {
            return true
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
          const selectedValues = filterValue as string[]
          if (!selectedValues || selectedValues.length === 0) {
            return true
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
      columnHelper.accessor(row => row.metadata?.sourceBranch || '', {
        id: 'sourceBranch',
        header: 'Source',
        cell: info => (
          <span className="branch-name">{info.getValue() || '-'}</span>
        ),
        enableColumnFilter: true,
        filterFn: 'includesString',
      }),
      columnHelper.accessor(row => row.metadata?.targetBranch || '', {
        id: 'targetBranch',
        header: 'Target',
        cell: info => (
          <span className="branch-name">{info.getValue() || '-'}</span>
        ),
        enableColumnFilter: true,
        filterFn: 'includesString',
      }),
      columnHelper.accessor(row => row.metadata?.createdAt || '', {
        id: 'createdAt',
        header: 'Created',
        cell: info => {
          const date = info.getValue()
          return (
            <span className="pr-date-text">
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
    ],
    []
  )

  const table = useReactTable({
    data: prs,
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
    },
  })

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

  const fetchPrs = useCallback(async () => {
    if (!projectPath.trim() || isInitialized !== true) return

    setLoading(true)
    setError(null)

    try {
      const request = create(ListPrsRequestSchema, {
        projectPath: projectPath.trim(),
      })
      const response = await centyClient.listPrs(request)
      setPrs(response.prs)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setLoading(false)
    }
  }, [projectPath, isInitialized])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkInitialized(projectPath)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [projectPath, checkInitialized])

  useEffect(() => {
    if (isInitialized === true) {
      fetchPrs()
    }
  }, [isInitialized, fetchPrs])

  return (
    <div className="prs-list">
      <div className="prs-header">
        <h2>Pull Requests</h2>
        <div className="header-actions">
          {projectPath && isInitialized === true && (
            <button
              onClick={fetchPrs}
              disabled={loading}
              className="refresh-btn"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          )}
          <Link href={`${prBaseUrl}/new` as Route} className="create-btn">
            + New PR
          </Link>
        </div>
      </div>

      {!projectPath && (
        <div className="no-project-message">
          <p>Select a project from the header to view pull requests</p>
        </div>
      )}

      {projectPath && isInitialized === false && (
        <div className="not-initialized-message">
          <p>Centy is not initialized in this directory</p>
          <Link href="/">Initialize Project</Link>
        </div>
      )}

      {projectPath && isInitialized === true && (
        <>
          {error && <div className="error-message">{error}</div>}

          {loading && prs.length === 0 ? (
            <div className="loading">Loading pull requests...</div>
          ) : prs.length === 0 ? (
            <div className="empty-state">
              <p>No pull requests found</p>
              <Link href={`${prBaseUrl}/new` as Route}>Create your first PR</Link>
            </div>
          ) : (
            <div className="prs-table">
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
                                  options={STATUS_OPTIONS}
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
                    <tr key={row.original.id}>
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          className={
                            cell.column.id === 'displayNumber'
                              ? 'pr-number'
                              : cell.column.id === 'title'
                                ? 'pr-title'
                                : cell.column.id === 'createdAt'
                                  ? 'pr-date'
                                  : cell.column.id === 'sourceBranch' ||
                                      cell.column.id === 'targetBranch'
                                    ? 'pr-branch'
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
    </div>
  )
}
