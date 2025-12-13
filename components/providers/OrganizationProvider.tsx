'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  ListOrganizationsRequestSchema,
  type Organization,
} from '@/gen/centy_pb'

interface OrganizationContextType {
  /** Selected org filter: null = all, '' = ungrouped only, slug = specific org */
  selectedOrgSlug: string | null
  setSelectedOrgSlug: (slug: string | null) => void
  organizations: Organization[]
  loading: boolean
  error: string | null
  refreshOrganizations: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | null>(null)

const STORAGE_KEY = 'centy-selected-org'
const ORG_QUERY_PARAM = 'org'

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [selectedOrgSlug, setSelectedOrgSlugState] = useState<string | null>(
    () => {
      // Priority: query string > localStorage > null (all)
      const queryOrg = searchParams.get(ORG_QUERY_PARAM)
      if (queryOrg !== null) {
        // Empty string means ungrouped, non-empty means specific org
        return queryOrg
      }
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored !== null) {
          return stored
        }
      }
      return null
    }
  )

  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync query string with selected org
  useEffect(() => {
    const currentQueryOrg = searchParams.get(ORG_QUERY_PARAM)

    if (selectedOrgSlug !== null && currentQueryOrg !== selectedOrgSlug) {
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set(ORG_QUERY_PARAM, selectedOrgSlug)
      router.replace(`${pathname}?${newParams.toString()}`)
    } else if (selectedOrgSlug === null && currentQueryOrg !== null) {
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete(ORG_QUERY_PARAM)
      const queryString = newParams.toString()
      router.replace(queryString ? `${pathname}?${queryString}` : pathname)
    }
  }, [selectedOrgSlug, searchParams, router, pathname])

  const refreshOrganizations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const request = create(ListOrganizationsRequestSchema, {})
      const response = await centyClient.listOrganizations(request)
      setOrganizations(response.organizations)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load organizations'
      if (message.includes('unimplemented')) {
        setError(
          'Organizations feature is not available. Please update your daemon.'
        )
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Load organizations on mount
  useEffect(() => {
    refreshOrganizations()
  }, [refreshOrganizations])

  const setSelectedOrgSlug = useCallback((slug: string | null) => {
    setSelectedOrgSlugState(slug)
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      if (slug !== null) {
        localStorage.setItem(STORAGE_KEY, slug)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  return (
    <OrganizationContext.Provider
      value={{
        selectedOrgSlug,
        setSelectedOrgSlug,
        organizations,
        loading,
        error,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error(
      'useOrganization must be used within an OrganizationProvider'
    )
  }
  return context
}
