import { PRsPageClient } from './PRsPageClient'

export async function generateStaticParams() {
  return [{ params: undefined }]
}

export default function Page() {
  return <PRsPageClient />
}
