'use client'

import { useParams } from 'next/navigation'
import { UserDetail } from '@/components/users/UserDetail'

export default function UserDetailPage() {
  const params = useParams()
  const userId = params.userId as string

  return <UserDetail userId={userId} />
}
