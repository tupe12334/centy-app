'use client'

import { useParams } from 'next/navigation'
import { PRDetail } from '@/components/pull-requests/PRDetail'

export default function PRDetailPage() {
  const params = useParams()
  const prNumber = params.prNumber as string

  return <PRDetail prNumber={prNumber} />
}
