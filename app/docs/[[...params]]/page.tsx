import { AggregateDocsPageClient } from './AggregateDocsPageClient'

export async function generateStaticParams() {
  return [{ params: undefined }]
}

export default function AggregateDocsPage() {
  return <AggregateDocsPageClient />
}
