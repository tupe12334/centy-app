import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AssetUploader, type AssetUploaderHandle } from './AssetUploader'
import { createRef } from 'react'

vi.mock('../api/client.ts', () => ({
  centyClient: {
    addAsset: vi.fn(),
    removeAsset: vi.fn(),
    getAsset: vi.fn(),
    listAssets: vi.fn(),
  },
}))

import { centyClient } from '../api/client.ts'

// Helper to create mock Asset data
const createMockAsset = (
  overrides: {
    id?: string
    filename?: string
    mimeType?: string
    sizeBytes?: bigint
  } = {}
) => ({
  id: overrides.id || 'asset-001',
  issueId: 'issue-001',
  filename: overrides.filename || 'test-image.png',
  mimeType: overrides.mimeType || 'image/png',
  sizeBytes: overrides.sizeBytes || BigInt(1024),
  createdAt: '2024-01-15T10:00:00Z',
  $typeName: 'centy.Asset' as const,
  $unknown: undefined,
})

// Helper to create File with working arrayBuffer method
const createMockFile = (
  name: string,
  type: string,
  sizeKB: number = 100
): File => {
  const content = new Array(sizeKB * 1024).fill('a').join('')
  const file = new File([content], name, { type })
  // Mock arrayBuffer to return proper ArrayBuffer
  file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(content.length))
  return file
}

