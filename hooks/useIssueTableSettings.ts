'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { useProject } from '@/components/providers/ProjectProvider'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'

const STORAGE_KEY_PREFIX = 'centy-issues-table-settings'

interface IssueTableSettings {
  sorting: SortingState
  columnFilters: ColumnFiltersState
}

const DEFAULT_SETTINGS: IssueTableSettings = {
  sorting: [{ id: 'createdAt', desc: true }],
  columnFilters: [{ id: 'status', value: ['open', 'in-progress'] }],
}

function getStorageKey(projectPath: string): string {
  return `${STORAGE_KEY_PREFIX}-${projectPath}`
}

function loadSettings(projectPath: string): IssueTableSettings {
  if (typeof window === 'undefined' || !projectPath) return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(getStorageKey(projectPath))
    if (!stored) return DEFAULT_SETTINGS
    const parsed = JSON.parse(stored) as IssueTableSettings
    return {
      sorting: parsed.sorting ?? DEFAULT_SETTINGS.sorting,
      columnFilters: parsed.columnFilters ?? DEFAULT_SETTINGS.columnFilters,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(projectPath: string, settings: IssueTableSettings): void {
  if (typeof window === 'undefined' || !projectPath) return
  try {
    localStorage.setItem(getStorageKey(projectPath), JSON.stringify(settings))
  } catch {
    // Ignore storage errors
  }
}

// Create a store for each project path
const stores = new Map<
  string,
  {
    settings: IssueTableSettings
    listeners: Set<() => void>
  }
>()

function getOrCreateStore(projectPath: string) {
  if (!stores.has(projectPath)) {
    stores.set(projectPath, {
      settings: loadSettings(projectPath),
      listeners: new Set(),
    })
  }
  return stores.get(projectPath)!
}

function subscribe(projectPath: string, listener: () => void) {
  const store = getOrCreateStore(projectPath)
  store.listeners.add(listener)
  return () => store.listeners.delete(listener)
}

function getSnapshot(projectPath: string): IssueTableSettings {
  return getOrCreateStore(projectPath).settings
}

function getServerSnapshot(): IssueTableSettings {
  return DEFAULT_SETTINGS
}

function updateSettings(
  projectPath: string,
  updater: (prev: IssueTableSettings) => IssueTableSettings
) {
  const store = getOrCreateStore(projectPath)
  store.settings = updater(store.settings)
  saveSettings(projectPath, store.settings)
  store.listeners.forEach(listener => listener())
}

export function useIssueTableSettings() {
  const { projectPath } = useProject()

  const settings = useSyncExternalStore(
    useCallback(listener => subscribe(projectPath, listener), [projectPath]),
    useCallback(() => getSnapshot(projectPath), [projectPath]),
    getServerSnapshot
  )

  const setSorting = useCallback(
    (value: SortingState | ((prev: SortingState) => SortingState)) => {
      updateSettings(projectPath, prev => ({
        ...prev,
        sorting: typeof value === 'function' ? value(prev.sorting) : value,
      }))
    },
    [projectPath]
  )

  const setColumnFilters = useCallback(
    (
      value:
        | ColumnFiltersState
        | ((prev: ColumnFiltersState) => ColumnFiltersState)
    ) => {
      updateSettings(projectPath, prev => ({
        ...prev,
        columnFilters:
          typeof value === 'function' ? value(prev.columnFilters) : value,
      }))
    },
    [projectPath]
  )

  return {
    sorting: settings.sorting,
    setSorting,
    columnFilters: settings.columnFilters,
    setColumnFilters,
  }
}
