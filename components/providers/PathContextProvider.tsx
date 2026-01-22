'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import type { Route } from 'next'
import {
  resolveProject,
  resolveProjectPath,
  buildProjectPagePath,
  UNGROUPED_ORG_MARKER,
  type ProjectResolution,
} from '@/lib/project-resolver'

/**
 * Context type for path-based navigation
 */
interface PathContextType {
  /** Organization slug from URL (null if ungrouped or aggregate view) */
  orgSlug: string | null
  /** Project name from URL (null if aggregate view) */
  projectName: string | null
  /** Absolute filesystem path for API calls (empty if not resolved or aggregate view) */
  projectPath: string
  /** Whether the project is initialized (.centy folder exists) */
  isInitialized: boolean | null
  /** Display path (with ~/ for home) */
  displayPath: string
  /** Whether we're in an aggregate view (no project selected) */
  isAggregateView: boolean
  /** Whether the project is currently being resolved */
  isLoading: boolean
  /** Error if project resolution failed */
  error: string | null
  /** Navigate to a different project */
  navigateToProject: (
    orgSlug: string | null,
    projectName: string,
    page?: string
  ) => void
}

const PathContext = createContext<PathContextType | null>(null)

const LAST_PROJECT_STORAGE_KEY = 'centy-last-project-path'

// Known root-level routes that are NOT org/project paths
// Note: 'issues', 'docs', 'pull-requests', 'users' are NOT in this list
// because they require project context and are handled by project-scoped routes
const ROOT_ROUTES = new Set([
  'organizations',
  'settings',
  'archived',
  'assets',
  'project',
])

/**
 * Provider that extracts org/project from URL path and resolves to project info
 *
 * Expected route structure:
 * - /[organization]/[project]/... - Project-scoped pages (issues, docs, pull-requests, users)
 * - /organizations, /settings, etc. - Root-level pages that don't require project context
 */
export function PathContextProvider({ children }: { children: ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()

  // Extract org and project from named route params
  const org = params.organization as string | undefined
  const project = params.project as string | undefined

  // Parse path segments from pathname as fallback
  const pathSegments = useMemo(() => {
    return pathname
      .split('/')
      .filter(Boolean)
      .map(s => decodeURIComponent(s))
  }, [pathname])

  // Determine effective org and project
  // Either from params or by parsing the pathname
  const urlOrg = useMemo(() => {
    if (org) return org
    // Check if first segment is not a known root route
    if (pathSegments.length >= 2 && !ROOT_ROUTES.has(pathSegments[0])) {
      return pathSegments[0]
    }
    return undefined
  }, [org, pathSegments])

  const urlProject = useMemo(() => {
    if (project) return project
    // Check if first segment is not a known root route
    if (pathSegments.length >= 2 && !ROOT_ROUTES.has(pathSegments[0])) {
      return pathSegments[1]
    }
    return undefined
  }, [project, pathSegments])

  // Determine if this is an aggregate view (no org/project in URL)
  const isAggregateView = !urlOrg || !urlProject

  // State for resolved project info
  const [resolution, setResolution] = useState<ProjectResolution | null>(null)
  const [isLoading, setIsLoading] = useState(!isAggregateView)
  const [error, setError] = useState<string | null>(null)

  // Resolve project when URL params change
  useEffect(() => {
    if (isAggregateView) {
      setResolution(null)
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    async function resolve() {
      setIsLoading(true)
      setError(null)

      try {
        const result = await resolveProject(urlOrg!, urlProject!)

        if (cancelled) return

        if (result) {
          setResolution(result)
          // Persist last used project
          if (typeof window !== 'undefined') {
            localStorage.setItem(LAST_PROJECT_STORAGE_KEY, result.projectPath)
          }
        } else {
          setError(`Project not found: ${urlOrg}/${urlProject}`)
          setResolution(null)
        }
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : 'Failed to resolve project'
        )
        setResolution(null)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    resolve()

    return () => {
      cancelled = true
    }
  }, [urlOrg, urlProject, isAggregateView])

  // Navigate to a different project
  const navigateToProject = useMemo(() => {
    return (orgSlug: string | null, projectName: string, page = 'issues') => {
      const path = buildProjectPagePath(orgSlug, projectName, page) as Route
      router.push(path)
    }
  }, [router])

  // Build context value
  const contextValue = useMemo<PathContextType>(() => {
    if (isAggregateView) {
      return {
        orgSlug: null,
        projectName: null,
        projectPath: '',
        isInitialized: null,
        displayPath: '',
        isAggregateView: true,
        isLoading: false,
        error: null,
        navigateToProject,
      }
    }

    if (resolution) {
      return {
        orgSlug: resolution.orgSlug,
        projectName: resolution.projectName,
        projectPath: resolution.projectPath,
        isInitialized: resolution.initialized,
        displayPath: resolution.displayPath,
        isAggregateView: false,
        isLoading,
        error,
        navigateToProject,
      }
    }

    // Still loading or error state
    return {
      orgSlug: urlOrg === UNGROUPED_ORG_MARKER ? null : (urlOrg ?? null),
      projectName: urlProject ?? null,
      projectPath: '',
      isInitialized: null,
      displayPath: '',
      isAggregateView: false,
      isLoading,
      error,
      navigateToProject,
    }
  }, [
    isAggregateView,
    resolution,
    urlOrg,
    urlProject,
    isLoading,
    error,
    navigateToProject,
  ])

  return (
    <PathContext.Provider value={contextValue}>{children}</PathContext.Provider>
  )
}

/**
 * Hook to access path context
 */
export function usePathContext() {
  const context = useContext(PathContext)
  if (!context) {
    throw new Error('usePathContext must be used within a PathContextProvider')
  }
  return context
}

/**
 * Hook to get last used project path (for redirect from root)
 */
export function useLastProjectPath(): string | null {
  const [lastPath] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LAST_PROJECT_STORAGE_KEY)
    }
    return null
  })

  return lastPath
}

/**
 * Hook to resolve a project path to URL params
 */
export function useProjectPathToUrl() {
  return async (projectPath: string) => {
    const result = await resolveProjectPath(projectPath)
    if (!result) return null
    return {
      orgSlug: result.orgSlug,
      projectName: result.projectName,
    }
  }
}
