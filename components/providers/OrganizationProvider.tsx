'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
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

export function OrganizationProvider({ children }: { children: ReactNode }) {
  // Initialize to null to avoid hydration mismatch - load from localStorage after mount
  const [selectedOrgSlug, setSelectedOrgSlugState] = useState<string | null>(
    null
  )

  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setSelectedOrgSlugState(stored)
    }
  }, [])

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
