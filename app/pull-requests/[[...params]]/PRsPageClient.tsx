'use client'

import { useParams, usePathname } from 'next/navigation'
import { PRsList } from '@/components/pull-requests/PRsList'
import { PRDetail } from '@/components/pull-requests/PRDetail'

export function PRsPageClient() {
  const params = useParams()
  const pathname = usePathname()

  // Extract PR number from URL path (handles both Next.js params and direct URL access)
  const pathParts = pathname.split('/').filter(Boolean)
  const prNumber =
    (params.params?.[0] as string | undefined) ||
    (pathParts[0] === 'pull-requests' && pathParts[1]
      ? pathParts[1]
      : undefined)

  if (prNumber) {
    return <PRDetail prNumber={prNumber} />
  }

  return <PRsList />
}
