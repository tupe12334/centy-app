import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { ArchivedProjects } from './ArchivedProjects'

vi.mock('../api/client.ts', () => ({
  centyClient: {
    listProjects: vi.fn(),
    untrackProject: vi.fn(),
  },
}))

const mockUseProject = vi.fn()
const mockUseArchivedProjects = vi.fn()
vi.mock('../context/ProjectContext.tsx', () => ({
  useProject: () => mockUseProject(),
  useArchivedProjects: () => mockUseArchivedProjects(),
}))

import { centyClient } from '../api/client.ts'

const createMockProject = (
  overrides: {
    path?: string
    name?: string
    issueCount?: number
    docCount?: number
    initialized?: boolean
  } = {}
) => ({
  path: overrides.path || '/test/path',
  name: overrides.name || 'Test Project',
  firstAccessed: '',
  lastAccessed: '',
  issueCount: overrides.issueCount ?? 5,
  docCount: overrides.docCount ?? 3,
  initialized: overrides.initialized ?? true,
  $typeName: 'centy.ProjectInfo' as const,
  $unknown: undefined,
})

describe('ArchivedProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProject.mockReturnValue({
      projectPath: '',
      setProjectPath: vi.fn(),
      isInitialized: null,
      setIsInitialized: vi.fn(),
    })
    mockUseArchivedProjects.mockReturnValue({
      archivedPaths: [],
      unarchiveProject: vi.fn(),
      removeArchivedProject: vi.fn(),
    })
  })

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ArchivedProjects />
      </BrowserRouter>
    )
  }

  it('should render the page header', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue({
      projects: [],
      totalCount: 0,
      $typeName: 'centy.ListProjectsResponse',
      $unknown: undefined,
    })

    renderComponent()

    expect(screen.getByText('Archived Projects')).toBeInTheDocument()
    expect(screen.getByText('Back to Issues')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderComponent()

    expect(screen.getByText('Loading projects...')).toBeInTheDocument()
  })

  it('should show empty state when no archived projects', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue({
      projects: [],
      totalCount: 0,
      $typeName: 'centy.ListProjectsResponse',
      $unknown: undefined,
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('No archived projects')).toBeInTheDocument()
    })
  })

  it('should display archived projects', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue({
      projects: [
        createMockProject({
          path: '/archived/project1',
          name: 'Project 1',
          issueCount: 10,
          docCount: 5,
        }),
      ],
      totalCount: 0,
      $typeName: 'centy.ListProjectsResponse',
      $unknown: undefined,
    })

    mockUseArchivedProjects.mockReturnValue({
      archivedPaths: ['/archived/project1'],
      unarchiveProject: vi.fn(),
      removeArchivedProject: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument()
      expect(screen.getByText('/archived/project1')).toBeInTheDocument()
      expect(screen.getByText('Issues: 10')).toBeInTheDocument()
      expect(screen.getByText('Docs: 5')).toBeInTheDocument()
    })
  })

  it('should show not initialized badge', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue({
      projects: [
        createMockProject({
          path: '/archived/project1',
          name: 'Project 1',
          initialized: false,
        }),
      ],
      totalCount: 0,
      $typeName: 'centy.ListProjectsResponse',
      $unknown: undefined,
    })

    mockUseArchivedProjects.mockReturnValue({
      archivedPaths: ['/archived/project1'],
      unarchiveProject: vi.fn(),
      removeArchivedProject: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Not initialized')).toBeInTheDocument()
    })
  })

  it('should handle restore', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue({
      projects: [
        createMockProject({
          path: '/archived/project1',
          name: 'Project 1',
        }),
      ],
      totalCount: 0,
      $typeName: 'centy.ListProjectsResponse',
      $unknown: undefined,
    })

    const unarchiveProject = vi.fn()
    mockUseArchivedProjects.mockReturnValue({
      archivedPaths: ['/archived/project1'],
      unarchiveProject,
      removeArchivedProject: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Restore')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Restore'))

    expect(unarchiveProject).toHaveBeenCalledWith('/archived/project1')
  })

  it('should handle restore and select', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue({
      projects: [
        createMockProject({
          path: '/archived/project1',
          name: 'Project 1',
          initialized: true,
        }),
      ],
      totalCount: 0,
      $typeName: 'centy.ListProjectsResponse',
      $unknown: undefined,
    })

    const unarchiveProject = vi.fn()
    const setProjectPath = vi.fn()
    const setIsInitialized = vi.fn()

    mockUseArchivedProjects.mockReturnValue({
      archivedPaths: ['/archived/project1'],
      unarchiveProject,
      removeArchivedProject: vi.fn(),
    })

    mockUseProject.mockReturnValue({
      projectPath: '',
      setProjectPath,
      isInitialized: null,
      setIsInitialized,
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Restore & Select')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Restore & Select'))

    expect(unarchiveProject).toHaveBeenCalledWith('/archived/project1')
    expect(setProjectPath).toHaveBeenCalledWith('/archived/project1')
    expect(setIsInitialized).toHaveBeenCalledWith(true)
  })

  it('should show remove confirmation', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue({
      projects: [
        createMockProject({
          path: '/archived/project1',
          name: 'Project 1',
        }),
      ],
      totalCount: 0,
      $typeName: 'centy.ListProjectsResponse',
      $unknown: undefined,
    })

    mockUseArchivedProjects.mockReturnValue({
      archivedPaths: ['/archived/project1'],
      unarchiveProject: vi.fn(),
      removeArchivedProject: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Remove')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Remove'))

    expect(screen.getByText('Remove permanently?')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('should cancel remove', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue({
      projects: [
        createMockProject({
          path: '/archived/project1',
          name: 'Project 1',
        }),
      ],
      totalCount: 0,
      $typeName: 'centy.ListProjectsResponse',
      $unknown: undefined,
    })

    mockUseArchivedProjects.mockReturnValue({
      archivedPaths: ['/archived/project1'],
      unarchiveProject: vi.fn(),
      removeArchivedProject: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Remove')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Remove'))
    fireEvent.click(screen.getByText('No'))

    expect(screen.queryByText('Remove permanently?')).not.toBeInTheDocument()
  })

  it('should remove project', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    const mockUntrackProject = vi.mocked(centyClient.untrackProject)

    mockListProjects.mockResolvedValue({
      projects: [
        createMockProject({
          path: '/archived/project1',
          name: 'Project 1',
        }),
      ],
      totalCount: 0,
      $typeName: 'centy.ListProjectsResponse',
      $unknown: undefined,
    })

    mockUntrackProject.mockResolvedValue({
      success: true,
      error: '',
      $typeName: 'centy.UntrackProjectResponse',
      $unknown: undefined,
    })

    const removeArchivedProject = vi.fn()
    mockUseArchivedProjects.mockReturnValue({
      archivedPaths: ['/archived/project1'],
      unarchiveProject: vi.fn(),
      removeArchivedProject,
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Remove')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Remove'))
    fireEvent.click(screen.getByText('Yes'))

    await waitFor(() => {
      expect(mockUntrackProject).toHaveBeenCalled()
      expect(removeArchivedProject).toHaveBeenCalledWith('/archived/project1')
    })
  })

  it('should show error when remove fails', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    const mockUntrackProject = vi.mocked(centyClient.untrackProject)

    mockListProjects.mockResolvedValue({
      projects: [
        createMockProject({
          path: '/archived/project1',
          name: 'Project 1',
        }),
      ],
      totalCount: 0,
      $typeName: 'centy.ListProjectsResponse',
      $unknown: undefined,
    })

    mockUntrackProject.mockResolvedValue({
      success: false,
      error: 'Cannot remove project',
      $typeName: 'centy.UntrackProjectResponse',
      $unknown: undefined,
    })

    mockUseArchivedProjects.mockReturnValue({
      archivedPaths: ['/archived/project1'],
      unarchiveProject: vi.fn(),
      removeArchivedProject: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Remove')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Remove'))
    fireEvent.click(screen.getByText('Yes'))

    await waitFor(() => {
      expect(screen.getByText('Cannot remove project')).toBeInTheDocument()
    })
  })

  it('should handle remove network error', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    const mockUntrackProject = vi.mocked(centyClient.untrackProject)

    mockListProjects.mockResolvedValue({
      projects: [
        createMockProject({
          path: '/archived/project1',
          name: 'Project 1',
        }),
      ],
      totalCount: 0,
      $typeName: 'centy.ListProjectsResponse',
      $unknown: undefined,
    })

    mockUntrackProject.mockRejectedValue(new Error('Network error'))

    mockUseArchivedProjects.mockReturnValue({
      archivedPaths: ['/archived/project1'],
      unarchiveProject: vi.fn(),
      removeArchivedProject: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Remove')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Remove'))
    fireEvent.click(screen.getByText('Yes'))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should handle non-Error rejection', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    const mockUntrackProject = vi.mocked(centyClient.untrackProject)

    mockListProjects.mockResolvedValue({
      projects: [
        createMockProject({
          path: '/archived/project1',
          name: 'Project 1',
        }),
      ],
      totalCount: 0,
      $typeName: 'centy.ListProjectsResponse',
      $unknown: undefined,
    })

    mockUntrackProject.mockRejectedValue('string error')

    mockUseArchivedProjects.mockReturnValue({
      archivedPaths: ['/archived/project1'],
      unarchiveProject: vi.fn(),
      removeArchivedProject: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Remove')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Remove'))
    fireEvent.click(screen.getByText('Yes'))

    await waitFor(() => {
      expect(screen.getByText('Failed to remove project')).toBeInTheDocument()
    })
  })

  it('should show stale projects not in daemon', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue({
      projects: [],
      totalCount: 0,
      $typeName: 'centy.ListProjectsResponse',
      $unknown: undefined,
    })

    mockUseArchivedProjects.mockReturnValue({
      archivedPaths: ['/stale/project'],
      unarchiveProject: vi.fn(),
      removeArchivedProject: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('project')).toBeInTheDocument() // last path segment
      expect(screen.getByText('/stale/project')).toBeInTheDocument()
      expect(screen.getByText('Not tracked by daemon')).toBeInTheDocument()
    })
  })

  it('should remove stale project from archived list', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue({
      projects: [],
      totalCount: 0,
      $typeName: 'centy.ListProjectsResponse',
      $unknown: undefined,
    })

    const removeArchivedProject = vi.fn()
    mockUseArchivedProjects.mockReturnValue({
      archivedPaths: ['/stale/project'],
      unarchiveProject: vi.fn(),
      removeArchivedProject,
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Remove')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Remove'))
    fireEvent.click(screen.getByText('Yes'))

    expect(removeArchivedProject).toHaveBeenCalledWith('/stale/project')
  })

  it('should handle list projects error', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockRejectedValue(new Error('Connection refused'))

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Connection refused')).toBeInTheDocument()
    })
  })

  it('should handle non-Error list projects rejection', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockRejectedValue('string error')

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Failed to load projects')).toBeInTheDocument()
    })
  })
})
