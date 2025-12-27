'use client'

import { useParams } from 'next/navigation'
import { OrganizationDetail } from '@/components/organizations/OrganizationDetail'

export default function OrganizationDetailPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  return <OrganizationDetail orgSlug={orgSlug} />
}
