'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import { ListIssuesRequestSchema, type Issue } from '@/gen/centy_pb'
import { getProjects } from '@/lib/project-resolver'
import { useAppLink } from '@/hooks/useAppLink'
import { useStateManager } from '@/lib/state'
import { useOrganization } from '@/components/providers/OrganizationProvider'
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

const PRIORITY_OPTIONS: MultiSelectOption[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

interface AggregateIssue extends Issue {
  projectName: string
  orgSlug: string | null
  projectPath: string
}

const columnHelper = createColumnHelper<AggregateIssue>()

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

export function AggregateIssuesList() {
  const stateManager = useStateManager()
  const { createProjectLink } = useAppLink()
  const { selectedOrgSlug, organizations } = useOrganization()
  const [issues, setIssues] = useState<AggregateIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([
    { id: 'createdAt', desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<
    { id: string; value: unknown }[]
  >([])

  // Filter issues based on selected organization
  const filteredIssues = useMemo(() => {
    if (selectedOrgSlug === null) {
      // Show all issues
      return issues
    }
    if (selectedOrgSlug === '') {
      // Show only ungrouped projects (projects with no organization)
      return issues.filter(issue => !issue.orgSlug)
    }
    // Show issues from the selected organization
    return issues.filter(issue => issue.orgSlug === selectedOrgSlug)
  }, [issues, selectedOrgSlug])

  // Get display name for the current organization filter
  const getOrgDisplayName = () => {
    if (selectedOrgSlug === null) return 'All Issues'
    if (selectedOrgSlug === '') return 'Ungrouped Issues'
    const org = organizations.find(o => o.slug === selectedOrgSlug)
    return org?.name ? `${org.name} Issues` : `${selectedOrgSlug} Issues`
  }

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
      columnHelper.accessor('projectName', {
        header: 'Project',
        cell: info => {
          const issue = info.row.original
          return (
            <Link
              href={createProjectLink(
                issue.orgSlug,
                issue.projectName,
                'issues'
              )}
              className="project-link"
            >
              {info.getValue()}
            </Link>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString',
      }),
      columnHelper.accessor('displayNumber', {
        header: '#',
        cell: info => `#${info.getValue()}`,
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as number
          return String(value).includes(filterValue)
        },
      }),
      columnHelper.accessor('title', {
        header: 'Title',
        cell: info => {
          const issue = info.row.original
          return (
            <Link
              href={createProjectLink(
                issue.orgSlug,
                issue.projectName,
                `issues/${issue.issueNumber}`
              )}
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
    ],
    [stateManager, createProjectLink]
  )

  const table = useReactTable({
    data: filteredIssues,
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
  })

  const fetchAllIssues = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Get all initialized projects
      const projects = await getProjects()
      const initializedProjects = projects.filter(p => p.initialized)

      // Fetch issues from each project in parallel
      const issuePromises = initializedProjects.map(async project => {
        try {
          const request = create(ListIssuesRequestSchema, {
            projectPath: project.path,
          })
          const response = await centyClient.listIssues(request)
          return response.issues.map(issue => ({
            ...issue,
            projectName: project.name,
            orgSlug: project.organizationSlug || null,
            projectPath: project.path,
          }))
        } catch {
          // Skip projects that fail to load
          console.warn(`Failed to fetch issues from ${project.name}`)
          return []
        }
      })

      const issueArrays = await Promise.all(issuePromises)
      const allIssues = issueArrays.flat()

      setIssues(allIssues)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issues')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllIssues()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="issues-list">
      <div className="issues-header">
        <h2>{getOrgDisplayName()}</h2>
        <div className="header-actions">
          <button
            onClick={fetchAllIssues}
            disabled={loading}
            className="refresh-btn"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <p className="aggregate-note">
        {selectedOrgSlug === null
          ? 'Showing issues from all projects. Select a project to create new issues.'
          : selectedOrgSlug === ''
            ? 'Showing issues from ungrouped projects. Select a project to create new issues.'
            : `Showing issues from ${organizations.find(o => o.slug === selectedOrgSlug)?.name || selectedOrgSlug} organization. Select a project to create new issues.`}
      </p>

      {error && <div className="error-message">{error}</div>}

      {loading && filteredIssues.length === 0 ? (
        <div className="loading">Loading issues...</div>
      ) : filteredIssues.length === 0 ? (
        <div className="empty-state">
          <p>
            {selectedOrgSlug === null
              ? 'No issues found across any projects'
              : selectedOrgSlug === ''
                ? 'No issues found in ungrouped projects'
                : `No issues found in ${organizations.find(o => o.slug === selectedOrgSlug)?.name || selectedOrgSlug} organization`}
          </p>
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
                                (header.column.getFilterValue() as string) ?? ''
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
                  key={`${row.original.projectPath}-${row.original.issueNumber}`}
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
                              : cell.column.id === 'projectName'
                                ? 'project-name'
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
    </div>
  )
}
