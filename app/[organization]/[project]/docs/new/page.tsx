import { CreateDoc } from '@/components/docs/CreateDoc'

export async function generateStaticParams() {
  return [{ organization: '_placeholder', project: '_placeholder' }]
}

export default function NewDocPage() {
  return <CreateDoc />
}
