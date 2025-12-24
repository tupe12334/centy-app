'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

interface ProjectContextType {
  projectPath: string
  setProjectPath: (path: string) => void
  isInitialized: boolean | null
  setIsInitialized: (initialized: boolean | null) => void
}

const ProjectContext = createContext<ProjectContextType | null>(null)

const STORAGE_KEY = 'centy-project-path'
const ARCHIVED_STORAGE_KEY = 'centy-archived-projects'

function getArchivedProjects(): string[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(ARCHIVED_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

function setArchivedProjectsStorage(paths: string[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ARCHIVED_STORAGE_KEY, JSON.stringify(paths))
  }
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  // Only use localStorage for persistence - URL path is handled by PathContextProvider
  const [projectPath, setProjectPathState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || ''
    }
    return ''
  })
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null)

  const setProjectPath = useCallback((path: string) => {
    setProjectPathState(path)
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      if (path) {
        localStorage.setItem(STORAGE_KEY, path)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  return (
    <ProjectContext.Provider
      value={{ projectPath, setProjectPath, isInitialized, setIsInitialized }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}

export function useArchivedProjects() {
  const [archivedPaths, setArchivedPathsState] = useState<string[]>(() =>
    getArchivedProjects()
  )

  const archiveProject = useCallback((path: string) => {
    setArchivedPathsState(prev => {
      if (prev.includes(path)) return prev
      const updated = [...prev, path]
      setArchivedProjectsStorage(updated)
      return updated
    })
  }, [])

  const unarchiveProject = useCallback((path: string) => {
    setArchivedPathsState(prev => {
      const updated = prev.filter(p => p !== path)
      setArchivedProjectsStorage(updated)
      return updated
    })
  }, [])

  const removeArchivedProject = useCallback((path: string) => {
    setArchivedPathsState(prev => {
      const updated = prev.filter(p => p !== path)
      setArchivedProjectsStorage(updated)
      return updated
    })
  }, [])

  const isArchived = useCallback(
    (path: string) => {
      return archivedPaths.includes(path)
    },
    [archivedPaths]
  )

  return {
    archivedPaths,
    archiveProject,
    unarchiveProject,
    removeArchivedProject,
    isArchived,
  }
}
