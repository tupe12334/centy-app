import { DocsList } from '@/components/docs/DocsList'

export async function generateStaticParams() {
  return [{ organization: '_placeholder', project: '_placeholder' }]
}

export default function ProjectDocsPage() {
  return <DocsList />
}