describe('AssetUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => 'blob:test-url')
    global.URL.revokeObjectURL = vi.fn()
    // Mock crypto.randomUUID
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(
      'test-uuid-1234' as `${string}-${string}-${string}-${string}-${string}`
    )
  })

  describe('basic rendering', () => {
    it('should render drop zone', () => {
      render(
        <AssetUploader projectPath="/test/path" mode="create" issueId="" />
      )

      expect(
        screen.getByText('Drag & drop files or click to browse')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Images, videos, or PDFs (max 50MB)')
      ).toBeInTheDocument()
    })

    it('should render with initial assets', () => {
      const mockAsset = createMockAsset({ filename: 'existing.png' })
      vi.mocked(centyClient.getAsset).mockResolvedValue({
        asset: mockAsset,
        content: new Uint8Array([1, 2, 3]),
        $typeName: 'centy.GetAssetResponse',
        $unknown: undefined,
      })

      render(
        <AssetUploader
          projectPath="/test/path"
          issueId="issue-001"
          mode="edit"
          initialAssets={[mockAsset]}
        />
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('file validation', () => {
    it('should reject unsupported file types', async () => {
      render(
        <AssetUploader projectPath="/test/path" mode="create" issueId="" />
      )

      const file = createMockFile('test.exe', 'application/x-msdownload')
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/Unsupported file type/)).toBeInTheDocument()
      })
    })

    it('should reject files larger than 50MB', async () => {
      render(
        <AssetUploader projectPath="/test/path" mode="create" issueId="" />
      )

      // Create a mock file with large size property
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      // Override size property to simulate large file
      Object.defineProperty(file, 'size', { value: 51 * 1024 * 1024 })
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/File too large/)).toBeInTheDocument()
      })
    })

    it('should accept valid image files', async () => {
      const onPendingChange = vi.fn()
      render(
        <AssetUploader
          projectPath="/test/path"
          mode="create"
          issueId=""
          onPendingChange={onPendingChange}
        />
      )

      const file = createMockFile('test.png', 'image/png')
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(onPendingChange).toHaveBeenCalled()
        const pendingAssets = onPendingChange.mock.calls[0][0]
        expect(pendingAssets).toHaveLength(1)
        expect(pendingAssets[0].file.name).toBe('test.png')
      })
    })

    it('should accept video files', async () => {
      const onPendingChange = vi.fn()
      render(
        <AssetUploader
          projectPath="/test/path"
          mode="create"
          issueId=""
          onPendingChange={onPendingChange}
        />
      )

      const file = createMockFile('video.mp4', 'video/mp4')
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(onPendingChange).toHaveBeenCalled()
        const pendingAssets = onPendingChange.mock.calls[0][0]
        expect(pendingAssets).toHaveLength(1)
        expect(pendingAssets[0].file.name).toBe('video.mp4')
      })
    })

    it('should accept PDF files', async () => {
      const onPendingChange = vi.fn()
      render(
        <AssetUploader
          projectPath="/test/path"
          mode="create"
          issueId=""
          onPendingChange={onPendingChange}
        />
      )

      const file = createMockFile('document.pdf', 'application/pdf')
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(onPendingChange).toHaveBeenCalled()
        const pendingAssets = onPendingChange.mock.calls[0][0]
        expect(pendingAssets).toHaveLength(1)
        expect(pendingAssets[0].file.name).toBe('document.pdf')
      })
    })
  })

  describe('drag and drop', () => {
    it('should show drag indicator when dragging over', () => {
      render(
        <AssetUploader projectPath="/test/path" mode="create" issueId="" />
      )

      const dropZone = screen.getByText('Drag & drop files or click to browse')
        .parentElement?.parentElement

      fireEvent.dragOver(dropZone!)

      expect(screen.getByText('Drop files here...')).toBeInTheDocument()
    })

    it('should hide drag indicator when drag leaves', async () => {
      render(
        <AssetUploader projectPath="/test/path" mode="create" issueId="" />
      )

      const dropZone = screen.getByText('Drag & drop files or click to browse')
        .parentElement?.parentElement

      fireEvent.dragOver(dropZone!)
      expect(screen.getByText('Drop files here...')).toBeInTheDocument()

      fireEvent.dragLeave(dropZone!)
      expect(
        screen.getByText('Drag & drop files or click to browse')
      ).toBeInTheDocument()
    })

    it('should handle dropped files', async () => {
      const onPendingChange = vi.fn()
      render(
        <AssetUploader
          projectPath="/test/path"
          mode="create"
          issueId=""
          onPendingChange={onPendingChange}
        />
      )

      const dropZone = screen.getByText('Drag & drop files or click to browse')
        .parentElement?.parentElement

      const file = createMockFile('dropped.jpg', 'image/jpeg')
      const dataTransfer = {
        files: [file],
      }

      fireEvent.drop(dropZone!, { dataTransfer })

      await waitFor(() => {
        expect(onPendingChange).toHaveBeenCalled()
      })
    })
  })

  describe('create mode - pending assets', () => {
    it('should hold assets as pending in create mode', async () => {
      const onPendingChange = vi.fn()
      render(
        <AssetUploader
          projectPath="/test/path"
          mode="create"
          issueId=""
          onPendingChange={onPendingChange}
        />
      )

      const file = createMockFile('test.png', 'image/png')
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(onPendingChange).toHaveBeenCalled()
        const pending = onPendingChange.mock.calls[0][0]
        expect(pending[0].status).toBe('pending')
      })

      // Verify addAsset was NOT called (since we're in create mode without issueId)
      expect(centyClient.addAsset).not.toHaveBeenCalled()
    })

    it('should upload all pending assets via ref', async () => {
      const mockAddAsset = vi.mocked(centyClient.addAsset)
      const mockAsset = createMockAsset()
      mockAddAsset.mockResolvedValue({
        success: true,
        error: '',
        asset: mockAsset,
        $typeName: 'centy.AddAssetResponse',
        $unknown: undefined,
      })

      const ref = createRef<AssetUploaderHandle>()
      const onPendingChange = vi.fn()
      const onAssetsChange = vi.fn()

      render(
        <AssetUploader
          ref={ref}
          projectPath="/test/path"
          mode="create"
          issueId=""
          onPendingChange={onPendingChange}
          onAssetsChange={onAssetsChange}
        />
      )

      // Add a pending file
      const file = createMockFile('test.png', 'image/png')
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(onPendingChange).toHaveBeenCalled()
      })

      // Now call uploadAllPending via ref
      const result = await ref.current!.uploadAllPending('new-issue-id')

      expect(result).toBe(true)
      expect(mockAddAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          projectPath: '/test/path',
          issueId: 'new-issue-id',
        })
      )
    })
  })

  describe('edit mode - immediate upload', () => {
    it('should upload immediately in edit mode', async () => {
      const mockAddAsset = vi.mocked(centyClient.addAsset)
      const mockAsset = createMockAsset()
      mockAddAsset.mockResolvedValue({
        success: true,
        error: '',
        asset: mockAsset,
        $typeName: 'centy.AddAssetResponse',
        $unknown: undefined,
      })

      const onAssetsChange = vi.fn()

      render(
        <AssetUploader
          projectPath="/test/path"
          mode="edit"
          issueId="existing-issue"
          onAssetsChange={onAssetsChange}
        />
      )

      const file = createMockFile('test.png', 'image/png')
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockAddAsset).toHaveBeenCalledWith(
          expect.objectContaining({
            projectPath: '/test/path',
            issueId: 'existing-issue',
            filename: 'test.png',
          })
        )
      })

      await waitFor(() => {
        expect(onAssetsChange).toHaveBeenCalled()
      })
    })

    it('should handle upload failure', async () => {
      const mockAddAsset = vi.mocked(centyClient.addAsset)
      mockAddAsset.mockResolvedValue({
        success: false,
        error: 'Upload failed',
        asset: undefined,
        $typeName: 'centy.AddAssetResponse',
        $unknown: undefined,
      })

      render(
        <AssetUploader
          projectPath="/test/path"
          mode="edit"
          issueId="existing-issue"
        />
      )

      const file = createMockFile('test.png', 'image/png')
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      // Check that error badge is displayed in the DOM
      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })
    })

    it('should handle upload network error', async () => {
      const mockAddAsset = vi.mocked(centyClient.addAsset)
      mockAddAsset.mockRejectedValue(new Error('Network error'))

      render(
        <AssetUploader
          projectPath="/test/path"
          mode="edit"
          issueId="existing-issue"
        />
      )

      const file = createMockFile('test.png', 'image/png')
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      // Check that error badge is displayed in the DOM
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })

  describe('removing assets', () => {
    it('should remove saved asset', async () => {
      const mockRemoveAsset = vi.mocked(centyClient.removeAsset)
      mockRemoveAsset.mockResolvedValue({
        success: true,
        error: '',
        $typeName: 'centy.RemoveAssetResponse',
        $unknown: undefined,
      })

      vi.mocked(centyClient.getAsset).mockResolvedValue({
        asset: createMockAsset(),
        content: new Uint8Array([1, 2, 3]),
        $typeName: 'centy.GetAssetResponse',
        $unknown: undefined,
      })

      const mockAsset = createMockAsset({ filename: 'to-remove.png' })
      const onAssetsChange = vi.fn()

      render(
        <AssetUploader
          projectPath="/test/path"
          mode="edit"
          issueId="issue-001"
          initialAssets={[mockAsset]}
          onAssetsChange={onAssetsChange}
        />
      )

      // Wait for asset preview to load
      await waitFor(() => {
        expect(screen.getByAltText('to-remove.png')).toBeInTheDocument()
      })

      // Click remove button
      const removeBtn = screen.getByTitle('Remove asset')
      fireEvent.click(removeBtn)

      await waitFor(() => {
        expect(mockRemoveAsset).toHaveBeenCalledWith(
          expect.objectContaining({
            projectPath: '/test/path',
            issueId: 'issue-001',
            assetId: 'asset-001',
          })
        )
      })

      await waitFor(() => {
        expect(onAssetsChange).toHaveBeenCalled()
      })
    })

    it('should handle remove failure', async () => {
      const mockRemoveAsset = vi.mocked(centyClient.removeAsset)
      mockRemoveAsset.mockResolvedValue({
        success: false,
        error: 'Remove failed',
        $typeName: 'centy.RemoveAssetResponse',
        $unknown: undefined,
      })

      vi.mocked(centyClient.getAsset).mockResolvedValue({
        asset: createMockAsset(),
        content: new Uint8Array([1, 2, 3]),
        $typeName: 'centy.GetAssetResponse',
        $unknown: undefined,
      })

      const mockAsset = createMockAsset()

      render(
        <AssetUploader
          projectPath="/test/path"
          mode="edit"
          issueId="issue-001"
          initialAssets={[mockAsset]}
        />
      )

      await waitFor(() => {
        expect(screen.getByAltText('test-image.png')).toBeInTheDocument()
      })

      const removeBtn = screen.getByTitle('Remove asset')
      fireEvent.click(removeBtn)

      await waitFor(() => {
        expect(screen.getByText('Remove failed')).toBeInTheDocument()
      })
    })

    it('should remove pending asset', async () => {
      const onPendingChange = vi.fn()

      render(
        <AssetUploader
          projectPath="/test/path"
          mode="create"
          issueId=""
          onPendingChange={onPendingChange}
        />
      )

      // Add a file
      const file = createMockFile('pending.png', 'image/png')
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(onPendingChange).toHaveBeenCalled()
      })

      // Remove the pending asset
      const removeBtn = screen.getByTitle('Remove')
      fireEvent.click(removeBtn)

      await waitFor(() => {
        const lastCall = onPendingChange.mock.calls.at(-1)?.[0]
        expect(lastCall).toHaveLength(0)
      })
    })
  })

  describe('error dismissal', () => {
    it('should dismiss error when clicking dismiss button', async () => {
      render(
        <AssetUploader projectPath="/test/path" mode="create" issueId="" />
      )

      // Trigger an error with unsupported file
      const file = createMockFile('bad.exe', 'application/x-msdownload')
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/Unsupported file type/)).toBeInTheDocument()
      })

      // Click dismiss
      const dismissBtn = screen.getByText('Dismiss')
      fireEvent.click(dismissBtn)

      await waitFor(() => {
        expect(
          screen.queryByText(/Unsupported file type/)
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('asset preview types', () => {
    it('should render PDF preview with icon', async () => {
      vi.mocked(centyClient.getAsset).mockResolvedValue({
        asset: createMockAsset({ mimeType: 'application/pdf' }),
        content: new Uint8Array([1, 2, 3]),
        $typeName: 'centy.GetAssetResponse',
        $unknown: undefined,
      })

      const mockAsset = createMockAsset({
        filename: 'document.pdf',
        mimeType: 'application/pdf',
      })

      render(
        <AssetUploader
          projectPath="/test/path"
          mode="edit"
          issueId="issue-001"
          initialAssets={[mockAsset]}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('PDF')).toBeInTheDocument()
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
      })
    })

    it('should render video preview', async () => {
      vi.mocked(centyClient.getAsset).mockResolvedValue({
        asset: createMockAsset({ mimeType: 'video/mp4' }),
        content: new Uint8Array([1, 2, 3]),
        $typeName: 'centy.GetAssetResponse',
        $unknown: undefined,
      })

      const mockAsset = createMockAsset({
        filename: 'video.mp4',
        mimeType: 'video/mp4',
      })

      render(
        <AssetUploader
          projectPath="/test/path"
          mode="edit"
          issueId="issue-001"
          initialAssets={[mockAsset]}
        />
      )

      await waitFor(() => {
        const video = document.querySelector('video')
        expect(video).toBeInTheDocument()
      })
    })

    it('should show pending video with VID icon', async () => {
      const onPendingChange = vi.fn()
      render(
        <AssetUploader
          projectPath="/test/path"
          mode="create"
          issueId=""
          onPendingChange={onPendingChange}
        />
      )

      const file = createMockFile('video.webm', 'video/webm')
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('VID')).toBeInTheDocument()
        expect(screen.getByText('video.webm')).toBeInTheDocument()
      })
    })

    it('should show pending PDF with PDF icon', async () => {
      render(
        <AssetUploader projectPath="/test/path" mode="create" issueId="" />
      )

      const file = createMockFile('doc.pdf', 'application/pdf')
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getAllByText('PDF')).toHaveLength(1)
        expect(screen.getByText('doc.pdf')).toBeInTheDocument()
      })
    })
  })

  describe('drop zone click', () => {
    it('should open file picker when clicking drop zone', () => {
      render(
        <AssetUploader projectPath="/test/path" mode="create" issueId="" />
      )

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement
      const clickSpy = vi.spyOn(input, 'click')

      const dropZone = screen.getByText('Drag & drop files or click to browse')
        .parentElement?.parentElement

      fireEvent.click(dropZone!)

      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('asset preview loading error', () => {
    it('should handle getAsset error gracefully', async () => {
      vi.mocked(centyClient.getAsset).mockRejectedValue(
        new Error('Failed to fetch')
      )

      const mockAsset = createMockAsset({ filename: 'error.png' })

      render(
        <AssetUploader
          projectPath="/test/path"
          mode="edit"
          issueId="issue-001"
          initialAssets={[mockAsset]}
        />
      )

      // Wait for loading to complete
      await waitFor(
        () => {
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })
  })

  describe('handle remove network error', () => {
    it('should handle remove network error', async () => {
      const mockRemoveAsset = vi.mocked(centyClient.removeAsset)
      mockRemoveAsset.mockRejectedValue(new Error('Network error'))

      vi.mocked(centyClient.getAsset).mockResolvedValue({
        asset: createMockAsset(),
        content: new Uint8Array([1, 2, 3]),
        $typeName: 'centy.GetAssetResponse',
        $unknown: undefined,
      })

      const mockAsset = createMockAsset({ filename: 'network-error.png' })

      render(
        <AssetUploader
          projectPath="/test/path"
          mode="edit"
          issueId="issue-001"
          initialAssets={[mockAsset]}
        />
      )

      await waitFor(() => {
        expect(screen.getByAltText('network-error.png')).toBeInTheDocument()
      })

      const removeBtn = screen.getByTitle('Remove asset')
      fireEvent.click(removeBtn)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })

  describe('initial assets update', () => {
    it('should update assets when initialAssets prop changes', async () => {
      vi.mocked(centyClient.getAsset).mockResolvedValue({
        asset: createMockAsset(),
        content: new Uint8Array([1, 2, 3]),
        $typeName: 'centy.GetAssetResponse',
        $unknown: undefined,
      })

      const asset1 = createMockAsset({ id: 'asset-1', filename: 'first.png' })
      const asset2 = createMockAsset({ id: 'asset-2', filename: 'second.png' })

      const { rerender } = render(
        <AssetUploader
          projectPath="/test/path"
          mode="edit"
          issueId="issue-001"
          initialAssets={[asset1]}
        />
      )

      await waitFor(() => {
        expect(screen.getByAltText('first.png')).toBeInTheDocument()
      })

      // Update initialAssets
      rerender(
        <AssetUploader
          projectPath="/test/path"
          mode="edit"
          issueId="issue-001"
          initialAssets={[asset1, asset2]}
        />
      )

      await waitFor(() => {
        expect(screen.getByAltText('second.png')).toBeInTheDocument()
      })
    })
  })

  describe('uploadAllPending with failures', () => {
    it('should return false when some uploads fail', async () => {
      const mockAddAsset = vi.mocked(centyClient.addAsset)
      // First call succeeds, second fails
      mockAddAsset
        .mockResolvedValueOnce({
          success: true,
          error: '',
          asset: createMockAsset({ id: 'success-asset' }),
          $typeName: 'centy.AddAssetResponse',
          $unknown: undefined,
        })
        .mockResolvedValueOnce({
          success: false,
          error: 'Failed',
          asset: undefined,
          $typeName: 'centy.AddAssetResponse',
          $unknown: undefined,
        })

      let uuidCounter = 0
      vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
        uuidCounter++
        return `test-uuid-${uuidCounter}` as `${string}-${string}-${string}-${string}-${string}`
      })

      const ref = createRef<AssetUploaderHandle>()

      render(
        <AssetUploader
          ref={ref}
          projectPath="/test/path"
          mode="create"
          issueId=""
        />
      )

      // Add two files
      const file1 = createMockFile('file1.png', 'image/png')
      const file2 = createMockFile('file2.png', 'image/png')
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      fireEvent.change(input, { target: { files: [file1, file2] } })

      await waitFor(() => {
        expect(mockAddAsset).toHaveBeenCalledTimes(0)
      })

      // Upload all pending
      const result = await ref.current!.uploadAllPending('new-issue-id')

      expect(result).toBe(false)
    })
  })
})
