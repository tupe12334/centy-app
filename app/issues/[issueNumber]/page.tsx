import { IssueDetailPage } from './IssueDetailPage'

export async function generateStaticParams() {
  return [{ issueNumber: '_' }]
}

export default function Page() {
  return <IssueDetailPage />
}
