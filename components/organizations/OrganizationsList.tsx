'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  ListOrganizationsRequestSchema,
  DeleteOrganizationRequestSchema,
  type Organization,
} from '@/gen/centy_pb'
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
  ContextMenu,
  type ContextMenuItem,
} from '@/components/shared/ContextMenu'

const columnHelper = createColumnHelper<Organization>()

export function OrganizationsList() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  )
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    org: Organization
  } | null>(null)

  // TanStack Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: info => (
          <Link
            href={`/organizations/${info.row.original.slug}`}
            className="org-name-link"
          >
            {info.getValue()}
          </Link>
        ),
        enableColumnFilter: true,
        filterFn: 'includesString',
      }),
      columnHelper.accessor('slug', {
        header: 'Slug',
        cell: info => <code className="org-slug-badge">{info.getValue()}</code>,
        enableColumnFilter: true,
        filterFn: 'includesString',
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: info => {
          const desc = info.getValue()
          if (!desc) return <span className="text-muted">-</span>
          return desc.length > 50 ? `${desc.substring(0, 50)}...` : desc
        },
        enableColumnFilter: true,
        filterFn: 'includesString',
      }),
      columnHelper.accessor('projectCount', {
        header: 'Projects',
        cell: info => (
          <span className="org-project-count">{info.getValue()}</span>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: info => {
          const date = info.getValue()
          return date ? new Date(date).toLocaleDateString() : '-'
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
    data: organizations,
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

  const fetchOrganizations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const request = create(ListOrganizationsRequestSchema, {})
      const response = await centyClient.listOrganizations(request)
      setOrganizations(response.organizations)
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
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  const handleDelete = useCallback(async (slug: string) => {
    setDeleting(true)
    setDeleteError(null)

    try {
      const request = create(DeleteOrganizationRequestSchema, { slug })
      const response = await centyClient.deleteOrganization(request)

      if (response.success) {
        setOrganizations(prev => prev.filter(o => o.slug !== slug))
        setShowDeleteConfirm(null)
      } else {
        setDeleteError(response.error || 'Failed to delete organization')
      }
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setDeleting(false)
    }
  }, [])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, org: Organization) => {
      e.preventDefault()
      setContextMenu({ x: e.clientX, y: e.clientY, org })
    },
    []
  )

  const contextMenuItems: ContextMenuItem[] = contextMenu
    ? [
        {
          label: 'View',
          onClick: () => {
            router.push(`/organizations/${contextMenu.org.slug}` as Route)
            setContextMenu(null)
          },
        },
        {
          label: 'Edit',
          onClick: () => {
            router.push(`/organizations/${contextMenu.org.slug}` as Route)
            setContextMenu(null)
          },
        },
        {
          label: 'Delete',
          onClick: () => {
            setShowDeleteConfirm(contextMenu.org.slug)
            setContextMenu(null)
          },
          danger: true,
        },
      ]
    : []

  return (
    <div className="organizations-list">
      <div className="organizations-header">
        <h2>Organizations</h2>
        <div className="header-actions">
          <button
            onClick={fetchOrganizations}
            disabled={loading}
            className="refresh-btn"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <Link href="/organizations/new" className="create-btn">
            + New Organization
          </Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showDeleteConfirm && (
        <div className="delete-confirm">
          <p>Are you sure you want to delete this organization?</p>
          {deleteError && <p className="delete-error-message">{deleteError}</p>}
          <div className="delete-confirm-actions">
            <button
              onClick={() => {
                setShowDeleteConfirm(null)
                setDeleteError(null)
              }}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(showDeleteConfirm)}
              disabled={deleting}
              className="confirm-delete-btn"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      )}

      {loading && organizations.length === 0 ? (
        <div className="loading">Loading organizations...</div>
      ) : organizations.length === 0 ? (
        <div className="empty-state">
          <p>No organizations found</p>
          <p>
            <Link href="/organizations/new">
              Create your first organization
            </Link>{' '}
            to group your projects
          </p>
        </div>
      ) : (
        <div className="organizations-table">
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
                        {header.column.getCanFilter() && (
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
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr
                  key={row.original.slug}
                  onContextMenu={e => handleContextMenu(e, row.original)}
                  className="context-menu-row"
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className={
                        cell.column.id === 'name'
                          ? 'org-name'
                          : cell.column.id === 'slug'
                            ? 'org-slug'
                            : cell.column.id === 'projectCount'
                              ? 'org-projects'
                              : cell.column.id === 'createdAt'
                                ? 'org-date'
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

      {contextMenu && (
        <ContextMenu
          items={contextMenuItems}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
