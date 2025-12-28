'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useEffect } from 'react'
import { PathContextProvider } from '@/components/providers/PathContextProvider'

// Components for different route types
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

/**
 * Client-side router for catch-all paths
 *
 * Parses the pathname and renders the appropriate component for
 * [organization]/[project]/... paths that don't match explicit routes.
 */
export function CatchAllRouter() {
  const pathname = usePathname()
  const router = useRouter()

  const { content, shouldRedirect, redirectTo } = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)

    // Need at least org/project to be a project-scoped route
    if (segments.length < 2) {
      return {
        content: <div className="not-found">Page not found</div>,
        shouldRedirect: false,
        redirectTo: '',
      }
    }

    // Extract org, project, and remaining path
    const [org, project, pageType, ...rest] = segments

    // Route based on the page type
    switch (pageType) {
      case 'issues':
        if (rest[0] === 'new') {
          return {
            content: <CreateIssue />,
            shouldRedirect: false,
            redirectTo: '',
          }
        }
        if (rest[0]) {
          return {
            content: <IssueDetail issueNumber={rest[0]} />,
            shouldRedirect: false,
            redirectTo: '',
          }
        }
        return {
          content: <IssuesList />,
          shouldRedirect: false,
          redirectTo: '',
        }

      case 'docs':
        if (rest[0] === 'new') {
          return {
            content: <CreateDoc />,
            shouldRedirect: false,
            redirectTo: '',
          }
        }
        if (rest[0]) {
          return {
            content: <DocDetail slug={rest[0]} />,
            shouldRedirect: false,
            redirectTo: '',
          }
        }
        return { content: <DocsList />, shouldRedirect: false, redirectTo: '' }

      case 'users':
        if (rest[0] === 'new') {
          return {
            content: <CreateUser />,
            shouldRedirect: false,
            redirectTo: '',
          }
        }
        if (rest[0]) {
          return {
            content: <UserDetail userId={rest[0]} />,
            shouldRedirect: false,
            redirectTo: '',
          }
        }
        return { content: <UsersList />, shouldRedirect: false, redirectTo: '' }

      case 'pull-requests':
        if (rest[0] === 'new') {
          return {
            content: <CreatePR />,
            shouldRedirect: false,
            redirectTo: '',
          }
        }
        if (rest[0]) {
          return {
            content: <PRDetail prNumber={rest[0]} />,
            shouldRedirect: false,
            redirectTo: '',
          }
        }
        return { content: <PRsList />, shouldRedirect: false, redirectTo: '' }

      case 'assets':
        return {
          content: <SharedAssets />,
          shouldRedirect: false,
          redirectTo: '',
        }

      case 'config':
        return {
          content: <ProjectConfig />,
          shouldRedirect: false,
          redirectTo: '',
        }

      case undefined:
        // Just org/project - redirect to issues
        return {
          content: null,
          shouldRedirect: true,
          redirectTo: `/${org}/${project}/issues`,
        }

      default:
        return {
          content: <div className="not-found">Page not found</div>,
          shouldRedirect: false,
          redirectTo: '',
        }
    }
  }, [pathname])

  useEffect(() => {
    if (shouldRedirect && redirectTo) {
      router.replace(redirectTo)
    }
  }, [shouldRedirect, redirectTo, router])

  if (shouldRedirect) {
    return null
  }

  return <PathContextProvider>{content}</PathContextProvider>
}
