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

import { centyClient } from '../api/client.ts'

describe('IssuesList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    expect(screen.getByLabelText('Project Path:')).toBeInTheDocument()
  })

  it('should show error when project is not initialized', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    mockIsInitialized.mockResolvedValue({
      initialized: false,
      centyPath: '',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    renderComponent()

    const projectInput = screen.getByLabelText('Project Path:')
    fireEvent.change(projectInput, { target: { value: '/test/path' } })

    await waitFor(() => {
      expect(
        screen.getByText('Centy is not initialized in this directory')
      ).toBeInTheDocument()
    })
  })

  it('should show empty state when no issues exist', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    const mockListIssues = vi.mocked(centyClient.listIssues)

    mockIsInitialized.mockResolvedValue({
      initialized: true,
      centyPath: '/test/path/.centy',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    mockListIssues.mockResolvedValue({
      issues: [],
      totalCount: 0,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    renderComponent()

    const projectInput = screen.getByLabelText('Project Path:')
    fireEvent.change(projectInput, { target: { value: '/test/path' } })

    await waitFor(() => {
      expect(screen.getByText('No issues found')).toBeInTheDocument()
      expect(screen.getByText('Create your first issue')).toBeInTheDocument()
    })
  })

  it('should display list of issues', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    const mockListIssues = vi.mocked(centyClient.listIssues)

    mockIsInitialized.mockResolvedValue({
      initialized: true,
      centyPath: '/test/path/.centy',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    mockListIssues.mockResolvedValue({
      issues: [
        {
          issueNumber: '0001',
          title: 'First Issue',
          description: 'Description 1',
          metadata: {
            status: 'open',
            priority: 'high',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
            customFields: {},
            $typeName: 'centy.IssueMetadata',
            $unknown: undefined,
          },
          $typeName: 'centy.Issue',
          $unknown: undefined,
        },
        {
          issueNumber: '0002',
          title: 'Second Issue',
          description: 'Description 2',
          metadata: {
            status: 'in-progress',
            priority: 'medium',
            createdAt: '2024-01-16T10:00:00Z',
            updatedAt: '2024-01-16T10:00:00Z',
            customFields: {},
            $typeName: 'centy.IssueMetadata',
            $unknown: undefined,
          },
          $typeName: 'centy.Issue',
          $unknown: undefined,
        },
      ],
      totalCount: 2,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    renderComponent()

    const projectInput = screen.getByLabelText('Project Path:')
    fireEvent.change(projectInput, { target: { value: '/test/path' } })

    await waitFor(() => {
      expect(screen.getByText('First Issue')).toBeInTheDocument()
      expect(screen.getByText('Second Issue')).toBeInTheDocument()
      expect(screen.getByText('#0001')).toBeInTheDocument()
      expect(screen.getByText('#0002')).toBeInTheDocument()
    })
  })

  it('should show filters when project is initialized', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    const mockListIssues = vi.mocked(centyClient.listIssues)

    mockIsInitialized.mockResolvedValue({
      initialized: true,
      centyPath: '/test/path/.centy',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    mockListIssues.mockResolvedValue({
      issues: [],
      totalCount: 0,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    renderComponent()

    const projectInput = screen.getByLabelText('Project Path:')
    fireEvent.change(projectInput, { target: { value: '/test/path' } })

    await waitFor(() => {
      expect(screen.getByLabelText('Status:')).toBeInTheDocument()
      expect(screen.getByLabelText('Priority:')).toBeInTheDocument()
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })
  })

  it('should filter issues by status', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    const mockListIssues = vi.mocked(centyClient.listIssues)

    mockIsInitialized.mockResolvedValue({
      initialized: true,
      centyPath: '/test/path/.centy',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    mockListIssues.mockResolvedValue({
      issues: [],
      totalCount: 0,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    renderComponent()

    const projectInput = screen.getByLabelText('Project Path:')
    fireEvent.change(projectInput, { target: { value: '/test/path' } })

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
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    const mockListIssues = vi.mocked(centyClient.listIssues)

    mockIsInitialized.mockResolvedValue({
      initialized: true,
      centyPath: '/test/path/.centy',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    mockListIssues.mockRejectedValue(new Error('Connection refused'))

    renderComponent()

    const projectInput = screen.getByLabelText('Project Path:')
    fireEvent.change(projectInput, { target: { value: '/test/path' } })

    await waitFor(() => {
      expect(screen.getByText('Connection refused')).toBeInTheDocument()
    })
  })

  it('should refresh issues when clicking refresh button', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    const mockListIssues = vi.mocked(centyClient.listIssues)

    mockIsInitialized.mockResolvedValue({
      initialized: true,
      centyPath: '/test/path/.centy',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    mockListIssues.mockResolvedValue({
      issues: [],
      totalCount: 0,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    renderComponent()

    const projectInput = screen.getByLabelText('Project Path:')
    fireEvent.change(projectInput, { target: { value: '/test/path' } })

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
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    const mockListIssues = vi.mocked(centyClient.listIssues)

    mockIsInitialized.mockResolvedValue({
      initialized: true,
      centyPath: '/test/path/.centy',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    mockListIssues.mockResolvedValue({
      issues: [
        {
          issueNumber: '0001',
          title: 'Test Issue',
          description: 'Description',
          metadata: {
            status: 'open',
            priority: 'high',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
            customFields: {},
            $typeName: 'centy.IssueMetadata',
            $unknown: undefined,
          },
          $typeName: 'centy.Issue',
          $unknown: undefined,
        },
      ],
      totalCount: 1,
      $typeName: 'centy.ListIssuesResponse',
      $unknown: undefined,
    })

    renderComponent()

    const projectInput = screen.getByLabelText('Project Path:')
    fireEvent.change(projectInput, { target: { value: '/test/path' } })

    await waitFor(() => {
      const statusBadge = screen.getByText('open')
      const priorityBadge = screen.getByText('high')

      expect(statusBadge).toHaveClass('status-open')
      expect(priorityBadge).toHaveClass('priority-high')
    })
  })
})
