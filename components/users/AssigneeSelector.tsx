'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import { ListUsersRequestSchema, type User } from '@/gen/centy_pb'
import {
  MultiSelect,
  type MultiSelectOption,
} from '@/components/shared/MultiSelect'

interface AssigneeSelectorProps {
  projectPath: string
  issueId: string
  currentAssignees: string[]
  onAssigneesChange: (assignees: string[]) => void
  disabled?: boolean
}

export function AssigneeSelector({
  projectPath,
  currentAssignees,
}: AssigneeSelectorProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    if (!projectPath) return

    setLoading(true)
    setError(null)

    try {
      const request = create(ListUsersRequestSchema, {
        projectPath,
      })
      const response = await centyClient.listUsers(request)
      setUsers(response.users)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load users'
      if (message.includes('unimplemented')) {
        setError('User management not available')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }, [projectPath])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const options: MultiSelectOption[] = useMemo(
    () =>
      users.map(user => ({
        value: user.id,
        label: user.name,
      })),
    [users]
  )

  const handleChange = useCallback(async () => {
    // TODO: Implement AssignIssue and UnassignIssue RPCs in the daemon
    setError('Assignee modification not yet implemented')
  }, [])

  if (loading) {
    return (
      <div className="assignee-selector loading">
        <span className="loading-text">Loading users...</span>
      </div>
    )
  }

  if (error) {
    const isUnimplemented =
      error.includes('not available') || error.includes('not yet implemented')
    return (
      <div className="assignee-selector error">
        <span className="error-text">{error}</span>
        {!isUnimplemented && (
          <button onClick={fetchUsers} className="retry-btn">
            Retry
          </button>
        )}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="assignee-selector empty">
        <span className="empty-text">No users in project</span>
      </div>
    )
  }

  return (
    <div className="assignee-selector">
      <MultiSelect
        options={options}
        value={currentAssignees}
        onChange={handleChange}
        placeholder="Unassigned"
        className="assignee-multi-select"
      />
    </div>
  )
}
