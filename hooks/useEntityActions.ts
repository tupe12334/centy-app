'use client'

import { useEffect, useCallback, useSyncExternalStore } from 'react'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  GetEntityActionsRequestSchema,
  EntityType,
  ActionCategory,
  type EntityAction,
} from '@/gen/centy_pb'
import { useProject } from '@/components/providers/ProjectProvider'

// Cache key: projectPath + entityType + entityId
type CacheKey = string

function getCacheKey(
  projectPath: string,
  entityType: EntityType,
  entityId: string
): CacheKey {
  return `${projectPath}:${entityType}:${entityId}`
}

// Cache actions per entity
const actionsCache = new Map<
  CacheKey,
  {
    actions: EntityAction[]
    loading: boolean
    error: string | null
    listeners: Set<() => void>
  }
>()

// Default cache for server-side rendering - must be a constant to avoid infinite loops
const DEFAULT_CACHE = {
  actions: [] as EntityAction[],
  loading: false,
  error: null,
  listeners: new Set<() => void>(),
}

function getOrCreateCache(cacheKey: CacheKey) {
  if (!actionsCache.has(cacheKey)) {
    actionsCache.set(cacheKey, {
      actions: [],
      loading: false,
      error: null,
      listeners: new Set(),
    })
  }
  return actionsCache.get(cacheKey)!
}

function subscribe(cacheKey: CacheKey, listener: () => void) {
  const cache = getOrCreateCache(cacheKey)
  cache.listeners.add(listener)
  return () => cache.listeners.delete(listener)
}

function notifyListeners(cacheKey: CacheKey) {
  const cache = actionsCache.get(cacheKey)
  if (cache) {
    cache.listeners.forEach(listener => listener())
  }
}

async function fetchEntityActions(
  projectPath: string,
  entityType: EntityType,
  entityId: string
): Promise<void> {
  if (!projectPath || !entityId) return

  const cacheKey = getCacheKey(projectPath, entityType, entityId)
  const cache = getOrCreateCache(cacheKey)

  // Skip if already loading
  if (cache.loading) return

  cache.loading = true
  cache.error = null
  notifyListeners(cacheKey)

  try {
    const request = create(GetEntityActionsRequestSchema, {
      projectPath: projectPath.trim(),
      entityType,
      entityId,
    })
    const response = await centyClient.getEntityActions(request)

    if (response.success) {
      cache.actions = response.actions
      cache.error = null
    } else {
      cache.error = response.error || 'Failed to load entity actions'
    }
  } catch (err) {
    cache.error =
      err instanceof Error ? err.message : 'Failed to load entity actions'
  } finally {
    cache.loading = false
    notifyListeners(cacheKey)
  }
}

export function useEntityActions(entityType: EntityType, entityId: string) {
  const { projectPath, isInitialized } = useProject()

  const cacheKey = projectPath
    ? getCacheKey(projectPath, entityType, entityId)
    : ''

  const cache = useSyncExternalStore(
    useCallback(listener => subscribe(cacheKey, listener), [cacheKey]),
    useCallback(
      () => (cacheKey ? getOrCreateCache(cacheKey) : DEFAULT_CACHE),
      [cacheKey]
    ),
    () => DEFAULT_CACHE
  )

  const reload = useCallback(async () => {
    if (!projectPath || !entityId) return
    // Clear cache to force reload
    const key = getCacheKey(projectPath, entityType, entityId)
    const existingCache = actionsCache.get(key)
    if (existingCache) {
      existingCache.actions = []
    }
    await fetchEntityActions(projectPath, entityType, entityId)
  }, [projectPath, entityType, entityId])

  // Get a single action by ID
  const getAction = useCallback(
    (actionId: string): EntityAction | undefined => {
      return cache.actions.find(action => action.id === actionId)
    },
    [cache.actions]
  )

  // Get actions by category
  const getActionsByCategory = useCallback(
    (category: ActionCategory): EntityAction[] => {
      return cache.actions.filter(action => action.category === category)
    },
    [cache.actions]
  )

  // Fetch actions when project is initialized
  useEffect(() => {
    if (isInitialized === true && projectPath && entityId) {
      fetchEntityActions(projectPath, entityType, entityId)
    }
  }, [projectPath, isInitialized, entityType, entityId])

  return {
    actions: cache.actions,
    loading: cache.loading,
    error: cache.error,
    reload,
    getAction,
    getActionsByCategory,
  }
}

// Re-export types for convenience
export { EntityType, ActionCategory }
export type { EntityAction }
