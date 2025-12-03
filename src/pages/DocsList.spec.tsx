import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { DocsList } from './DocsList'

vi.mock('../api/client.ts', () => ({
  centyClient: {
    isInitialized: vi.fn(),
    listDocs: vi.fn(),
    deleteDoc: vi.fn(),
  },
}))

const mockUseProject = vi.fn()
vi.mock('../context/ProjectContext.tsx', () => ({
  useProject: () => mockUseProject(),
}))

import { centyClient } from '../api/client.ts'

const createMockDoc = (
  overrides: {
    slug?: string
    title?: string
    content?: string
    hasMetadata?: boolean
  } = {}
) => ({
  slug: overrides.slug || 'test-doc',
  title: overrides.title || 'Test Document',
  content: overrides.content || 'Test content',
  metadata:
    overrides.hasMetadata === false
      ? undefined
      : {
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          $typeName: 'centy.DocMetadata' as const,
          $unknown: undefined,
        },
  $typeName: 'centy.Doc' as const,
  $unknown: undefined,
})

describe('DocsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
        <DocsList />
      </BrowserRouter>
    )
  }

  it('should render the page header', () => {
    renderComponent()

    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(screen.getByText('+ New Doc')).toBeInTheDocument()
  })

  it('should show message when no project is selected', () => {
    renderComponent()

    expect(
      screen.getByText('Select a project from the header to view documentation')
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

  it('should show empty state when no docs exist', async () => {
    const mockListDocs = vi.mocked(centyClient.listDocs)
    mockListDocs.mockResolvedValue({
      docs: [],
      totalCount: 0,
      $typeName: 'centy.ListDocsResponse',
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
      expect(screen.getByText('No documentation found')).toBeInTheDocument()
      expect(screen.getByText('Create your first document')).toBeInTheDocument()
    })
  })

  it('should display list of docs', async () => {
    const mockListDocs = vi.mocked(centyClient.listDocs)
    mockListDocs.mockResolvedValue({
      docs: [
        createMockDoc({ slug: 'getting-started', title: 'Getting Started' }),
        createMockDoc({ slug: 'api-docs', title: 'API Documentation' }),
      ],
      totalCount: 0,
      $typeName: 'centy.ListDocsResponse',
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
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('API Documentation')).toBeInTheDocument()
      expect(screen.getByText('getting-started')).toBeInTheDocument()
      expect(screen.getByText('api-docs')).toBeInTheDocument()
    })
  })

  it('should show refresh button when project is initialized', async () => {
    const mockListDocs = vi.mocked(centyClient.listDocs)
    mockListDocs.mockResolvedValue({
      docs: [],
      totalCount: 0,
      $typeName: 'centy.ListDocsResponse',
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
  })

  it('should handle network errors', async () => {
    const mockListDocs = vi.mocked(centyClient.listDocs)
    mockListDocs.mockRejectedValue(new Error('Connection refused'))

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

  it('should handle non-Error rejection', async () => {
    const mockListDocs = vi.mocked(centyClient.listDocs)
    mockListDocs.mockRejectedValue('string error')

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

  it('should refresh docs when clicking refresh button', async () => {
    const mockListDocs = vi.mocked(centyClient.listDocs)
    mockListDocs.mockResolvedValue({
      docs: [],
      totalCount: 0,
      $typeName: 'centy.ListDocsResponse',
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

    mockListDocs.mockClear()

    const refreshBtn = screen.getByText('Refresh')
    fireEvent.click(refreshBtn)

    await waitFor(() => {
      expect(mockListDocs).toHaveBeenCalled()
    })
  })

  it('should show delete confirmation when clicking delete button', async () => {
    const mockListDocs = vi.mocked(centyClient.listDocs)
    mockListDocs.mockResolvedValue({
      docs: [createMockDoc({ slug: 'test-doc', title: 'Test Document' })],
      totalCount: 1,
      $typeName: 'centy.ListDocsResponse',
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
      expect(screen.getByText('Test Document')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByTitle('Delete document')
    fireEvent.click(deleteBtn)

    expect(screen.getByText(/Delete.*Test Document/)).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('should cancel delete when clicking cancel button', async () => {
    const mockListDocs = vi.mocked(centyClient.listDocs)
    mockListDocs.mockResolvedValue({
      docs: [createMockDoc({ slug: 'test-doc', title: 'Test Document' })],
      totalCount: 1,
      $typeName: 'centy.ListDocsResponse',
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
      expect(screen.getByText('Test Document')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByTitle('Delete document')
    fireEvent.click(deleteBtn)

    const cancelBtn = screen.getByText('Cancel')
    fireEvent.click(cancelBtn)

    expect(screen.queryByText(/Delete.*Test Document/)).not.toBeInTheDocument()
  })

  it('should delete doc when confirming delete', async () => {
    const mockListDocs = vi.mocked(centyClient.listDocs)
    const mockDeleteDoc = vi.mocked(centyClient.deleteDoc)

    mockListDocs.mockResolvedValue({
      docs: [createMockDoc({ slug: 'test-doc', title: 'Test Document' })],
      totalCount: 1,
      $typeName: 'centy.ListDocsResponse',
      $unknown: undefined,
    })

    mockDeleteDoc.mockResolvedValue({
      success: true,
      error: '',
      $typeName: 'centy.DeleteDocResponse',
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
      expect(screen.getByText('Test Document')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByTitle('Delete document')
    fireEvent.click(deleteBtn)

    const confirmBtn = screen.getByText('Delete')
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockDeleteDoc).toHaveBeenCalled()
      expect(screen.queryByText('Test Document')).not.toBeInTheDocument()
    })
  })

  it('should show error when delete fails', async () => {
    const mockListDocs = vi.mocked(centyClient.listDocs)
    const mockDeleteDoc = vi.mocked(centyClient.deleteDoc)

    mockListDocs.mockResolvedValue({
      docs: [createMockDoc({ slug: 'test-doc', title: 'Test Document' })],
      totalCount: 1,
      $typeName: 'centy.ListDocsResponse',
      $unknown: undefined,
    })

    mockDeleteDoc.mockResolvedValue({
      success: false,
      error: 'Permission denied',
      $typeName: 'centy.DeleteDocResponse',
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
      expect(screen.getByText('Test Document')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByTitle('Delete document')
    fireEvent.click(deleteBtn)

    const confirmBtn = screen.getByText('Delete')
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText('Permission denied')).toBeInTheDocument()
    })
  })

  it('should handle delete network error', async () => {
    const mockListDocs = vi.mocked(centyClient.listDocs)
    const mockDeleteDoc = vi.mocked(centyClient.deleteDoc)

    mockListDocs.mockResolvedValue({
      docs: [createMockDoc({ slug: 'test-doc', title: 'Test Document' })],
      totalCount: 1,
      $typeName: 'centy.ListDocsResponse',
      $unknown: undefined,
    })

    mockDeleteDoc.mockRejectedValue(new Error('Network error'))

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByTitle('Delete document')
    fireEvent.click(deleteBtn)

    const confirmBtn = screen.getByText('Delete')
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should display doc without metadata gracefully', async () => {
    const mockListDocs = vi.mocked(centyClient.listDocs)
    mockListDocs.mockResolvedValue({
      docs: [
        createMockDoc({
          slug: 'test-doc',
          title: 'Test Document',
          hasMetadata: false,
        }),
      ],
      totalCount: 0,
      $typeName: 'centy.ListDocsResponse',
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
      expect(screen.getByText('Test Document')).toBeInTheDocument()
      expect(screen.queryByText('Updated:')).not.toBeInTheDocument()
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

    const mockListDocs = vi.mocked(centyClient.listDocs)
    mockListDocs.mockResolvedValue({
      docs: [],
      totalCount: 0,
      $typeName: 'centy.ListDocsResponse',
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

    await waitFor(
      () => {
        expect(mockIsInitialized).toHaveBeenCalled()
      },
      { timeout: 500 }
    )
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

    await waitFor(
      () => {
        expect(setIsInitialized).toHaveBeenCalledWith(false)
      },
      { timeout: 500 }
    )
  })

  it('should not fetch docs when project path is empty', async () => {
    const mockListDocs = vi.mocked(centyClient.listDocs)

    mockUseProject.mockReturnValue({
      projectPath: '',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(mockListDocs).not.toHaveBeenCalled()
    })
  })
})
