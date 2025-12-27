'use client'

import { useParams } from 'next/navigation'
import { DocDetail } from '@/components/docs/DocDetail'

export default function DocDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  return <DocDetail slug={slug} />
}
