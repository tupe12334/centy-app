'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { DaemonStatusIndicator } from '@/components/shared/DaemonStatusIndicator'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { OrgSwitcher } from '@/components/organizations/OrgSwitcher'
import { ProjectSelector } from '@/components/project/ProjectSelector'

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setMobileMenuOpen(false)
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [pathname])

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <header className="app-header">
      <div className="header-top">
        <h1>
          <Link href="/">Centy</Link>
        </h1>
        <div className="header-controls">
          <ThemeToggle />
          <DaemonStatusIndicator />
          <OrgSwitcher />
          <ProjectSelector />
        </div>
        <button
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
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
          href="/users"
          className={pathname.startsWith('/users') ? 'active' : ''}
        >
          Users
        </Link>
        <Link
          href="/organizations"
          className={pathname.startsWith('/organizations') ? 'active' : ''}
        >
          Organizations
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

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Menu Drawer */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-controls">
          <ThemeToggle />
          <DaemonStatusIndicator />
        </div>
        <div className="mobile-menu-selectors">
          <OrgSwitcher />
          <ProjectSelector />
        </div>
        <nav className="mobile-menu-nav">
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
          <Link
            href="/assets"
            className={pathname === '/assets' ? 'active' : ''}
          >
            Assets
          </Link>
          <Link
            href="/users"
            className={pathname.startsWith('/users') ? 'active' : ''}
          >
            Users
          </Link>
          <Link
            href="/organizations"
            className={pathname.startsWith('/organizations') ? 'active' : ''}
          >
            Organizations
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
      </div>
    </header>
  )
}
