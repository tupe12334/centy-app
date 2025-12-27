import { CreateIssue } from '@/components/issues/CreateIssue'

export async function generateStaticParams() {
  return [{ organization: '_placeholder', project: '_placeholder' }]
}

export default function NewIssuePage() {
  return <CreateIssue />
}
