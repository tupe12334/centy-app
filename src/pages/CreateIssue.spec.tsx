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

const mockUseProject = vi.fn()
vi.mock('../context/ProjectContext.tsx', () => ({
  useProject: () => mockUseProject(),
}))

import { centyClient } from '../api/client.ts'

describe('CreateIssue', () => {
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
        <CreateIssue />
      </BrowserRouter>
    )
  }

  it('should render the page header', () => {
    renderComponent()

    expect(screen.getByText('Create New Issue')).toBeInTheDocument()
  })

  it('should show message when no project is selected', () => {
    renderComponent()

    expect(
      screen.getByText('Select a project from the header to create an issue')
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

  it('should show form when project is initialized', () => {
    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    expect(screen.getByLabelText('Title:')).toBeInTheDocument()
    expect(screen.getByLabelText('Description:')).toBeInTheDocument()
    expect(screen.getByLabelText('Priority:')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create Issue' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('should disable submit button when title is empty', () => {
    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    const submitBtn = screen.getByRole('button', { name: 'Create Issue' })
    expect(submitBtn).toBeDisabled()
  })

  it('should enable submit button when title is filled', () => {
    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: 'Test Issue' } })

    const submitBtn = screen.getByRole('button', { name: 'Create Issue' })
    expect(submitBtn).toBeEnabled()
  })

  it('should create issue and navigate on success', async () => {
    const mockCreateIssue = vi.mocked(centyClient.createIssue)
    mockCreateIssue.mockResolvedValue({
      success: true,
      error: '',
      issueNumber: '0001',
      createdFiles: ['issues/0001.md'],
      manifest: undefined,
      $typeName: 'centy.CreateIssueResponse',
      $unknown: undefined,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    const titleInput = screen.getByLabelText('Title:')
    const descriptionInput = screen.getByLabelText('Description:')

    fireEvent.change(titleInput, { target: { value: 'Test Issue' } })
    fireEvent.change(descriptionInput, {
      target: { value: 'Test description' },
    })

    const submitBtn = screen.getByRole('button', { name: 'Create Issue' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockCreateIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          projectPath: '/test/path',
          title: 'Test Issue',
          description: 'Test description',
          priority: 2,
          status: 'open',
        })
      )
    })

    expect(mockNavigate).toHaveBeenCalledWith('/issues/0001')
  })

  it('should show error on create failure', async () => {
    const mockCreateIssue = vi.mocked(centyClient.createIssue)
    mockCreateIssue.mockResolvedValue({
      success: false,
      error: 'Failed to create issue',
      issueNumber: '',
      createdFiles: [],
      manifest: undefined,
      $typeName: 'centy.CreateIssueResponse',
      $unknown: undefined,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: 'Test Issue' } })

    const submitBtn = screen.getByRole('button', { name: 'Create Issue' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Failed to create issue')).toBeInTheDocument()
    })
  })

  it('should handle network errors', async () => {
    const mockCreateIssue = vi.mocked(centyClient.createIssue)
    mockCreateIssue.mockRejectedValue(new Error('Network error'))

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: 'Test Issue' } })

    const submitBtn = screen.getByRole('button', { name: 'Create Issue' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should navigate to issues list on cancel', () => {
    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/issues')
  })

  it('should allow changing priority', () => {
    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    const prioritySelect = screen.getByLabelText('Priority:')
    expect(prioritySelect).toHaveValue('2') // medium = 2

    fireEvent.change(prioritySelect, { target: { value: '1' } })
    expect(prioritySelect).toHaveValue('1') // high = 1
  })

  it('should use default error message when createIssue returns empty error', async () => {
    const mockCreateIssue = vi.mocked(centyClient.createIssue)
    mockCreateIssue.mockResolvedValue({
      success: false,
      error: '',
      issueNumber: '',
      createdFiles: [],
      manifest: undefined,
      $typeName: 'centy.CreateIssueResponse',
      $unknown: undefined,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: 'Test Issue' } })

    const submitBtn = screen.getByRole('button', { name: 'Create Issue' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Failed to create issue')).toBeInTheDocument()
    })
  })

  it('should handle non-Error rejection', async () => {
    const mockCreateIssue = vi.mocked(centyClient.createIssue)
    mockCreateIssue.mockRejectedValue('string error')

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: 'Test Issue' } })

    const submitBtn = screen.getByRole('button', { name: 'Create Issue' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(
        screen.getByText('Failed to connect to daemon')
      ).toBeInTheDocument()
    })
  })

  it('should check initialization when project path changes and isInitialized is null', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    const mockSetIsInitialized = vi.fn()

    mockIsInitialized.mockResolvedValue({
      initialized: true,
      centyPath: '/test/path/.centy',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: null,
      setIsInitialized: mockSetIsInitialized,
    })

    renderComponent()

    await waitFor(() => {
      expect(mockIsInitialized).toHaveBeenCalled()
    })
  })

  it('should set isInitialized to false on isInitialized network error', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    const mockSetIsInitialized = vi.fn()

    mockIsInitialized.mockRejectedValue(new Error('Network error'))

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: null,
      setIsInitialized: mockSetIsInitialized,
    })

    renderComponent()

    await waitFor(() => {
      expect(mockSetIsInitialized).toHaveBeenCalledWith(false)
    })
  })
})
