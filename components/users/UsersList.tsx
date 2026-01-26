'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { route, type RouteLiteral } from 'nextjs-routes'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  ListUsersRequestSchema,
  DeleteUserRequestSchema,
  IsInitializedRequestSchema,
  type User,
} from '@/gen/centy_pb'
import { useProject } from '@/components/providers/ProjectProvider'
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
import { SyncUsersModal } from './SyncUsersModal'

const columnHelper = createColumnHelper<User>()

export function UsersList() {
  const router = useRouter()
  const params = useParams()
  const { projectPath, isInitialized, setIsInitialized } = useProject()

  const projectContext = useMemo(() => {
    const org = params?.organization as string | undefined
    const project = params?.project as string | undefined
    if (org && project) return { organization: org, project }
    return null
  }, [params])

  // Helper to create user detail route
  const getUserRoute = useCallback(
    (userId: string): RouteLiteral | '/' => {
      if (projectContext) {
        return route({
          pathname: '/[organization]/[project]/users/[userId]',
          query: { ...projectContext, userId },
        })
      }
      return '/'
    },
    [projectContext]
  )

  // Helper for new user route
  const newUserRoute: RouteLiteral | '/' = useMemo(() => {
    if (projectContext) {
      return route({
        pathname: '/[organization]/[project]/users/new',
        query: projectContext,
      })
    }
    return '/'
  }, [projectContext])

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  )
  const [showSyncModal, setShowSyncModal] = useState(false)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    user: User
  } | null>(null)

  // TanStack Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: info => {
          const meta = info.table.options.meta as {
            getUserRoute: (userId: string) => RouteLiteral | '/'
          }
          return (
            <Link
              href={meta.getUserRoute(info.row.original.id)}
              className="user-name-link"
            >
              {info.getValue()}
            </Link>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString',
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: info => info.getValue() || '-',
        enableColumnFilter: true,
        filterFn: 'includesString',
      }),
      columnHelper.accessor('gitUsernames', {
        header: 'Git Usernames',
        cell: info => {
          const usernames = info.getValue()
          return usernames.length > 0 ? usernames.join(', ') : '-'
        },
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue) => {
          const usernames = row.getValue(columnId) as string[]
          return usernames.some(u =>
            u.toLowerCase().includes(filterValue.toLowerCase())
          )
        },
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
    data: users,
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
      getUserRoute,
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

  const fetchUsers = useCallback(async () => {
    if (!projectPath.trim() || isInitialized !== true) return

    setLoading(true)
    setError(null)

    try {
      const request = create(ListUsersRequestSchema, {
        projectPath: projectPath.trim(),
      })
      const response = await centyClient.listUsers(request)
      setUsers(response.users)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      // Check if this is an unimplemented API error
      if (message.includes('unimplemented')) {
        setError(
          'User management is not yet available. Please update your daemon to the latest version.'
        )
      } else {
        setError(message)
      }
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
      fetchUsers()
    }
  }, [isInitialized, fetchUsers])

  const handleDelete = useCallback(
    async (userId: string) => {
      if (!projectPath) return

      setDeleting(true)
      setError(null)

      try {
        const request = create(DeleteUserRequestSchema, {
          projectPath,
          userId,
        })
        const response = await centyClient.deleteUser(request)

        if (response.success) {
          setUsers(prev => prev.filter(u => u.id !== userId))
          setShowDeleteConfirm(null)
        } else {
          setError(response.error || 'Failed to delete user')
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to connect to daemon'
        )
      } finally {
        setDeleting(false)
      }
    },
    [projectPath]
  )

  const handleContextMenu = useCallback((e: React.MouseEvent, user: User) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, user })
  }, [])

  const handleSynced = useCallback(
    (createdCount: number) => {
      if (createdCount > 0) {
        fetchUsers()
      }
      setShowSyncModal(false)
    },
    [fetchUsers]
  )

  const contextMenuItems: ContextMenuItem[] = contextMenu
    ? [
        {
          label: 'View',
          onClick: () => {
            router.push(getUserRoute(contextMenu.user.id))
            setContextMenu(null)
          },
        },
        {
          label: 'Edit',
          onClick: () => {
            router.push(getUserRoute(contextMenu.user.id))
            setContextMenu(null)
          },
        },
        {
          label: 'Delete',
          onClick: () => {
            setShowDeleteConfirm(contextMenu.user.id)
            setContextMenu(null)
          },
          danger: true,
        },
      ]
    : []

  return (
    <div className="users-list">
      <div className="users-header">
        <h2>Users</h2>
        <div className="header-actions">
          {projectPath && isInitialized === true && (
            <>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="refresh-btn"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={() => setShowSyncModal(true)}
                className="sync-btn"
              >
                Sync from Git
              </button>
            </>
          )}
          <Link href={newUserRoute} className="create-btn">
            + New User
          </Link>
        </div>
      </div>

      {!projectPath && (
        <div className="no-project-message">
          <p>Select a project from the header to view users</p>
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

          {showDeleteConfirm && (
            <div className="delete-confirm">
              <p>Are you sure you want to delete this user?</p>
              <div className="delete-confirm-actions">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
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

          {loading && users.length === 0 ? (
            <div className="loading">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <p>No users found</p>
              <p>
                <Link href={newUserRoute}>Create your first user</Link> or{' '}
                <button
                  onClick={() => setShowSyncModal(true)}
                  className="sync-link-btn"
                >
                  sync from git history
                </button>
              </p>
            </div>
          ) : (
            <div className="users-table">
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
                                  (header.column.getFilterValue() as string) ??
                                  ''
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
                      key={row.original.id}
                      onContextMenu={e => handleContextMenu(e, row.original)}
                      className="context-menu-row"
                    >
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          className={
                            cell.column.id === 'name'
                              ? 'user-name'
                              : cell.column.id === 'email'
                                ? 'user-email'
                                : cell.column.id === 'createdAt'
                                  ? 'user-date'
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

      {showSyncModal && (
        <SyncUsersModal
          onClose={() => setShowSyncModal(false)}
          onSynced={handleSynced}
        />
      )}
    </div>
  )
}
