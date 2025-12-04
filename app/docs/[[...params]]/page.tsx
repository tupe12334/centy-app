import { DocsPageClient } from './DocsPageClient'

export async function generateStaticParams() {
  return [{ params: undefined }]
}

export default function Page() {
  return <DocsPageClient />
}
