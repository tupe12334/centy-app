import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IssuesList } from './IssuesList'
import type { Issue } from '@/gen/centy_pb'

vi.mock('@/lib/grpc/client', () => ({
  centyClient: {
    isInitialized: vi.fn(),
    listIssues: vi.fn(),
  },
}))

const mockUsePathContext = vi.fn()
const mockUseProjectPathToUrl = vi.fn()
vi.mock('@/components/providers/PathContextProvider', () => ({
  usePathContext: () => mockUsePathContext(),
  useProjectPathToUrl: () => mockUseProjectPathToUrl(),
}))

// Mock useProject for hooks that still depend on it (useConfig -> useStateManager)
vi.mock('@/components/providers/ProjectProvider', () => ({
  useProject: () => ({
    projectPath: '/test/path',
    setProjectPath: vi.fn(),
    isInitialized: true,
    setIsInitialized: vi.fn(),
  }),
}))

import { centyClient } from '@/lib/grpc/client'

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
): Issue =>
  ({
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
  }) as Issue

describe('IssuesList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock - no project selected
    mockUsePathContext.mockReturnValue({
      projectPath: '',
      isInitialized: null,
      orgSlug: null,
      projectName: null,
      displayPath: '',
      isAggregateView: false,
      isLoading: false,
      error: null,
      navigateToProject: vi.fn(),
    })
    mockUseProjectPathToUrl.mockReturnValue(vi.fn().mockResolvedValue(null))
  })

  const renderComponent = () => {
    return render(<IssuesList />)
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
    mockUsePathContext.mockReturnValue({
      projectPath: '/test/path',
      isInitialized: false,
      orgSlug: null,
      projectName: 'test',
      displayPath: '~/test/path',
      isAggregateView: false,
      isLoading: false,
      error: null,
      navigateToProject: vi.fn(),
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

    mockUsePathContext.mockReturnValue({
      projectPath: '/test/path',
      isInitialized: true,
      orgSlug: null,
      projectName: 'test',
      displayPath: '~/test/path',
      isAggregateView: false,
      isLoading: false,
      error: null,
      navigateToProject: vi.fn(),
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

    mockUsePathContext.mockReturnValue({
      projectPath: '/test/path',
      isInitialized: true,
      orgSlug: null,
      projectName: 'test',
      displayPath: '~/test/path',
      isAggregateView: false,
      isLoading: false,
      error: null,
      navigateToProject: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('First Issue')).toBeInTheDocument()
      expect(screen.getByText('Second Issue')).toBeInTheDocument()
      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.getByText('#2')).toBeInTheDocument()
    })
  })

  it('should show refresh button when project is initialized', async () => {
    const mockListIssues = vi.mocked(centyClient.listIssues)
    mockListIssues.mockResolvedValue({
      issues: [],
      totalCount: 0,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    mockUsePathContext.mockReturnValue({
      projectPath: '/test/path',
      isInitialized: true,
      orgSlug: null,
      projectName: 'test',
      displayPath: '~/test/path',
      isAggregateView: false,
      isLoading: false,
      error: null,
      navigateToProject: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })
  })

  it('should handle network errors', async () => {
    const mockListIssues = vi.mocked(centyClient.listIssues)
    mockListIssues.mockRejectedValue(new Error('Connection refused'))

    mockUsePathContext.mockReturnValue({
      projectPath: '/test/path',
      isInitialized: true,
      orgSlug: null,
      projectName: 'test',
      displayPath: '~/test/path',
      isAggregateView: false,
      isLoading: false,
      error: null,
      navigateToProject: vi.fn(),
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

    mockUsePathContext.mockReturnValue({
      projectPath: '/test/path',
      isInitialized: true,
      orgSlug: null,
      projectName: 'test',
      displayPath: '~/test/path',
      isAggregateView: false,
      isLoading: false,
      error: null,
      navigateToProject: vi.fn(),
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

    mockUsePathContext.mockReturnValue({
      projectPath: '/test/path',
      isInitialized: true,
      orgSlug: null,
      projectName: 'test',
      displayPath: '~/test/path',
      isAggregateView: false,
      isLoading: false,
      error: null,
      navigateToProject: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      const statusBadge = screen.getByText('open')
      const priorityBadge = screen.getByText('high')

      expect(statusBadge).toHaveClass('status-open')
      expect(priorityBadge).toHaveClass('priority-high')
    })
  })

  it('should handle non-Error rejection', async () => {
    const mockListIssues = vi.mocked(centyClient.listIssues)
    mockListIssues.mockRejectedValue('string error')

    mockUsePathContext.mockReturnValue({
      projectPath: '/test/path',
      isInitialized: true,
      orgSlug: null,
      projectName: 'test',
      displayPath: '~/test/path',
      isAggregateView: false,
      isLoading: false,
      error: null,
      navigateToProject: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(
        screen.getByText('Failed to connect to daemon')
      ).toBeInTheDocument()
    })
  })
})
