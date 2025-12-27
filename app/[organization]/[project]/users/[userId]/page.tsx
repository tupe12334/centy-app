import { UserDetail } from '@/components/users/UserDetail'

export async function generateStaticParams() {
  return [
    {
      organization: '_placeholder',
      project: '_placeholder',
      userId: '_placeholder',
    },
  ]
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  return <UserDetail userId={userId} />
}
