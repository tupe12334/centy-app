'use client'

import { useParams, useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PathContextProvider } from '@/components/providers/PathContextProvider'
import { resolveProjectPath } from '@/lib/project-resolver'

// Import page components
import { IssuesList } from '@/components/issues/IssuesList'
import { IssueDetail } from '@/components/issues/IssueDetail'
import { CreateIssue } from '@/components/issues/CreateIssue'
import { DocsList } from '@/components/docs/DocsList'
import { DocDetail } from '@/components/docs/DocDetail'
import { CreateDoc } from '@/components/docs/CreateDoc'
import { UsersList } from '@/components/users/UsersList'
import { UserDetail } from '@/components/users/UserDetail'
import { CreateUser } from '@/components/users/CreateUser'
import { PRsList } from '@/components/pull-requests/PRsList'
import { PRDetail } from '@/components/pull-requests/PRDetail'
import { CreatePR } from '@/components/pull-requests/CreatePR'
import { SharedAssets } from '@/components/assets/SharedAssets'
import { ProjectConfig } from '@/components/settings/ProjectConfig'
import { ProjectSelector } from '@/components/project/ProjectSelector'

const LAST_PROJECT_STORAGE_KEY = 'centy-last-project-path'

interface ParsedPath {
  org: string
  project: string
  page: string
  subPath: string[]
}

function parsePath(pathSegments: string[] | undefined): ParsedPath | null {
  if (!pathSegments || pathSegments.length < 2) {
    return null
  }

  const [org, project, page = 'issues', ...subPath] = pathSegments
  return { org, project, page, subPath }
}

function PageComponent({ page, subPath }: { page: string; subPath: string[] }) {
  switch (page) {
    case 'issues':
      if (subPath[0] === 'new') {
        return <CreateIssue />
      }
      if (subPath[0]) {
        return <IssueDetail issueNumber={subPath[0]} />
      }
      return <IssuesList />

    case 'docs':
      if (subPath[0] === 'new') {
        return <CreateDoc />
      }
      if (subPath[0]) {
        return <DocDetail slug={subPath[0]} />
      }
      return <DocsList />

    case 'users':
      if (subPath[0] === 'new') {
        return <CreateUser />
      }
      if (subPath[0]) {
        return <UserDetail userId={subPath[0]} />
      }
      return <UsersList />

    case 'pull-requests':
      if (subPath[0] === 'new') {
        return <CreatePR />
      }
      if (subPath[0]) {
        return <PRDetail prNumber={subPath[0]} />
      }
      return <PRsList />

    case 'assets':
      return <SharedAssets />

    case 'config':
      return <ProjectConfig />

    default:
      return <IssuesList />
  }
}

export function ProjectRouterClient() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [showSelector, setShowSelector] = useState(false)

  const pathSegments = params.path as string[] | undefined
  const parsed = parsePath(pathSegments)

  // Handle root path - redirect to last project or show selector
  useEffect(() => {
    async function handleRouting() {
      if (pathname === '/' || !pathSegments || pathSegments.length === 0) {
        if (typeof window === 'undefined') {
          setLoading(false)
          return
        }

        const lastProjectPath = localStorage.getItem(LAST_PROJECT_STORAGE_KEY)

        if (lastProjectPath) {
          try {
            const result = await resolveProjectPath(lastProjectPath)
            if (result) {
              router.replace(`/${result.orgSlug}/${result.projectName}/issues`)
              return
            }
          } catch {
            // Failed to resolve, show selector
          }
        }

        setLoading(false)
        setShowSelector(true)
      } else {
        setLoading(false)
      }
    }

    handleRouting()
  }, [pathname, pathSegments, router])

  // Root path handling
  if (pathname === '/' || !pathSegments || pathSegments.length === 0) {
    if (loading) {
      return (
        <div className="home-loading">
          <p>Loading...</p>
        </div>
      )
    }

    if (showSelector) {
      return (
        <div className="home-page">
          <div className="welcome-section">
            <h1>Welcome to Centy</h1>
            <p>
              Select a project to get started, or view all issues across
              projects.
            </p>
          </div>

          <div className="home-actions">
            <div className="project-selection">
              <h3>Select a Project</h3>
              <ProjectSelector />
            </div>

            <div className="quick-links">
              <h3>Or view all</h3>
              <a href="/issues" className="quick-link">
                All Issues
              </a>
              <a href="/docs" className="quick-link">
                All Docs
              </a>
              <a href="/organizations" className="quick-link">
                Organizations
              </a>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  // Single segment - might be aggregate route or org-only
  if (pathSegments.length === 1) {
    // This should be handled by the specific route files (issues, docs, etc.)
    // If we get here, it's an unknown single segment
    return (
      <div className="not-found">
        <h2>Page Not Found</h2>
        <p>The path "/{pathSegments[0]}" does not exist.</p>
        <a href="/">Go Home</a>
      </div>
    )
  }

  // Two or more segments - this is an org/project path
  if (!parsed) {
    return (
      <div className="not-found">
        <h2>Invalid Path</h2>
        <a href="/">Go Home</a>
      </div>
    )
  }

  return (
    <PathContextProvider>
      <PageComponent page={parsed.page} subPath={parsed.subPath} />
    </PathContextProvider>
  )
}
