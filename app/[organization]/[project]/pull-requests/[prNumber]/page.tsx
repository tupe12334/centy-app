import { PRDetail } from '@/components/pull-requests/PRDetail'

export async function generateStaticParams() {
  return [
    {
      organization: '_placeholder',
      project: '_placeholder',
      prNumber: '_placeholder',
    },
  ]
}

export default async function PRDetailPage({
  params,
}: {
  params: Promise<{ prNumber: string }>
}) {
  const { prNumber } = await params
  return <PRDetail prNumber={prNumber} />
}
