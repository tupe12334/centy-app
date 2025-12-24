import { AggregateIssuesPageClient } from './AggregateIssuesPageClient'

export async function generateStaticParams() {
  return [{ params: undefined }]
}

export default function AggregateIssuesPage() {
  return <AggregateIssuesPageClient />
}
