import { PRsList } from '@/components/pull-requests/PRsList'

export async function generateStaticParams() {
  return [{ organization: '_placeholder', project: '_placeholder' }]
}

export default function ProjectPRsPage() {
  return <PRsList />
}
