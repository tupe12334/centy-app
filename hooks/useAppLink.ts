'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { UNGROUPED_ORG_MARKER } from '@/lib/project-resolver'

/**
 * Hook that provides functions to generate path-based links.
 * Replaces the old query-param-based link generation.
 */
export function useAppLink() {
  const params = useParams()

  // Extract org and project from URL path array (catch-all route)
  const pathSegments = params.path as string[] | undefined
  const org = pathSegments?.[0]
  const project = pathSegments?.[1]

  /**
   * Create a link within the current project context.
   * If no project context (aggregate view), returns the path as-is.
   *
   * @param path - Page path like '/issues' or '/issues/123'
   * @returns Full path like '/my-org/my-project/issues/123'
   */
  const createLink = useCallback(
    (path: string): string => {
      // If we have project context, prepend org/project to path
      if (org && project) {
        // Normalize path to not start with /
        const normalizedPath = path.startsWith('/') ? path.slice(1) : path
        return `/${org}/${project}/${normalizedPath}`
      }

      // No project context (aggregate view) - return path as-is
      return path
    },
    [org, project]
  )

  /**
   * Create a link to a specific project (regardless of current context).
   * Use this in aggregate views where you need to link to a specific project.
   *
   * @param orgSlug - Organization slug (null for ungrouped projects)
   * @param projectName - Project name
   * @param path - Page path like 'issues' or 'issues/123'
   * @returns Full path like '/my-org/my-project/issues/123'
   */
  const createProjectLink = useCallback(
    (orgSlug: string | null, projectName: string, path: string): string => {
      const orgPart = orgSlug || UNGROUPED_ORG_MARKER
      const normalizedPath = path.startsWith('/') ? path.slice(1) : path
      return `/${orgPart}/${projectName}/${normalizedPath}`
    },
    []
  )

  /**
   * Create a root-level link (for global pages like settings, organizations).
   * Always returns the path without project prefix.
   *
   * @param path - Root path like '/settings' or '/organizations'
   * @returns The path as-is
   */
  const createRootLink = useCallback((path: string): string => {
    return path.startsWith('/') ? path : `/${path}`
  }, [])

  /**
   * Check if we're currently in a project context.
   */
  const hasProjectContext = Boolean(org && project)

  /**
   * Get the current project context (useful for aggregate views linking back).
   */
  const currentContext = hasProjectContext
    ? {
        orgSlug: org === UNGROUPED_ORG_MARKER ? null : org,
        projectName: project!,
      }
    : null

  return {
    createLink,
    createProjectLink,
    createRootLink,
    hasProjectContext,
    currentContext,
  }
}
