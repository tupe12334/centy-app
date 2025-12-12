'use client'

import { Suspense, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { ThemeProvider } from './ThemeProvider'
import { DaemonStatusProvider } from './DaemonStatusProvider'
import { ProjectProvider } from './ProjectProvider'

function ProjectProviderWithSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ProjectProvider>{children}</ProjectProvider>
    </Suspense>
  )
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <DaemonStatusProvider>
        <ProjectProviderWithSuspense>
          <Toaster position="bottom-right" richColors theme="system" />
          {children}
        </ProjectProviderWithSuspense>
      </DaemonStatusProvider>
    </ThemeProvider>
  )
}
