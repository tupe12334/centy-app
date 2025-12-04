'use client'

import { useParams } from 'next/navigation'
import { IssuesList } from '@/components/issues/IssuesList'
import { IssueDetail } from '@/components/issues/IssueDetail'

export function IssuesPageClient() {
  const params = useParams()
  const issueNumber = params.params?.[0] as string | undefined

  if (issueNumber) {
    return <IssueDetail issueNumber={issueNumber} />
  }

  return <IssuesList />
}
