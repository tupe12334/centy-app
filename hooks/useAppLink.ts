'use client'

import { useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

const PRESERVED_PARAMS = ['org', 'project']

/**
 * Hook that provides a function to generate links with preserved query parameters.
 * This ensures that org and project context is maintained during navigation.
 */
export function useAppLink() {
  const searchParams = useSearchParams()

  const createLink = useCallback(
    (path: string): string => {
      const params = new URLSearchParams()

      // Preserve org and project params from current URL
      for (const param of PRESERVED_PARAMS) {
        const value = searchParams.get(param)
        if (value !== null) {
          params.set(param, value)
        }
      }

      const queryString = params.toString()
      return queryString ? `${path}?${queryString}` : path
    },
    [searchParams]
  )

  return { createLink }
}
