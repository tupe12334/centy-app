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
    listAssets: vi.fn(),
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
    title?: string
    description?: string
    status?: string
    priority?: number
    priorityLabel?: string
    hasMetadata?: boolean
  } = {}
) => ({
  id: overrides.issueNumber || '0001',
  displayNumber: 1,
  issueNumber: overrides.issueNumber || '0001',
  title: overrides.title || 'Test Issue',
  description:
    overrides.description !== undefined
      ? overrides.description
      : 'Test description',
  metadata:
    overrides.hasMetadata === false
      ? undefined
      : {
          displayNumber: 1,
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

describe('IssueDetail', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Default mock returns valid project path
    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })
    // Mock listAssets to return empty array
    vi.mocked(centyClient.listAssets).mockResolvedValue({
      assets: [],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse' as const,
      $unknown: undefined,
    })
  })

  const renderComponent = (issueNumber: string) => {
    return render(
      <MemoryRouter initialEntries={[`/issues/${issueNumber}`]}>
        <Routes>
          <Route path="/issues/:issueNumber" element={<IssueDetail />} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('should show error when no project path is provided', () => {
    mockUseProject.mockReturnValue({
      projectPath: '',
      setProjectPath: vi.fn(),
      isInitialized: null,
      setIsInitialized: vi.fn(),
    })

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

    renderComponent('0001')

    expect(screen.getByText('Loading issue...')).toBeInTheDocument()
  })

  it('should display issue details after loading', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue(
      createMockIssue({
        title: 'Test Issue Title',
        description: 'Test issue description',
        status: 'open',
        priority: 1,
        priorityLabel: 'high',
      })
    )

    renderComponent('0001')

    await waitFor(() => {
      expect(screen.getByText('Test Issue Title')).toBeInTheDocument()
      expect(screen.getByText('Test issue description')).toBeInTheDocument()
      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.getByText('open')).toBeInTheDocument()
      expect(screen.getByText('high')).toBeInTheDocument()
    })
  })

  it('should show error when issue fails to load', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockRejectedValue(new Error('Issue not found'))

    renderComponent('0001')

    await waitFor(() => {
      expect(screen.getByText('Issue not found')).toBeInTheDocument()
    })
  })

  it('should switch to edit mode when edit button is clicked', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue(createMockIssue())

    renderComponent('0001')

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    const editBtn = screen.getByText('Edit')
    fireEvent.click(editBtn)

    expect(screen.getByLabelText('Title:')).toBeInTheDocument()
    expect(screen.getByLabelText('Status:')).toBeInTheDocument()
    expect(screen.getByLabelText('Priority:')).toBeInTheDocument()
    expect(screen.getByText('Description:')).toBeInTheDocument()
  })

  it('should cancel edit and restore original values', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue(
      createMockIssue({
        title: 'Original Title',
        description: 'Original description',
      })
    )

    renderComponent('0001')

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

    mockGetIssue.mockResolvedValue(
      createMockIssue({
        title: 'Original Title',
        description: 'Original description',
      })
    )

    mockUpdateIssue.mockResolvedValue({
      success: true,
      error: '',
      issue: createMockIssue({
        title: 'Updated Title',
        description: 'Updated description',
        status: 'in-progress',
        priority: 1,
        priorityLabel: 'high',
      }),
      manifest: undefined,
      $typeName: 'centy.UpdateIssueResponse',
      $unknown: undefined,
    })

    renderComponent('0001')

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
          issueId: '0001',
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
    mockGetIssue.mockResolvedValue(createMockIssue())

    renderComponent('0001')

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

    mockGetIssue.mockResolvedValue(createMockIssue())

    mockDeleteIssue.mockResolvedValue({
      success: true,
      error: '',
      manifest: undefined,
      $typeName: 'centy.DeleteIssueResponse',
      $unknown: undefined,
    })

    renderComponent('0001')

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
          issueId: '0001',
        })
      )
    })

    expect(mockNavigate).toHaveBeenCalledWith('/issues')
  })

  it('should cancel delete confirmation', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue(createMockIssue())

    renderComponent('0001')

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
    mockGetIssue.mockResolvedValue(createMockIssue({ description: '' }))

    renderComponent('0001')

    await waitFor(() => {
      expect(screen.getByText('No description provided')).toBeInTheDocument()
    })
  })

  it('should handle update failure', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    const mockUpdateIssue = vi.mocked(centyClient.updateIssue)

    mockGetIssue.mockResolvedValue(
      createMockIssue({
        title: 'Original Title',
        description: 'Original description',
      })
    )

    mockUpdateIssue.mockResolvedValue({
      success: false,
      error: 'Update failed',
      issue: undefined,
      manifest: undefined,
      $typeName: 'centy.UpdateIssueResponse',
      $unknown: undefined,
    })

    renderComponent('0001')

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

    mockGetIssue.mockResolvedValue(
      createMockIssue({
        title: 'Original Title',
        description: 'Original description',
      })
    )

    mockUpdateIssue.mockRejectedValue(new Error('Network error'))

    renderComponent('0001')

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

    mockGetIssue.mockResolvedValue(createMockIssue())

    mockDeleteIssue.mockResolvedValue({
      success: false,
      error: 'Delete failed',
      manifest: undefined,
      $typeName: 'centy.DeleteIssueResponse',
      $unknown: undefined,
    })

    renderComponent('0001')

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

    mockGetIssue.mockResolvedValue(createMockIssue())

    mockDeleteIssue.mockRejectedValue(new Error('Network error'))

    renderComponent('0001')

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

    renderComponent('0001')

    await waitFor(() => {
      expect(
        screen.getByText('Failed to connect to daemon')
      ).toBeInTheDocument()
    })
  })

  it('should display correct status badges', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue(
      createMockIssue({
        title: 'In Progress Issue',
        description: 'Description',
        status: 'in-progress',
        priority: 3,
        priorityLabel: 'low',
      })
    )

    renderComponent('0001')

    await waitFor(() => {
      const statusBadge = screen.getByText('in-progress')
      const priorityBadge = screen.getByText('low')

      expect(statusBadge).toHaveClass('status-in-progress')
      expect(priorityBadge).toHaveClass('priority-low')
    })
  })

  it('should display closed status badge', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue(
      createMockIssue({
        title: 'Closed Issue',
        description: 'Description',
        status: 'closed',
      })
    )

    renderComponent('0001')

    await waitFor(() => {
      const statusBadge = screen.getByText('closed')
      expect(statusBadge).toHaveClass('status-closed')
    })
  })

  it('should display issue without metadata gracefully', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    mockGetIssue.mockResolvedValue(
      createMockIssue({
        title: 'Issue Without Metadata',
        description: 'Description',
        hasMetadata: false,
      })
    )

    renderComponent('0001')

    await waitFor(() => {
      expect(screen.getByText('Issue Without Metadata')).toBeInTheDocument()
      expect(screen.getAllByText('unknown')).toHaveLength(2)
    })
  })

  it('should show default error for update with empty error message', async () => {
    const mockGetIssue = vi.mocked(centyClient.getIssue)
    const mockUpdateIssue = vi.mocked(centyClient.updateIssue)

    mockGetIssue.mockResolvedValue(
      createMockIssue({
        title: 'Original Title',
        description: 'Original description',
      })
    )

    mockUpdateIssue.mockResolvedValue({
      success: false,
      error: '',
      issue: undefined,
      manifest: undefined,
      $typeName: 'centy.UpdateIssueResponse',
      $unknown: undefined,
    })

    renderComponent('0001')

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

    mockGetIssue.mockResolvedValue(createMockIssue())

    mockDeleteIssue.mockResolvedValue({
      success: false,
      error: '',
      manifest: undefined,
      $typeName: 'centy.DeleteIssueResponse',
      $unknown: undefined,
    })

    renderComponent('0001')

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

  // Inline Status Selector Tests
  describe('inline status selector', () => {
    it('should show status dropdown when clicking on status badge', async () => {
      const mockGetIssue = vi.mocked(centyClient.getIssue)
      mockGetIssue.mockResolvedValue(
        createMockIssue({
          status: 'open',
        })
      )

      renderComponent('0001')

      await waitFor(() => {
        expect(screen.getByLabelText('Change status')).toBeInTheDocument()
      })

      const statusButton = screen.getByLabelText('Change status')
      fireEvent.click(statusButton)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'open' })).toBeInTheDocument()
        expect(
          screen.getByRole('option', { name: 'in-progress' })
        ).toBeInTheDocument()
        expect(
          screen.getByRole('option', { name: 'closed' })
        ).toBeInTheDocument()
      })
    })

    it('should update status when clicking on a status option', async () => {
      const mockGetIssue = vi.mocked(centyClient.getIssue)
      const mockUpdateIssue = vi.mocked(centyClient.updateIssue)

      mockGetIssue.mockResolvedValue(
        createMockIssue({
          status: 'open',
        })
      )

      mockUpdateIssue.mockResolvedValue({
        success: true,
        error: '',
        issue: createMockIssue({
          status: 'in-progress',
        }),
        manifest: undefined,
        $typeName: 'centy.UpdateIssueResponse',
        $unknown: undefined,
      })

      renderComponent('0001')

      await waitFor(() => {
        expect(screen.getByLabelText('Change status')).toBeInTheDocument()
      })

      const statusButton = screen.getByLabelText('Change status')
      fireEvent.click(statusButton)

      const inProgressOption = await screen.findByRole('option', {
        name: 'in-progress',
      })
      fireEvent.click(inProgressOption)

      await waitFor(() => {
        expect(mockUpdateIssue).toHaveBeenCalledWith(
          expect.objectContaining({
            projectPath: '/test/path',
            issueId: '0001',
            status: 'in-progress',
          })
        )
      })
    })

    it('should show error on status update failure', async () => {
      const mockGetIssue = vi.mocked(centyClient.getIssue)
      const mockUpdateIssue = vi.mocked(centyClient.updateIssue)

      mockGetIssue.mockResolvedValue(
        createMockIssue({
          status: 'open',
        })
      )

      mockUpdateIssue.mockResolvedValue({
        success: false,
        error: 'Status update failed',
        issue: undefined,
        manifest: undefined,
        $typeName: 'centy.UpdateIssueResponse',
        $unknown: undefined,
      })

      renderComponent('0001')

      await waitFor(() => {
        expect(screen.getByLabelText('Change status')).toBeInTheDocument()
      })

      const statusButton = screen.getByLabelText('Change status')
      fireEvent.click(statusButton)

      const closedOption = await screen.findByRole('option', { name: 'closed' })
      fireEvent.click(closedOption)

      await waitFor(() => {
        expect(screen.getByText('Status update failed')).toBeInTheDocument()
      })
    })

    it('should close dropdown when clicking same status', async () => {
      const mockGetIssue = vi.mocked(centyClient.getIssue)

      mockGetIssue.mockResolvedValue(
        createMockIssue({
          status: 'open',
        })
      )

      renderComponent('0001')

      await waitFor(() => {
        expect(screen.getByLabelText('Change status')).toBeInTheDocument()
      })

      const statusButton = screen.getByLabelText('Change status')
      fireEvent.click(statusButton)

      const openOption = await screen.findByRole('option', { name: 'open' })
      fireEvent.click(openOption)

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })
  })
})
