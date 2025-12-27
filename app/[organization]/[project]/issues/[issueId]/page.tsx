import { IssueDetail } from '@/components/issues/IssueDetail'

export async function generateStaticParams() {
  return [
    {
      organization: '_placeholder',
      project: '_placeholder',
      issueId: '_placeholder',
    },
  ]
}

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ issueId: string }>
}) {
  const { issueId } = await params
  return <IssueDetail issueNumber={issueId} />
}
