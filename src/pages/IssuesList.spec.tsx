import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { IssuesList } from './IssuesList'

vi.mock('../api/client.ts', () => ({
  centyClient: {
    isInitialized: vi.fn(),
    listIssues: vi.fn(),
  },
}))

const mockUseProject = vi.fn()
vi.mock('../context/ProjectContext.tsx', () => ({
  useProject: () => mockUseProject(),
}))

import { centyClient } from '../api/client.ts'

// Helper to create mock Issue data
const createMockIssue = (
  overrides: {
    issueNumber?: string
    displayNumber?: number
    title?: string
    description?: string
    status?: string
    priority?: number
    priorityLabel?: string
    hasMetadata?: boolean
  } = {}
) => ({
  id: overrides.issueNumber || '0001',
  displayNumber: overrides.displayNumber || 1,
  issueNumber: overrides.issueNumber || '0001',
  title: overrides.title || 'Test Issue',
  description: overrides.description || 'Test description',
  metadata:
    overrides.hasMetadata === false
      ? undefined
      : {
          displayNumber: overrides.displayNumber || 1,
          status: overrides.status || 'open',
          priority: overrides.priority || 2,
          priorityLabel: overrides.priorityLabel || 'medium',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          customFields: {},
          $typeName: 'centy.IssueMetadata' as const,
          $unknown: undefined,
        },
  $typeName: 'centy.Issue' as const,
  $unknown: undefined,
})

describe('IssuesList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock - no project selected
    mockUseProject.mockReturnValue({
      projectPath: '',
      setProjectPath: vi.fn(),
      isInitialized: null,
      setIsInitialized: vi.fn(),
    })
  })

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <IssuesList />
      </BrowserRouter>
    )
  }

  it('should render the page header', () => {
    renderComponent()

    expect(screen.getByText('Issues')).toBeInTheDocument()
    expect(screen.getByText('+ New Issue')).toBeInTheDocument()
  })

  it('should show message when no project is selected', () => {
    renderComponent()

    expect(
      screen.getByText('Select a project from the header to view issues')
    ).toBeInTheDocument()
  })

  it('should show error when project is not initialized', () => {
    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: false,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    expect(
      screen.getByText('Centy is not initialized in this directory')
    ).toBeInTheDocument()
    expect(screen.getByText('Initialize Project')).toBeInTheDocument()
  })

  it('should show empty state when no issues exist', async () => {
    const mockListIssues = vi.mocked(centyClient.listIssues)
    mockListIssues.mockResolvedValue({
      issues: [],
      totalCount: 0,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('No issues found')).toBeInTheDocument()
      expect(screen.getByText('Create your first issue')).toBeInTheDocument()
    })
  })

  it('should display list of issues', async () => {
    const mockListIssues = vi.mocked(centyClient.listIssues)
    mockListIssues.mockResolvedValue({
      issues: [
        createMockIssue({
          issueNumber: '0001',
          displayNumber: 1,
          title: 'First Issue',
          description: 'Description 1',
          status: 'open',
          priority: 1,
          priorityLabel: 'high',
        }),
        createMockIssue({
          issueNumber: '0002',
          displayNumber: 2,
          title: 'Second Issue',
          description: 'Description 2',
          status: 'in-progress',
        }),
      ],
      totalCount: 2,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('First Issue')).toBeInTheDocument()
      expect(screen.getByText('Second Issue')).toBeInTheDocument()
      expect(screen.getByText('#0001')).toBeInTheDocument()
      expect(screen.getByText('#0002')).toBeInTheDocument()
    })
  })

  it('should show filters when project is initialized', async () => {
    const mockListIssues = vi.mocked(centyClient.listIssues)
    mockListIssues.mockResolvedValue({
      issues: [],
      totalCount: 0,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByLabelText('Status:')).toBeInTheDocument()
      expect(screen.getByLabelText('Priority:')).toBeInTheDocument()
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })
  })

  it('should filter issues by status', async () => {
    const mockListIssues = vi.mocked(centyClient.listIssues)
    mockListIssues.mockResolvedValue({
      issues: [],
      totalCount: 0,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByLabelText('Status:')).toBeInTheDocument()
    })

    const statusFilter = screen.getByLabelText('Status:')
    fireEvent.change(statusFilter, { target: { value: 'open' } })

    await waitFor(() => {
      expect(mockListIssues).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'open',
        })
      )
    })
  })

  it('should handle network errors', async () => {
    const mockListIssues = vi.mocked(centyClient.listIssues)
    mockListIssues.mockRejectedValue(new Error('Connection refused'))

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Connection refused')).toBeInTheDocument()
    })
  })

  it('should refresh issues when clicking refresh button', async () => {
    const mockListIssues = vi.mocked(centyClient.listIssues)
    mockListIssues.mockResolvedValue({
      issues: [],
      totalCount: 0,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })

    mockListIssues.mockClear()

    const refreshBtn = screen.getByText('Refresh')
    fireEvent.click(refreshBtn)

    await waitFor(() => {
      expect(mockListIssues).toHaveBeenCalled()
    })
  })

  it('should display status and priority badges with correct styling', async () => {
    const mockListIssues = vi.mocked(centyClient.listIssues)
    mockListIssues.mockResolvedValue({
      issues: [
        createMockIssue({
          status: 'open',
          priority: 1,
          priorityLabel: 'high',
        }),
      ],
      totalCount: 1,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      const statusBadge = screen.getByText('open')
      const priorityBadge = screen.getByText('high')

      expect(statusBadge).toHaveClass('status-open')
      expect(priorityBadge).toHaveClass('priority-high')
    })
  })

  it('should filter issues by priority', async () => {
    const mockListIssues = vi.mocked(centyClient.listIssues)
    mockListIssues.mockResolvedValue({
      issues: [],
      totalCount: 0,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByLabelText('Priority:')).toBeInTheDocument()
    })

    const priorityFilter = screen.getByLabelText('Priority:')
    fireEvent.change(priorityFilter, { target: { value: '1' } }) // 1 = high

    await waitFor(() => {
      expect(mockListIssues).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 1,
        })
      )
    })
  })

  it('should handle non-Error rejection', async () => {
    const mockListIssues = vi.mocked(centyClient.listIssues)
    mockListIssues.mockRejectedValue('string error')

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(
        screen.getByText('Failed to connect to daemon')
      ).toBeInTheDocument()
    })
  })

  it('should show closed status badge correctly', async () => {
    const mockListIssues = vi.mocked(centyClient.listIssues)
    mockListIssues.mockResolvedValue({
      issues: [
        createMockIssue({
          title: 'Closed Issue',
          status: 'closed',
          priority: 3,
          priorityLabel: 'low',
        }),
      ],
      totalCount: 1,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      const statusBadge = screen.getByText('closed')
      const priorityBadge = screen.getByText('low')

      expect(statusBadge).toHaveClass('status-closed')
      expect(priorityBadge).toHaveClass('priority-low')
    })
  })

  it('should display issue without metadata gracefully', async () => {
    const mockListIssues = vi.mocked(centyClient.listIssues)
    mockListIssues.mockResolvedValue({
      issues: [
        createMockIssue({
          title: 'Issue Without Metadata',
          description: 'Description',
          hasMetadata: false,
        }),
      ],
      totalCount: 1,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Issue Without Metadata')).toBeInTheDocument()
      expect(screen.getAllByText('unknown')).toHaveLength(2)
    })
  })
})
