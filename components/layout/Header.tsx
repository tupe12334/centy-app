'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DaemonStatusIndicator } from '@/components/shared/DaemonStatusIndicator'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { ProjectSelector } from '@/components/project/ProjectSelector'

export function Header() {
  const pathname = usePathname()

  return (
    <header className="app-header">
      <div className="header-top">
        <h1>
          <Link href="/">Centy</Link>
        </h1>
        <div className="header-controls">
          <ThemeToggle />
          <DaemonStatusIndicator />
          <ProjectSelector />
        </div>
      </div>
      <p>Local-first issue and documentation tracker</p>
      <nav className="app-nav">
        <Link
          href="/issues"
          className={pathname.startsWith('/issues') ? 'active' : ''}
        >
          Issues
        </Link>
        <Link
          href="/pull-requests"
          className={pathname.startsWith('/pull-requests') ? 'active' : ''}
        >
          Pull Requests
        </Link>
        <Link
          href="/docs"
          className={pathname.startsWith('/docs') ? 'active' : ''}
        >
          Docs
        </Link>
        <Link href="/assets" className={pathname === '/assets' ? 'active' : ''}>
          Assets
        </Link>
        <Link
          href="/project/config"
          className={pathname === '/project/config' ? 'active' : ''}
        >
          Project Config
        </Link>
        <Link
          href="/settings"
          className={pathname === '/settings' ? 'active' : ''}
        >
          Settings
        </Link>
        <a
          href="https://docs.centy.io"
          target="_blank"
          rel="noopener noreferrer"
          className="external-link"
        >
          Docs ↗
        </a>
      </nav>
    </header>
  )
}
