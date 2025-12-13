'use client'

import { Suspense, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { ThemeProvider } from './ThemeProvider'
import { DaemonStatusProvider } from './DaemonStatusProvider'
import { OrganizationProvider } from './OrganizationProvider'
import { ProjectProvider } from './ProjectProvider'

function ProvidersWithSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <OrganizationProvider>
        <ProjectProvider>{children}</ProjectProvider>
      </OrganizationProvider>
    </Suspense>
  )
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <DaemonStatusProvider>
        <ProvidersWithSuspense>
          <Toaster position="bottom-right" richColors theme="system" />
          {children}
        </ProvidersWithSuspense>
      </DaemonStatusProvider>
    </ThemeProvider>
  )
}
