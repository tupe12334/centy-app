import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { CreateDoc } from './CreateDoc'

vi.mock('../api/client.ts', () => ({
  centyClient: {
    isInitialized: vi.fn(),
    createDoc: vi.fn(),
  },
}))

const mockUseProject = vi.fn()
vi.mock('../context/ProjectContext.tsx', () => ({
  useProject: () => mockUseProject(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { centyClient } from '../api/client.ts'

describe('CreateDoc', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })
  })

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/docs/new']}>
        <Routes>
          <Route path="/docs/new" element={<CreateDoc />} />
          <Route path="/docs/:slug" element={<div>Doc Detail</div>} />
          <Route path="/docs" element={<div>Docs List</div>} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('should render the form header', () => {
    renderComponent()

    expect(screen.getByText('Create New Document')).toBeInTheDocument()
  })

  it('should show message when no project is selected', () => {
    mockUseProject.mockReturnValue({
      projectPath: '',
      setProjectPath: vi.fn(),
      isInitialized: null,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    expect(
      screen.getByText('Select a project from the header to create a document')
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

  it('should render form fields', () => {
    renderComponent()

    expect(screen.getByLabelText('Title:')).toBeInTheDocument()
    expect(screen.getByLabelText(/Slug/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Content/)).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Create Document')).toBeInTheDocument()
  })

  it('should disable create button when title is empty', () => {
    renderComponent()

    const createBtn = screen.getByText('Create Document')
    expect(createBtn).toBeDisabled()
  })

  it('should enable create button when title is filled', () => {
    renderComponent()

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: 'Test Title' } })

    const createBtn = screen.getByText('Create Document')
    expect(createBtn).not.toBeDisabled()
  })

  it('should navigate on cancel', () => {
    renderComponent()

    fireEvent.click(screen.getByText('Cancel'))

    expect(mockNavigate).toHaveBeenCalledWith('/docs')
  })

  it('should create document successfully', async () => {
    const mockCreateDoc = vi.mocked(centyClient.createDoc)
    mockCreateDoc.mockResolvedValue({
      success: true,
      slug: 'test-doc',
      error: '',
      createdFile: '',
      $typeName: 'centy.CreateDocResponse',
      $unknown: undefined,
    })

    renderComponent()

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: 'Test Document' } })

    const contentInput = screen.getByLabelText(/Content/)
    fireEvent.change(contentInput, { target: { value: '# Content here' } })

    fireEvent.click(screen.getByText('Create Document'))

    await waitFor(() => {
      expect(mockCreateDoc).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/docs/test-doc')
    })
  })

  it('should create document with custom slug', async () => {
    const mockCreateDoc = vi.mocked(centyClient.createDoc)
    mockCreateDoc.mockResolvedValue({
      success: true,
      slug: 'custom-slug',
      error: '',
      createdFile: '',
      $typeName: 'centy.CreateDocResponse',
      $unknown: undefined,
    })

    renderComponent()

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: 'Test Document' } })

    const slugInput = screen.getByLabelText(/Slug/)
    fireEvent.change(slugInput, { target: { value: 'custom-slug' } })

    fireEvent.click(screen.getByText('Create Document'))

    await waitFor(() => {
      expect(mockCreateDoc).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/docs/custom-slug')
    })
  })

  it('should show error when create fails', async () => {
    const mockCreateDoc = vi.mocked(centyClient.createDoc)
    mockCreateDoc.mockResolvedValue({
      success: false,
      slug: '',
      error: 'Document already exists',
      createdFile: '',
      $typeName: 'centy.CreateDocResponse',
      $unknown: undefined,
    })

    renderComponent()

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: 'Test Document' } })

    fireEvent.click(screen.getByText('Create Document'))

    await waitFor(() => {
      expect(screen.getByText('Document already exists')).toBeInTheDocument()
    })
  })

  it('should show default error when create fails without message', async () => {
    const mockCreateDoc = vi.mocked(centyClient.createDoc)
    mockCreateDoc.mockResolvedValue({
      success: false,
      slug: '',
      error: '',
      createdFile: '',
      $typeName: 'centy.CreateDocResponse',
      $unknown: undefined,
    })

    renderComponent()

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: 'Test Document' } })

    fireEvent.click(screen.getByText('Create Document'))

    await waitFor(() => {
      expect(screen.getByText('Failed to create document')).toBeInTheDocument()
    })
  })

  it('should handle network error', async () => {
    const mockCreateDoc = vi.mocked(centyClient.createDoc)
    mockCreateDoc.mockRejectedValue(new Error('Network error'))

    renderComponent()

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: 'Test Document' } })

    fireEvent.click(screen.getByText('Create Document'))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should handle non-Error rejection', async () => {
    const mockCreateDoc = vi.mocked(centyClient.createDoc)
    mockCreateDoc.mockRejectedValue('string error')

    renderComponent()

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: 'Test Document' } })

    fireEvent.click(screen.getByText('Create Document'))

    await waitFor(() => {
      expect(
        screen.getByText('Failed to connect to daemon')
      ).toBeInTheDocument()
    })
  })

  it('should show loading state while creating', async () => {
    const mockCreateDoc = vi.mocked(centyClient.createDoc)
    mockCreateDoc.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderComponent()

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: 'Test Document' } })

    fireEvent.click(screen.getByText('Create Document'))

    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument()
    })
  })

  it('should check initialization when project path changes', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    mockIsInitialized.mockResolvedValue({
      initialized: true,
      centyPath: '',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    const setIsInitialized = vi.fn()
    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: null,
      setIsInitialized,
    })

    renderComponent()

    await waitFor(() => {
      expect(mockIsInitialized).toHaveBeenCalled()
    })
  })

  it('should handle isInitialized error', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    mockIsInitialized.mockRejectedValue(new Error('Connection failed'))

    const setIsInitialized = vi.fn()
    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: null,
      setIsInitialized,
    })

    renderComponent()

    await waitFor(() => {
      expect(setIsInitialized).toHaveBeenCalledWith(false)
    })
  })

  it('should not check initialization when path is empty', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    const setIsInitialized = vi.fn()

    mockUseProject.mockReturnValue({
      projectPath: '',
      setProjectPath: vi.fn(),
      isInitialized: null,
      setIsInitialized,
    })

    renderComponent()

    await waitFor(() => {
      expect(mockIsInitialized).not.toHaveBeenCalled()
    })
  })

  it('should not submit when title is whitespace only', async () => {
    const mockCreateDoc = vi.mocked(centyClient.createDoc)

    renderComponent()

    const titleInput = screen.getByLabelText('Title:')
    fireEvent.change(titleInput, { target: { value: '   ' } })

    fireEvent.click(screen.getByText('Create Document'))

    await waitFor(() => {
      expect(mockCreateDoc).not.toHaveBeenCalled()
    })
  })
})
