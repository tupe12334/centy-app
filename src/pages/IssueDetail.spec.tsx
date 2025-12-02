import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { IssueDetail } from './IssueDetail'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../api/client.ts', () => ({
  centyClient: {
    getIssue: vi.fn(),
    updateIssue: vi.fn(),
    deleteIssue: vi.fn(),
  },
}))

import { centyClient } from '../api/client.ts'

describe('IssueDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = (issueNumber: string, projectPath: string) => {
    return render(
      <MemoryRouter
        initialEntries={[
          `/issues/${issueNumber}?project=${encodeURIComponent(projectPath)}`,
        ]}
      >
        <Routes>
          <Route path="/issues/:issueNumber" element={<IssueDetail />} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('should show error when no project path is provided', () => {
    render(
      <MemoryRouter initialEntries={['/issues/0001']}>
        <Routes>
          <Route path="/issues/:issueNumber" element={<IssueDetail />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/No project path specified/i)).toBeInTheDocument()
  })

  it('should display loading state initially', () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockImplementation(() => new Promise(() => {})) // Never resolves

    renderComponent('0001', '/test/path')

    expect(screen.getByText('Loading issue...')).toBeInTheDocument()
  })

  it('should display issue details after loading', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Test Issue Title',
      description: 'Test issue description',
      metadata: {
        status: 'open',
        priority: 'high',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T12:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('Test Issue Title')).toBeInTheDocument()
      expect(screen.getByText('Test issue description')).toBeInTheDocument()
      expect(screen.getByText('#0001')).toBeInTheDocument()
      expect(screen.getByText('open')).toBeInTheDocument()
      expect(screen.getByText('high')).toBeInTheDocument()
    })
  })

  it('should show error when issue fails to load', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockRejectedValue(new Error('Issue not found'))

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('Issue not found')).toBeInTheDocument()
    })
  })

  it('should switch to edit mode when edit button is clicked', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Test Issue',
      description: 'Test description',
      metadata: {
        status: 'open',
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    const editBtn = screen.getByText('Edit')
    fireEvent.click(editBtn)

    expect(screen.getByLabelText('Title:')).toBeInTheDocument()
    expect(screen.getByLabelText('Status:')).toBeInTheDocument()
    expect(screen.getByLabelText('Priority:')).toBeInTheDocument()
    expect(screen.getByLabelText('Description:')).toBeInTheDocument()
  })

  it('should cancel edit and restore original values', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Original Title',
      description: 'Original description',
      metadata: {
        status: 'open',
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    const editBtn = screen.getByText('Edit')
    fireEvent.click(editBtn)

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: 'Modified Title' } })

    const cancelBtn = screen.getByText('Cancel')
    fireEvent.click(cancelBtn)

    expect(screen.getByText('Original Title')).toBeInTheDocument()
  })

  it('should save changes when save button is clicked', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    const mockUpdateIssue = vi.mocked(centyClient.updateIssue)

    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Original Title',
      description: 'Original description',
      metadata: {
        status: 'open',
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    mockUpdateIssue.mockResolvedValue({
      success: true,
      error: '',
      issue: {
        issueNumber: '0001',
        title: 'Updated Title',
        description: 'Updated description',
        metadata: {
          status: 'in-progress',
          priority: 'high',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T14:00:00Z',
          customFields: {},
          $typeName: 'centy.IssueMetadata',
          $unknown: undefined,
        },
        $typeName: 'centy.Issue',
        $unknown: undefined,
      },
      manifest: undefined,
      $typeName: 'centy.UpdateIssueResponse',
      $unknown: undefined,
    })

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    const editBtn = screen.getByText('Edit')
    fireEvent.click(editBtn)

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } })

    const saveBtn = screen.getByText('Save')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockUpdateIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          projectPath: '/test/path',
          issueNumber: '0001',
          title: 'Updated Title',
        })
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Updated Title')).toBeInTheDocument()
    })
  })

  it('should show delete confirmation dialog', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Test Issue',
      description: 'Test description',
      metadata: {
        status: 'open',
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByText('Delete')
    fireEvent.click(deleteBtn)

    expect(
      screen.getByText('Are you sure you want to delete this issue?')
    ).toBeInTheDocument()
    expect(screen.getByText('Yes, Delete')).toBeInTheDocument()
  })

  it('should delete issue and navigate to list', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    const mockDeleteIssue = vi.mocked(centyClient.deleteIssue)

    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Test Issue',
      description: 'Test description',
      metadata: {
        status: 'open',
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    mockDeleteIssue.mockResolvedValue({
      success: true,
      error: '',
      manifest: undefined,
      $typeName: 'centy.DeleteIssueResponse',
      $unknown: undefined,
    })

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByText('Delete')
    fireEvent.click(deleteBtn)

    const confirmBtn = screen.getByText('Yes, Delete')
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockDeleteIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          projectPath: '/test/path',
          issueNumber: '0001',
        })
      )
    })

    expect(mockNavigate).toHaveBeenCalledWith('/issues?project=%2Ftest%2Fpath')
  })

  it('should cancel delete confirmation', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Test Issue',
      description: 'Test description',
      metadata: {
        status: 'open',
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByText('Delete')
    fireEvent.click(deleteBtn)

    expect(
      screen.getByText('Are you sure you want to delete this issue?')
    ).toBeInTheDocument()

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelBtn)

    expect(
      screen.queryByText('Are you sure you want to delete this issue?')
    ).not.toBeInTheDocument()
  })

  it('should show no description message when description is empty', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Test Issue',
      description: '',
      metadata: {
        status: 'open',
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('No description provided')).toBeInTheDocument()
    })
  })

  it('should handle update failure', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    const mockUpdateIssue = vi.mocked(centyClient.updateIssue)

    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Original Title',
      description: 'Original description',
      metadata: {
        status: 'open',
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    mockUpdateIssue.mockResolvedValue({
      success: false,
      error: 'Update failed',
      issue: undefined,
      manifest: undefined,
      $typeName: 'centy.UpdateIssueResponse',
      $unknown: undefined,
    })

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    const editBtn = screen.getByText('Edit')
    fireEvent.click(editBtn)

    const saveBtn = screen.getByText('Save')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument()
    })
  })

  it('should handle update network error', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    const mockUpdateIssue = vi.mocked(centyClient.updateIssue)

    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Original Title',
      description: 'Original description',
      metadata: {
        status: 'open',
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    mockUpdateIssue.mockRejectedValue(new Error('Network error'))

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    const editBtn = screen.getByText('Edit')
    fireEvent.click(editBtn)

    const saveBtn = screen.getByText('Save')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should handle delete failure', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    const mockDeleteIssue = vi.mocked(centyClient.deleteIssue)

    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Test Issue',
      description: 'Test description',
      metadata: {
        status: 'open',
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    mockDeleteIssue.mockResolvedValue({
      success: false,
      error: 'Delete failed',
      manifest: undefined,
      $typeName: 'centy.DeleteIssueResponse',
      $unknown: undefined,
    })

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByText('Delete')
    fireEvent.click(deleteBtn)

    const confirmBtn = screen.getByText('Yes, Delete')
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText('Delete failed')).toBeInTheDocument()
    })
  })

  it('should handle delete network error', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    const mockDeleteIssue = vi.mocked(centyClient.deleteIssue)

    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Test Issue',
      description: 'Test description',
      metadata: {
        status: 'open',
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    mockDeleteIssue.mockRejectedValue(new Error('Network error'))

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByText('Delete')
    fireEvent.click(deleteBtn)

    const confirmBtn = screen.getByText('Yes, Delete')
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should handle non-Error rejection for getIssue', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockRejectedValue('string error')

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(
        screen.getByText('Failed to connect to daemon')
      ).toBeInTheDocument()
    })
  })

  it('should display correct status badges', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'In Progress Issue',
      description: 'Description',
      metadata: {
        status: 'in-progress',
        priority: 'low',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      const statusBadge = screen.getByText('in-progress')
      const priorityBadge = screen.getByText('low')

      expect(statusBadge).toHaveClass('status-in-progress')
      expect(priorityBadge).toHaveClass('priority-low')
    })
  })

  it('should display closed status badge', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Closed Issue',
      description: 'Description',
      metadata: {
        status: 'closed',
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      const statusBadge = screen.getByText('closed')
      expect(statusBadge).toHaveClass('status-closed')
    })
  })

  it('should display issue without metadata gracefully', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Issue Without Metadata',
      description: 'Description',
      metadata: undefined,
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('Issue Without Metadata')).toBeInTheDocument()
      expect(screen.getAllByText('unknown')).toHaveLength(2)
    })
  })

  it('should show default error for update with empty error message', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    const mockUpdateIssue = vi.mocked(centyClient.updateIssue)

    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Original Title',
      description: 'Original description',
      metadata: {
        status: 'open',
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    mockUpdateIssue.mockResolvedValue({
      success: false,
      error: '',
      issue: undefined,
      manifest: undefined,
      $typeName: 'centy.UpdateIssueResponse',
      $unknown: undefined,
    })

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    const editBtn = screen.getByText('Edit')
    fireEvent.click(editBtn)

    const saveBtn = screen.getByText('Save')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText('Failed to update issue')).toBeInTheDocument()
    })
  })

  it('should show default error for delete with empty error message', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    const mockDeleteIssue = vi.mocked(centyClient.deleteIssue)

    mockGetIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Test Issue',
      description: 'Test description',
      metadata: {
        status: 'open',
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        customFields: {},
        $typeName: 'centy.IssueMetadata',
        $unknown: undefined,
      },
      $typeName: 'centy.Issue',
      $unknown: undefined,
    })

    mockDeleteIssue.mockResolvedValue({
      success: false,
      error: '',
      manifest: undefined,
      $typeName: 'centy.DeleteIssueResponse',
      $unknown: undefined,
    })

    renderComponent('0001', '/test/path')

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByText('Delete')
    fireEvent.click(deleteBtn)

    const confirmBtn = screen.getByText('Yes, Delete')
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText('Failed to delete issue')).toBeInTheDocument()
    })
  })
})
