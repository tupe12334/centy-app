import { IssuesPageClient } from './IssuesPageClient'

export async function generateStaticParams() {
  return [{ params: undefined }]
}

export default function Page() {
  return <IssuesPageClient />
}
