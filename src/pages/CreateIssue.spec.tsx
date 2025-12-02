import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { CreateIssue } from './CreateIssue'

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
    isInitialized: vi.fn(),
    createIssue: vi.fn(),
  },
}))

import { centyClient } from '../api/client.ts'

describe('CreateIssue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <CreateIssue />
      </BrowserRouter>
    )
  }

  it('should render the form', () => {
    renderComponent()

    expect(screen.getByText('Create New Issue')).toBeInTheDocument()
    expect(screen.getByLabelText('Project Path:')).toBeInTheDocument()
    expect(screen.getByLabelText('Title:')).toBeInTheDocument()
    expect(screen.getByLabelText('Description:')).toBeInTheDocument()
    expect(screen.getByLabelText('Priority:')).toBeInTheDocument()
  })

  it('should disable submit button when required fields are empty', () => {
    renderComponent()

    const submitBtn = screen.getByRole('button', { name: 'Create Issue' })
    expect(submitBtn).toBeDisabled()
  })

  it('should enable submit button when required fields are filled and project is initialized', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    mockIsInitialized.mockResolvedValue({
      initialized: true,
      centyPath: '/test/path/.centy',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    renderComponent()

    const projectInput = screen.getByLabelText('Project Path:')
    const titleInput = screen.getByLabelText('Title:')

    fireEvent.change(projectInput, { target: { value: '/test/path' } })
    fireEvent.change(titleInput, { target: { value: 'Test Issue' } })

    await waitFor(() => {
      expect(screen.getByText('Centy project found')).toBeInTheDocument()
    })

    const submitBtn = screen.getByRole('button', { name: 'Create Issue' })
    expect(submitBtn).toBeEnabled()
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

  it('should create issue and navigate on success', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    const mockCreateIssue = vi.mocked(centyClient.createIssue)

    mockIsInitialized.mockResolvedValue({
      initialized: true,
      centyPath: '/test/path/.centy',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    mockCreateIssue.mockResolvedValue({
      success: true,
      error: '',
      issueNumber: '0001',
      createdFiles: ['issues/0001.md'],
      manifest: undefined,
      $typeName: 'centy.CreateIssueResponse',
      $unknown: undefined,
    })

    renderComponent()

    const projectInput = screen.getByLabelText('Project Path:')
    const titleInput = screen.getByLabelText('Title:')
    const descriptionInput = screen.getByLabelText('Description:')

    fireEvent.change(projectInput, { target: { value: '/test/path' } })
    fireEvent.change(titleInput, { target: { value: 'Test Issue' } })
    fireEvent.change(descriptionInput, {
      target: { value: 'Test description' },
    })

    await waitFor(() => {
      expect(screen.getByText('Centy project found')).toBeInTheDocument()
    })

    const submitBtn = screen.getByRole('button', { name: 'Create Issue' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockCreateIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          projectPath: '/test/path',
          title: 'Test Issue',
          description: 'Test description',
          priority: 'medium',
          status: 'open',
        })
      )
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      '/issues/0001?project=%2Ftest%2Fpath'
    )
  })

  it('should show error on create failure', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    const mockCreateIssue = vi.mocked(centyClient.createIssue)

    mockIsInitialized.mockResolvedValue({
      initialized: true,
      centyPath: '/test/path/.centy',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    mockCreateIssue.mockResolvedValue({
      success: false,
      error: 'Failed to create issue',
      issueNumber: '',
      createdFiles: [],
      manifest: undefined,
      $typeName: 'centy.CreateIssueResponse',
      $unknown: undefined,
    })

    renderComponent()

    const projectInput = screen.getByLabelText('Project Path:')
    const titleInput = screen.getByLabelText('Title:')

    fireEvent.change(projectInput, { target: { value: '/test/path' } })
    fireEvent.change(titleInput, { target: { value: 'Test Issue' } })

    await waitFor(() => {
      expect(screen.getByText('Centy project found')).toBeInTheDocument()
    })

    const submitBtn = screen.getByRole('button', { name: 'Create Issue' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Failed to create issue')).toBeInTheDocument()
    })
  })

  it('should handle network errors', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    const mockCreateIssue = vi.mocked(centyClient.createIssue)

    mockIsInitialized.mockResolvedValue({
      initialized: true,
      centyPath: '/test/path/.centy',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    mockCreateIssue.mockRejectedValue(new Error('Network error'))

    renderComponent()

    const projectInput = screen.getByLabelText('Project Path:')
    const titleInput = screen.getByLabelText('Title:')

    fireEvent.change(projectInput, { target: { value: '/test/path' } })
    fireEvent.change(titleInput, { target: { value: 'Test Issue' } })

    await waitFor(() => {
      expect(screen.getByText('Centy project found')).toBeInTheDocument()
    })

    const submitBtn = screen.getByRole('button', { name: 'Create Issue' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should navigate to issues list on cancel', async () => {
    renderComponent()

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/issues')
  })

  it('should allow changing priority', () => {
    renderComponent()

    const prioritySelect = screen.getByLabelText('Priority:')
    expect(prioritySelect).toHaveValue('medium')

    fireEvent.change(prioritySelect, { target: { value: 'high' } })
    expect(prioritySelect).toHaveValue('high')
  })
})
