import { IssuesList } from '@/components/issues/IssuesList'

export async function generateStaticParams() {
  return [{ organization: '_placeholder', project: '_placeholder' }]
}

export default function ProjectIssuesPage() {
  return <IssuesList />
}
