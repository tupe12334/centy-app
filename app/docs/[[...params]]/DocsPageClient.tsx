'use client'

import { useParams } from 'next/navigation'
import { DocsList } from '@/components/docs/DocsList'
import { DocDetail } from '@/components/docs/DocDetail'

export function DocsPageClient() {
  const params = useParams()
  const slug = params.params?.[0] as string | undefined

  if (slug) {
    return <DocDetail slug={slug} />
  }

  return <DocsList />
}
