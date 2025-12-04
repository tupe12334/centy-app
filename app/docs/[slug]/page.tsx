import { DocDetailPage } from './DocDetailPage'

export async function generateStaticParams() {
  return [{ slug: '_' }]
}

export default function Page() {
  return <DocDetailPage />
}
