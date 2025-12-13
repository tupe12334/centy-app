'use client'

import { useParams, usePathname } from 'next/navigation'
import { OrganizationsList } from '@/components/organizations/OrganizationsList'
import { OrganizationDetail } from '@/components/organizations/OrganizationDetail'

export function OrganizationsPageClient() {
  const params = useParams()
  const pathname = usePathname()

  // Extract org slug from URL path (handles both Next.js params and direct URL access)
  const pathParts = pathname.split('/').filter(Boolean)
  const orgSlug =
    (params.params?.[0] as string | undefined) ||
    (pathParts[0] === 'organizations' && pathParts[1]
      ? pathParts[1]
      : undefined)

  if (orgSlug) {
    return <OrganizationDetail orgSlug={orgSlug} />
  }

  return <OrganizationsList />
}
