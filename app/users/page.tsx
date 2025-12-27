'use client'

import Link from 'next/link'

export default function AggregateUsersPage() {
  return (
    <div className="users-list">
      <div className="users-header">
        <h2>All Users</h2>
      </div>

      <div className="aggregate-placeholder">
        <p>Aggregate view for users across all projects is coming soon.</p>
        <p>
          Please <Link href="/">select a project</Link> to view its users.
        </p>
      </div>
    </div>
  )
}
