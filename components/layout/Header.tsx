'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { route } from 'nextjs-routes'
import { useState, useEffect, useMemo } from 'react'
import { DaemonStatusIndicator } from '@/components/shared/DaemonStatusIndicator'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { OrgSwitcher } from '@/components/organizations/OrgSwitcher'
import { ProjectSelector } from '@/components/project/ProjectSelector'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import { UNGROUPED_ORG_MARKER } from '@/lib/project-resolver'

// Known root-level routes that are NOT org/project paths
const ROOT_ROUTES = new Set([
  'organizations',
  'settings',
  'archived',
  'assets',
  'project',
])

export function Header() {
  const pathname = usePathname()
  const params = useParams()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { hasExplicitSelection } = useOrganization()

  // Extract org and project from URL
  // New route structure: /[organization]/[project]/...
  // Named params are available as params?.organization and params?.project
  const org = params?.organization as string | undefined
  const project = params?.project as string | undefined

  // Fallback: parse pathname for cases where params might not be available
  const pathSegments = useMemo(() => {
    return pathname.split('/').filter(Boolean)
  }, [pathname])

  // Determine if we're in a project context
  // A project context exists when:
  // 1. We have both org and project params, OR
  // 2. The first segment is not a known root-level route
  const hasProjectContext = useMemo(() => {
    if (org && project) return true
    if (pathSegments.length >= 2 && !ROOT_ROUTES.has(pathSegments[0])) {
      return true
    }
    return false
  }, [org, project, pathSegments])

  // Get effective org and project (from params or parsed pathname)
  const effectiveOrg = org || (hasProjectContext ? pathSegments[0] : undefined)
  const effectiveProject =
    project || (hasProjectContext ? pathSegments[1] : undefined)

  // Build navigation links based on context
  // All navigation now requires project context
  const navLinks = useMemo(() => {
    if (hasProjectContext && effectiveOrg && effectiveProject) {
      return {
        issues: route({
          pathname: '/[organization]/[project]/issues',
          query: { organization: effectiveOrg, project: effectiveProject },
        }),
        pullRequests: route({
          pathname: '/[organization]/[project]/pull-requests',
          query: { organization: effectiveOrg, project: effectiveProject },
        }),
        docs: route({
          pathname: '/[organization]/[project]/docs',
          query: { organization: effectiveOrg, project: effectiveProject },
        }),
        assets: route({
          pathname: '/[organization]/[project]/assets',
          query: { organization: effectiveOrg, project: effectiveProject },
        }),
        users: route({
          pathname: '/[organization]/[project]/users',
          query: { organization: effectiveOrg, project: effectiveProject },
        }),
        config: route({
          pathname: '/[organization]/[project]/config',
          query: { organization: effectiveOrg, project: effectiveProject },
        }),
      }
    }
    // No project context - return null to indicate nav items shouldn't be shown
    return null
  }, [hasProjectContext, effectiveOrg, effectiveProject])

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

  // Display the current project context with link to organization page
  const contextDisplay =
    hasProjectContext && effectiveOrg && effectiveProject ? (
      <Link
        href={
          effectiveOrg === UNGROUPED_ORG_MARKER
            ? '/organizations'
            : route({
                pathname: '/organizations/[orgSlug]',
                query: { orgSlug: effectiveOrg },
              })
        }
        className="header-context-link"
      >
        {effectiveOrg === UNGROUPED_ORG_MARKER ? '' : `${effectiveOrg} / `}
        {effectiveProject}
      </Link>
    ) : null

  return (
    <header className="app-header">
      <div className="header-top">
        <h1>
          <Link href="/" className="header-logo-link">
            <img
              src="/logo.svg"
              alt=""
              className="header-logo-icon"
              width={28}
              height={28}
              aria-hidden="true"
            />
            <span>Centy</span>
          </Link>
          {contextDisplay}
        </h1>
        <div className="header-controls">
          <ThemeToggle />
          <DaemonStatusIndicator />
          <OrgSwitcher />
          {hasExplicitSelection && <ProjectSelector />}
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
        {/* Project-dependent items - only show when project context exists */}
        {navLinks && (
          <>
            <div className="nav-group nav-group-project">
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
                href={navLinks.config}
                className={isActive(navLinks.config, false) ? 'active' : ''}
              >
                Project Config
              </Link>
            </div>

            {/* Visual divider */}
            <div className="nav-divider" aria-hidden="true" />
          </>
        )}

        {/* General pages */}
        <div className="nav-group nav-group-general">
          <Link
            href="/organizations"
            className={pathname.startsWith('/organizations') ? 'active' : ''}
          >
            Organizations
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
        </div>
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
          {hasExplicitSelection && <ProjectSelector />}
        </div>
        <nav className="mobile-menu-nav">
          {/* Project-dependent items - only show when project context exists */}
          {navLinks && (
            <>
              <div className="mobile-nav-group">
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
                  href={navLinks.config}
                  className={isActive(navLinks.config, false) ? 'active' : ''}
                >
                  Project Config
                </Link>
              </div>

              {/* Horizontal divider */}
              <div className="mobile-nav-divider" aria-hidden="true" />
            </>
          )}

          {/* General pages */}
          <div className="mobile-nav-group">
            <Link
              href="/organizations"
              className={pathname.startsWith('/organizations') ? 'active' : ''}
            >
              Organizations
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
          </div>
        </nav>
      </div>
    </header>
  )
}
