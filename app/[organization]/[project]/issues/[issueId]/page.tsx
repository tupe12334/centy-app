'use client'

import { useParams } from 'next/navigation'
import { IssueDetail } from '@/components/issues/IssueDetail'

export default function IssueDetailPage() {
  const params = useParams()
  const issueId = params.issueId as string

  return <IssueDetail issueNumber={issueId} />
}
