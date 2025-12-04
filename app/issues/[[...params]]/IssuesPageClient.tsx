'use client'

import { useParams, usePathname } from 'next/navigation'
import { IssuesList } from '@/components/issues/IssuesList'
import { IssueDetail } from '@/components/issues/IssueDetail'

export function IssuesPageClient() {
  const params = useParams()
  const pathname = usePathname()

  // Extract issue number from URL path (handles both Next.js params and direct URL access)
  const pathParts = pathname.split('/').filter(Boolean)
  const issueNumber =
    (params.params?.[0] as string | undefined) ||
    (pathParts[0] === 'issues' && pathParts[1] ? pathParts[1] : undefined)

  if (issueNumber) {
    return <IssueDetail issueNumber={issueNumber} />
  }

  return <IssuesList />
}
