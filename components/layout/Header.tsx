'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { DaemonStatusIndicator } from '@/components/shared/DaemonStatusIndicator'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { OrgSwitcher } from '@/components/organizations/OrgSwitcher'
import { ProjectSelector } from '@/components/project/ProjectSelector'
import { UNGROUPED_ORG_MARKER } from '@/lib/project-resolver'

export function Header() {
  const pathname = usePathname()
  const params = useParams()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Extract org and project from URL path array (catch-all route)
  const pathSegments = params.path as string[] | undefined
  const org = pathSegments?.[0]
  const project = pathSegments?.[1]
  const hasProjectContext = Boolean(org && project)

  // Build navigation links based on context
  const navLinks = useMemo(() => {
    if (hasProjectContext) {
      const base = `/${org}/${project}`
      return {
        issues: `${base}/issues`,
        pullRequests: `${base}/pull-requests`,
        docs: `${base}/docs`,
        assets: `${base}/assets`,
        users: `${base}/users`,
        config: `${base}/config`,
      }
    }
    // Aggregate/root level links
    return {
      issues: '/issues',
      pullRequests: '/pull-requests',
      docs: '/docs',
      assets: '/assets',
      users: '/users',
      config: '/project/config',
    }
  }, [hasProjectContext, org, project])

  // Check if a path is active
  const isActive = (href: string, checkPrefix = true) => {
    if (checkPrefix) {
      // For aggregate views, check if pathname starts with the base path
      // For project views, check if we're on the same page
      if (hasProjectContext) {
        const page = href.split('/').slice(3).join('/')
        const currentPage = pathname.split('/').slice(3).join('/')
        return currentPage.startsWith(page.split('/')[0])
      }
      return pathname.startsWith(href)
    }
    return pathname === href
  }

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

  // Display the current project context
  const contextDisplay = hasProjectContext ? (
    <span className="header-context">
      {org === UNGROUPED_ORG_MARKER ? '' : `${org} / `}
      {project}
    </span>
  ) : null

  return (
    <header className="app-header">
      <div className="header-top">
        <h1>
          <Link href="/">Centy</Link>
          {contextDisplay}
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
          href={navLinks.issues}
          className={isActive(navLinks.issues) ? 'active' : ''}
        >
          Issues
        </Link>
        <Link
          href={navLinks.pullRequests}
          className={isActive(navLinks.pullRequests) ? 'active' : ''}
        >
          Pull Requests
        </Link>
        <Link
          href={navLinks.docs}
          className={isActive(navLinks.docs) ? 'active' : ''}
        >
          Docs
        </Link>
        <Link
          href={navLinks.assets}
          className={isActive(navLinks.assets, false) ? 'active' : ''}
        >
          Assets
        </Link>
        <Link
          href={navLinks.users}
          className={isActive(navLinks.users) ? 'active' : ''}
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
          href={navLinks.config}
          className={isActive(navLinks.config, false) ? 'active' : ''}
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
            href={navLinks.issues}
            className={isActive(navLinks.issues) ? 'active' : ''}
          >
            Issues
          </Link>
          <Link
            href={navLinks.pullRequests}
            className={isActive(navLinks.pullRequests) ? 'active' : ''}
          >
            Pull Requests
          </Link>
          <Link
            href={navLinks.docs}
            className={isActive(navLinks.docs) ? 'active' : ''}
          >
            Docs
          </Link>
          <Link
            href={navLinks.assets}
            className={isActive(navLinks.assets, false) ? 'active' : ''}
          >
            Assets
          </Link>
          <Link
            href={navLinks.users}
            className={isActive(navLinks.users) ? 'active' : ''}
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
            href={navLinks.config}
            className={isActive(navLinks.config, false) ? 'active' : ''}
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
