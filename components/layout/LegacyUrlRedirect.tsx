'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { route } from 'nextjs-routes'
import {
  resolveProjectPath,
  UNGROUPED_ORG_MARKER,
} from '@/lib/project-resolver'

/**
 * Component that redirects legacy URLs with query params to new path-based URLs.
 *
 * Old format: /issues?project=/path/to/project
 * New format: /org/project-name/issues
 */
export function LegacyUrlRedirect() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    const projectPath = searchParams.get('project')

    if (!projectPath) {
      return
    }

    // Don't redirect if we're already on a path-based route
    const pathSegments = pathname.split('/').filter(Boolean)
    if (pathSegments.length >= 2) {
      // Looks like we're already on a path-based route
      // Check if this is a root-level route (doesn't require project context)
      // Note: 'issues', 'docs', 'pull-requests', 'users' are NOT in this list
      // because they require project context and are handled by project-scoped routes
      const rootLevelRoutes = [
        'organizations',
        'settings',
        'archived',
        'assets',
      ]
      if (!rootLevelRoutes.includes(pathSegments[0])) {
        return // Already on a project path like /org/project/...
      }
    }

    async function redirect() {
      setIsRedirecting(true)

      try {
        const result = await resolveProjectPath(projectPath!)

        if (result) {
          const orgPart = result.orgSlug || UNGROUPED_ORG_MARKER

          // Extract the page from pathname (e.g., /issues -> issues)
          const page = pathname.split('/').filter(Boolean)[0] || 'issues'

          // Build new URL and redirect
          router.replace(
            route({
              pathname: '/[...path]',
              query: { path: [orgPart, result.projectName, page] },
            })
          )
        }
      } catch (error) {
        console.error('Failed to resolve legacy URL:', error)
      } finally {
        setIsRedirecting(false)
      }
    }

    redirect()
  }, [searchParams, pathname, router])

  if (isRedirecting) {
    return (
      <div className="legacy-redirect-loading">
        <p>Redirecting to new URL format...</p>
      </div>
    )
  }

  return null
}
