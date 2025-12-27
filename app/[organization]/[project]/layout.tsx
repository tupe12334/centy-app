'use client'

import { PathContextProvider } from '@/components/providers/PathContextProvider'

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PathContextProvider>{children}</PathContextProvider>
}
