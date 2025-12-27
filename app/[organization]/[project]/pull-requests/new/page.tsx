import { CreatePR } from '@/components/pull-requests/CreatePR'

export async function generateStaticParams() {
  return [{ organization: '_placeholder', project: '_placeholder' }]
}

export default function NewPRPage() {
  return <CreatePR />
}
