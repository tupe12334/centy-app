import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { ProjectSelector } from './ProjectSelector'

vi.mock('../api/client.ts', () => ({
  centyClient: {
    listProjects: vi.fn(),
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
  overrides: Partial<{
    path: string
    name: string
    initialized: boolean
    issueCount: number
    docCount: number
  }> = {}
) => ({
  path: overrides.path || '/test/project',
  name: overrides.name || 'Test Project',
  initialized: overrides.initialized ?? true,
  issueCount: overrides.issueCount ?? 5,
  docCount: overrides.docCount ?? 3,
  firstAccessed: '2024-01-01T00:00:00Z',
  lastAccessed: '2024-01-15T10:00:00Z',
  $typeName: 'centy.ProjectInfo' as const,
  $unknown: undefined,
})

const createMockListProjectsResponse = (
  projects: ReturnType<typeof createMockProject>[]
) => ({
  projects,
  totalCount: projects.length,
  $typeName: 'centy.ListProjectsResponse' as const,
  $unknown: undefined,
})

describe('ProjectSelector', () => {
  const mockSetProjectPath = vi.fn()
  const mockSetIsInitialized = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
    mockUseProject.mockReturnValue({
      projectPath: '',
      setProjectPath: mockSetProjectPath,
      isInitialized: null,
      setIsInitialized: mockSetIsInitialized,
    })
    mockUseArchivedProjects.mockReturnValue({
      archivedPaths: [],
      archiveProject: vi.fn(),
      unarchiveProject: vi.fn(),
      isArchived: () => false,
    })
  })

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ProjectSelector />
      </BrowserRouter>
    )
  }

  it('should render with "Select Project" when no project is selected', () => {
    renderComponent()

    expect(screen.getByText('Select Project')).toBeInTheDocument()
    expect(screen.getByText('📁')).toBeInTheDocument()
    expect(screen.getByText('▼')).toBeInTheDocument()
  })

  it('should show project name when a project is selected', () => {
    mockUseProject.mockReturnValue({
      projectPath: '/my/project',
      setProjectPath: mockSetProjectPath,
      isInitialized: true,
      setIsInitialized: mockSetIsInitialized,
    })

    renderComponent()

    expect(screen.getByText('project')).toBeInTheDocument()
  })

  it('should open dropdown when trigger is clicked', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue(createMockListProjectsResponse([]))

    renderComponent()

    const trigger = screen.getByRole('button', { expanded: false })
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(
        screen.getByText('Select Project', { selector: 'h3' })
      ).toBeInTheDocument()
    })
    expect(screen.getByText('▲')).toBeInTheDocument()
  })

  it('should fetch projects when dropdown opens', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue(
      createMockListProjectsResponse([createMockProject()])
    )

    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(mockListProjects).toHaveBeenCalled()
    })

    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('should display loading state while fetching projects', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve(createMockListProjectsResponse([])), 100)
        )
    )

    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    expect(screen.getByText('Loading projects...')).toBeInTheDocument()
  })

  it('should display error when fetch fails', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockRejectedValue(new Error('Network error'))

    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should display generic error for non-Error rejections', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockRejectedValue('Unknown error')

    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(screen.getByText('Failed to load projects')).toBeInTheDocument()
    })
  })

  it('should display empty state when no projects exist', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue(createMockListProjectsResponse([]))

    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(screen.getByText('No tracked projects found')).toBeInTheDocument()
    })
  })

  it('should select project when clicked', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue(
      createMockListProjectsResponse([
        createMockProject({ path: '/selected/path', name: 'Selected Project' }),
      ])
    )

    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(screen.getByText('Selected Project')).toBeInTheDocument()
    })

    const projectItem = screen.getByRole('option')
    fireEvent.click(projectItem)

    expect(mockSetProjectPath).toHaveBeenCalledWith('/selected/path')
    expect(mockSetIsInitialized).toHaveBeenCalledWith(true)
  })

  it('should close dropdown after selecting project', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue(
      createMockListProjectsResponse([createMockProject()])
    )

    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    const projectItem = screen.getByRole('option')
    fireEvent.click(projectItem)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('should show project stats for initialized projects', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue(
      createMockListProjectsResponse([
        createMockProject({ issueCount: 10, docCount: 5 }),
      ])
    )

    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(screen.getByText('📋 10')).toBeInTheDocument()
      expect(screen.getByText('📄 5')).toBeInTheDocument()
    })
  })

  it('should show "Not initialized" badge for uninitialized projects', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue(
      createMockListProjectsResponse([
        createMockProject({ initialized: false }),
      ])
    )

    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(screen.getByText('Not initialized')).toBeInTheDocument()
    })
  })

  it('should submit manual path when form is submitted', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue(createMockListProjectsResponse([]))

    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Or enter path manually...')
      ).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Or enter path manually...')
    fireEvent.change(input, { target: { value: '/manual/path' } })

    const submitBtn = screen.getByRole('button', { name: 'Go' })
    fireEvent.click(submitBtn)

    expect(mockSetProjectPath).toHaveBeenCalledWith('/manual/path')
    expect(mockSetIsInitialized).toHaveBeenCalledWith(null)
  })

  it('should not submit empty manual path', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue(createMockListProjectsResponse([]))

    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled()
    })
  })

  it('should refresh projects when refresh button is clicked', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue(createMockListProjectsResponse([]))

    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(mockListProjects).toHaveBeenCalledTimes(1)
    })

    const refreshBtn = screen.getByTitle('Refresh project list')
    fireEvent.click(refreshBtn)

    await waitFor(() => {
      expect(mockListProjects).toHaveBeenCalledTimes(2)
    })
  })

  it('should show project name from list when project path matches', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue(
      createMockListProjectsResponse([
        createMockProject({ path: '/my/project', name: 'My Named Project' }),
      ])
    )

    mockUseProject.mockReturnValue({
      projectPath: '/my/project',
      setProjectPath: mockSetProjectPath,
      isInitialized: true,
      setIsInitialized: mockSetIsInitialized,
    })

    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      // Check that the project name appears in the trigger button
      expect(trigger).toHaveTextContent('My Named Project')
    })
  })

  it('should highlight selected project in the list', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue(
      createMockListProjectsResponse([
        createMockProject({ path: '/project/one', name: 'Project One' }),
        createMockProject({ path: '/project/two', name: 'Project Two' }),
      ])
    )

    mockUseProject.mockReturnValue({
      projectPath: '/project/one',
      setProjectPath: mockSetProjectPath,
      isInitialized: true,
      setIsInitialized: mockSetIsInitialized,
    })

    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      const options = screen.getAllByRole('option')
      expect(options[0]).toHaveAttribute('aria-selected', 'true')
      expect(options[1]).toHaveAttribute('aria-selected', 'false')
    })
  })

  it('should have Init Project link in dropdown', async () => {
    const mockListProjects = vi.mocked(centyClient.listProjects)
    mockListProjects.mockResolvedValue(createMockListProjectsResponse([]))

    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      const initLink = screen.getByText('✨ Init Project')
      expect(initLink).toBeInTheDocument()
      expect(initLink).toHaveAttribute('href', '/')
    })
  })
})
