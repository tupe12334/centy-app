import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { SharedAssets } from './SharedAssets'

vi.mock('../api/client.ts', () => ({
  centyClient: {
    isInitialized: vi.fn(),
    listSharedAssets: vi.fn(),
    deleteAsset: vi.fn(),
    getAsset: vi.fn(),
  },
}))

const mockUseProject = vi.fn()
vi.mock('../context/ProjectContext.tsx', () => ({
  useProject: () => mockUseProject(),
}))

import { centyClient } from '../api/client.ts'

const createMockAsset = (
  overrides: {
    filename?: string
    hash?: string
    size?: bigint
    mimeType?: string
    isShared?: boolean
  } = {}
) => ({
  filename: overrides.filename || 'test-image.png',
  hash: overrides.hash || 'abc123def456',
  size: overrides.size || BigInt(1024),
  mimeType: overrides.mimeType || 'image/png',
  isShared: overrides.isShared ?? true,
  createdAt: '2024-01-15T10:00:00Z',
  $typeName: 'centy.Asset' as const,
  $unknown: undefined,
})

describe('SharedAssets', () => {
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
        <SharedAssets />
      </BrowserRouter>
    )
  }

  it('should render the page header', () => {
    renderComponent()

    expect(screen.getByText('Shared Assets')).toBeInTheDocument()
  })

  it('should show message when no project is selected', () => {
    renderComponent()

    expect(
      screen.getByText('Select a project from the header to view shared assets')
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

  it('should show empty state when no assets exist', async () => {
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    mockListSharedAssets.mockResolvedValue({
      assets: [],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse',
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
      expect(screen.getByText('No shared assets found')).toBeInTheDocument()
    })
  })

  it('should display list of assets', async () => {
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    mockListSharedAssets.mockResolvedValue({
      assets: [
        createMockAsset({ filename: 'image1.png', mimeType: 'image/png' }),
        createMockAsset({ filename: 'video1.mp4', mimeType: 'video/mp4' }),
        createMockAsset({ filename: 'doc1.pdf', mimeType: 'application/pdf' }),
      ],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse',
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
      expect(screen.getByText('image1.png')).toBeInTheDocument()
      expect(screen.getByText('video1.mp4')).toBeInTheDocument()
      expect(screen.getByText('doc1.pdf')).toBeInTheDocument()
    })
  })

  it('should show correct preview placeholders', async () => {
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    mockListSharedAssets.mockResolvedValue({
      assets: [
        createMockAsset({ filename: 'image1.png', mimeType: 'image/png' }),
        createMockAsset({ filename: 'video1.mp4', mimeType: 'video/mp4' }),
        createMockAsset({ filename: 'doc1.pdf', mimeType: 'application/pdf' }),
      ],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse',
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
      expect(screen.getByText('IMG')).toBeInTheDocument()
      expect(screen.getByText('VID')).toBeInTheDocument()
      expect(screen.getByText('FILE')).toBeInTheDocument()
    })
  })

  it('should show refresh button when project is initialized', async () => {
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    mockListSharedAssets.mockResolvedValue({
      assets: [],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse',
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
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    mockListSharedAssets.mockRejectedValue(new Error('Connection refused'))

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
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    mockListSharedAssets.mockRejectedValue('string error')

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

  it('should refresh assets when clicking refresh button', async () => {
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    mockListSharedAssets.mockResolvedValue({
      assets: [],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse',
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

    mockListSharedAssets.mockClear()

    const refreshBtn = screen.getByText('Refresh')
    fireEvent.click(refreshBtn)

    await waitFor(() => {
      expect(mockListSharedAssets).toHaveBeenCalled()
    })
  })

  it('should show delete confirmation when clicking delete button', async () => {
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    mockListSharedAssets.mockResolvedValue({
      assets: [createMockAsset({ filename: 'test.png' })],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse',
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
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByTitle('Delete asset')
    fireEvent.click(deleteBtn)

    expect(screen.getByText(/Delete.*test.png/)).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('should cancel delete when clicking cancel button', async () => {
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    mockListSharedAssets.mockResolvedValue({
      assets: [createMockAsset({ filename: 'test.png' })],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse',
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
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByTitle('Delete asset')
    fireEvent.click(deleteBtn)

    const cancelBtn = screen.getByText('Cancel')
    fireEvent.click(cancelBtn)

    expect(screen.queryByText(/Delete.*test.png/)).not.toBeInTheDocument()
  })

  it('should delete asset when confirming delete', async () => {
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    const mockDeleteAsset = vi.mocked(centyClient.deleteAsset)

    mockListSharedAssets.mockResolvedValue({
      assets: [createMockAsset({ filename: 'test.png' })],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse',
      $unknown: undefined,
    })

    mockDeleteAsset.mockResolvedValue({
      success: true,
      filename: 'test.png',
      wasShared: true,
      error: '',
      $typeName: 'centy.DeleteAssetResponse',
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
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByTitle('Delete asset')
    fireEvent.click(deleteBtn)

    const confirmBtn = screen.getByText('Delete')
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockDeleteAsset).toHaveBeenCalled()
      expect(screen.queryByText('test.png')).not.toBeInTheDocument()
    })
  })

  it('should show error when delete fails', async () => {
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    const mockDeleteAsset = vi.mocked(centyClient.deleteAsset)

    mockListSharedAssets.mockResolvedValue({
      assets: [createMockAsset({ filename: 'test.png' })],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse',
      $unknown: undefined,
    })

    mockDeleteAsset.mockResolvedValue({
      success: false,
      filename: '',
      wasShared: false,
      error: 'Permission denied',
      $typeName: 'centy.DeleteAssetResponse',
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
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByTitle('Delete asset')
    fireEvent.click(deleteBtn)

    const confirmBtn = screen.getByText('Delete')
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText('Permission denied')).toBeInTheDocument()
    })
  })

  it('should handle delete network error', async () => {
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    const mockDeleteAsset = vi.mocked(centyClient.deleteAsset)

    mockListSharedAssets.mockResolvedValue({
      assets: [createMockAsset({ filename: 'test.png' })],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse',
      $unknown: undefined,
    })

    mockDeleteAsset.mockRejectedValue(new Error('Network error'))

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByTitle('Delete asset')
    fireEvent.click(deleteBtn)

    const confirmBtn = screen.getByText('Delete')
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should show preview modal for image', async () => {
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    const mockGetAsset = vi.mocked(centyClient.getAsset)

    const asset = createMockAsset({
      filename: 'test.png',
      mimeType: 'image/png',
    })
    mockListSharedAssets.mockResolvedValue({
      assets: [asset],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse',
      $unknown: undefined,
    })

    mockGetAsset.mockResolvedValue({
      success: true,
      data: new Uint8Array([1, 2, 3]),
      error: '',
      $typeName: 'centy.GetAssetResponse',
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
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })

    // Click on the preview placeholder
    const previewPlaceholder = screen.getByText('IMG')
    fireEvent.click(previewPlaceholder)

    await waitFor(() => {
      expect(mockGetAsset).toHaveBeenCalled()
    })
  })

  it('should close preview modal when clicking close button', async () => {
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    const mockGetAsset = vi.mocked(centyClient.getAsset)

    mockListSharedAssets.mockResolvedValue({
      assets: [createMockAsset({ filename: 'test.png' })],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse',
      $unknown: undefined,
    })

    mockGetAsset.mockResolvedValue({
      success: true,
      data: new Uint8Array([1, 2, 3]),
      error: '',
      $typeName: 'centy.GetAssetResponse',
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
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })

    const previewPlaceholder = screen.getByText('IMG')
    fireEvent.click(previewPlaceholder)

    await waitFor(() => {
      // There should be a close button (the 'x')
      const closeButtons = screen.getAllByText('x')
      expect(closeButtons.length).toBeGreaterThan(0)
    })

    // Click the close button (last one is the preview modal's close)
    const closeButtons = screen.getAllByText('x')
    fireEvent.click(closeButtons[closeButtons.length - 1])

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  it('should display file size correctly', async () => {
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    mockListSharedAssets.mockResolvedValue({
      assets: [
        createMockAsset({ filename: 'small.png', size: BigInt(500) }),
        createMockAsset({ filename: 'medium.png', size: BigInt(5000) }),
        createMockAsset({ filename: 'large.png', size: BigInt(5000000) }),
      ],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse',
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
      expect(screen.getByText('500 B')).toBeInTheDocument()
      expect(screen.getByText('4.9 KB')).toBeInTheDocument()
      expect(screen.getByText('4.8 MB')).toBeInTheDocument()
    })
  })

  it('should check initialization when project path changes', async () => {
    const mockIsInitialized = vi.mocked(centyClient.isInitialized)
    mockIsInitialized.mockResolvedValue({
      initialized: true,
      centyPath: '/test/path/.centy',
      $typeName: 'centy.IsInitializedResponse',
      $unknown: undefined,
    })

    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    mockListSharedAssets.mockResolvedValue({
      assets: [],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse',
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

  it('should handle preview error', async () => {
    const mockListSharedAssets = vi.mocked(centyClient.listSharedAssets)
    const mockGetAsset = vi.mocked(centyClient.getAsset)

    mockListSharedAssets.mockResolvedValue({
      assets: [createMockAsset({ filename: 'test.png' })],
      totalCount: 0,
      $typeName: 'centy.ListAssetsResponse',
      $unknown: undefined,
    })

    mockGetAsset.mockRejectedValue(new Error('Failed to load'))

    mockUseProject.mockReturnValue({
      projectPath: '/test/path',
      setProjectPath: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })

    const previewPlaceholder = screen.getByText('IMG')
    fireEvent.click(previewPlaceholder)

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument()
    })
  })
})
