'use client'

import Link from 'next/link'

export default function AggregatePRsPage() {
  return (
    <div className="prs-list">
      <div className="prs-header">
        <h2>All Pull Requests</h2>
      </div>

      <div className="aggregate-placeholder">
        <p>
          Aggregate view for pull requests across all projects is coming soon.
        </p>
        <p>
          Please <Link href="/">select a project</Link> to view its pull
          requests.
        </p>
      </div>
    </div>
  )
}
