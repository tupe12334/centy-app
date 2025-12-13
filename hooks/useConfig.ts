'use client'

import { useEffect, useCallback, useSyncExternalStore } from 'react'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import { GetConfigRequestSchema, type Config } from '@/gen/centy_pb'
import { useProject } from '@/components/providers/ProjectProvider'

// Cache config per project path
const configCache = new Map<
  string,
  {
    config: Config | null
    loading: boolean
    error: string | null
    listeners: Set<() => void>
  }
>()

function getOrCreateCache(projectPath: string) {
  if (!configCache.has(projectPath)) {
    configCache.set(projectPath, {
      config: null,
      loading: false,
      error: null,
      listeners: new Set(),
    })
  }
  return configCache.get(projectPath)!
}

function subscribe(projectPath: string, listener: () => void) {
  const cache = getOrCreateCache(projectPath)
  cache.listeners.add(listener)
  return () => cache.listeners.delete(listener)
}

function notifyListeners(projectPath: string) {
  const cache = configCache.get(projectPath)
  if (cache) {
    cache.listeners.forEach(listener => listener())
  }
}

async function fetchConfig(projectPath: string): Promise<void> {
  if (!projectPath) return

  const cache = getOrCreateCache(projectPath)

  // Skip if already loading or has data
  if (cache.loading || cache.config) return

  cache.loading = true
  cache.error = null
  notifyListeners(projectPath)

  try {
    const request = create(GetConfigRequestSchema, {
      projectPath: projectPath.trim(),
    })
    const response = await centyClient.getConfig(request)
    cache.config = response
    cache.error = null
  } catch (err) {
    cache.error = err instanceof Error ? err.message : 'Failed to load config'
  } finally {
    cache.loading = false
    notifyListeners(projectPath)
  }
}

export function useConfig() {
  const { projectPath, isInitialized } = useProject()

  const cache = useSyncExternalStore(
    useCallback(listener => subscribe(projectPath, listener), [projectPath]),
    useCallback(() => getOrCreateCache(projectPath), [projectPath]),
    () => ({
      config: null,
      loading: false,
      error: null,
      listeners: new Set<() => void>(),
    })
  )

  const reload = useCallback(async () => {
    if (!projectPath) return
    // Clear cache to force reload
    const cache = configCache.get(projectPath)
    if (cache) {
      cache.config = null
    }
    await fetchConfig(projectPath)
  }, [projectPath])

  // Fetch config when project is initialized
  useEffect(() => {
    if (isInitialized === true && projectPath) {
      fetchConfig(projectPath)
    }
  }, [projectPath, isInitialized])

  return {
    config: cache.config,
    loading: cache.loading,
    error: cache.error,
    reload,
  }
}

// Default issue states when config has none
const DEFAULT_ISSUE_STATES = ['open', 'in-progress', 'closed']

export interface StateOption {
  value: string
  label: string
  color?: string
}

/**
 * Get issue state options from config.
 * Returns default states if config has no allowedStates defined.
 */
export function getIssueStateOptions(config: Config | null): StateOption[] {
  const states =
    config?.allowedStates && config.allowedStates.length > 0
      ? config.allowedStates
      : DEFAULT_ISSUE_STATES

  const colors = config?.stateColors ?? {}

  return states.map(state => ({
    value: state,
    label: formatStateLabel(state),
    color: colors[state],
  }))
}

/**
 * Format a state value as a display label.
 * e.g., "in-progress" -> "In Progress"
 */
function formatStateLabel(state: string): string {
  return state
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get the CSS class for a state based on config colors or defaults.
 */
export function getStateClass(state: string, config: Config | null): string {
  // If config has a custom color for this state, use inline style instead
  if (config?.stateColors?.[state]) {
    return 'status-custom'
  }

  // Fall back to default classes
  switch (state) {
    case 'open':
      return 'status-open'
    case 'in-progress':
      return 'status-in-progress'
    case 'closed':
      return 'status-closed'
    default:
      return ''
  }
}
