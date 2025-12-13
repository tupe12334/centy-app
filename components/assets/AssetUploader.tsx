'use client'

import {
  useState,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  AddAssetRequestSchema,
  DeleteAssetRequestSchema,
  GetAssetRequestSchema,
  type Asset,
} from '@/gen/centy_pb'

// Allowed MIME types
const ALLOWED_TYPES: Record<string, 'image' | 'video' | 'pdf'> = {
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'application/pdf': 'pdf',
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export interface PendingAsset {
  id: string
  file: File
  preview?: string
  status: 'pending' | 'uploading' | 'error'
  error?: string
}

export interface AssetUploaderHandle {
  uploadAllPending: (targetId: string, isPrUpload?: boolean) => Promise<boolean>
}

interface AssetUploaderProps {
  projectPath: string
  issueId?: string
  prId?: string
  onAssetsChange?: (assets: Asset[]) => void
  onPendingChange?: (pending: PendingAsset[]) => void
  initialAssets?: Asset[]
  mode: 'create' | 'edit'
}

export const AssetUploader = forwardRef<
  AssetUploaderHandle,
  AssetUploaderProps
>(function AssetUploader(
  {
    projectPath,
    issueId,
    prId,
    onAssetsChange,
    onPendingChange,
    initialAssets = [],
    mode,
  },
  ref
) {
  // Determine which ID to use for uploads
  const targetId = issueId || prId
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update assets when initialAssets changes (use JSON stringify for stable comparison)
  const initialAssetsKey = JSON.stringify(initialAssets.map(a => a.filename))
  useEffect(() => {
    setAssets(initialAssets)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAssetsKey])

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!Object.keys(ALLOWED_TYPES).includes(file.type)) {
      return `Unsupported file type: ${file.type}`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 50MB)`
    }
    return null
  }, [])

  // Upload single asset to server
  const uploadAsset = useCallback(
    async (pending: PendingAsset, uploadTargetId: string): Promise<boolean> => {
      try {
        const arrayBuffer = await pending.file.arrayBuffer()
        const request = create(AddAssetRequestSchema, {
          projectPath,
          issueId: uploadTargetId,
          filename: pending.file.name,
          data: new Uint8Array(arrayBuffer),
        })

        const response = await centyClient.addAsset(request)

        if (response.success && response.asset) {
          setAssets(prev => {
            const updated = [...prev, response.asset!]
            onAssetsChange?.(updated)
            return updated
          })
          // Remove from pending
          setPendingAssets(prev => {
            const updated = prev.filter(p => p.id !== pending.id)
            onPendingChange?.(updated)
            return updated
          })
          // Revoke object URL if exists
          if (pending.preview) URL.revokeObjectURL(pending.preview)
          return true
        } else {
          // Mark as error
          setPendingAssets(prev =>
            prev.map(p =>
              p.id === pending.id
                ? {
                    ...p,
                    status: 'error' as const,
                    error: response.error || 'Upload failed',
                  }
                : p
            )
          )
          return false
        }
      } catch (err) {
        setPendingAssets(prev =>
          prev.map(p =>
            p.id === pending.id
              ? {
                  ...p,
                  status: 'error' as const,
                  error: err instanceof Error ? err.message : 'Upload failed',
                }
              : p
          )
        )
        return false
      }
    },
    [projectPath, onAssetsChange, onPendingChange]
  )

  // Add files (drag/drop or file picker)
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)

      for (const file of fileArray) {
        const validationError = validateFile(file)
        if (validationError) {
          setError(validationError)
          continue
        }

        const preview = file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined

        const pending: PendingAsset = {
          id: crypto.randomUUID(),
          file,
          preview,
          status: mode === 'edit' && targetId ? 'uploading' : 'pending',
        }

        setPendingAssets(prev => {
          const updated = [...prev, pending]
          onPendingChange?.(updated)
          return updated
        })

        // If in edit mode with existing issue/PR, upload immediately
        if (mode === 'edit' && targetId) {
          await uploadAsset(pending, targetId, !!prId)
        }
      }
    },
    [mode, targetId, prId, onPendingChange, validateFile, uploadAsset]
  )

  // Upload all pending assets (called when issue/PR is created in create mode)
  const uploadAllPending = useCallback(
    async (uploadTargetId: string, isPrUpload = false): Promise<boolean> => {
      let allSuccess = true
      const pendingToUpload = pendingAssets.filter(p => p.status === 'pending')

      for (const pending of pendingToUpload) {
        setPendingAssets(prev =>
          prev.map(p =>
            p.id === pending.id ? { ...p, status: 'uploading' as const } : p
          )
        )
        const success = await uploadAsset(pending, uploadTargetId, isPrUpload)
        if (!success) allSuccess = false
      }
      return allSuccess
    },
    [pendingAssets, uploadAsset]
  )

  // Expose uploadAllPending to parent via ref
  useImperativeHandle(ref, () => ({
    uploadAllPending,
  }))

  // Remove asset from server
  const removeAsset = useCallback(
    async (filename: string) => {
      if (!targetId) return

      try {
        const request = create(DeleteAssetRequestSchema, {
          projectPath,
          issueId: targetId,
          filename,
        })
        const response = await centyClient.deleteAsset(request)

        if (response.success) {
          setAssets(prev => {
            const updated = prev.filter(a => a.filename !== filename)
            onAssetsChange?.(updated)
            return updated
          })
        } else {
          setError(response.error || 'Failed to remove asset')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove asset')
      }
    },
    [projectPath, targetId, onAssetsChange]
  )

  // Remove pending asset
  const removePending = useCallback(
    (pendingId: string) => {
      const pending = pendingAssets.find(p => p.id === pendingId)
      if (pending?.preview) URL.revokeObjectURL(pending.preview)
      setPendingAssets(prev => {
        const updated = prev.filter(p => p.id !== pendingId)
        onPendingChange?.(updated)
        return updated
      })
    },
    [pendingAssets, onPendingChange]
  )

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      pendingAssets.forEach(p => {
        if (p.preview) URL.revokeObjectURL(p.preview)
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="asset-uploader">
      {/* Drop Zone */}
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,application/pdf"
          onChange={e => e.target.files && handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
        <div className="drop-zone-content">
          <span className="drop-zone-icon">+</span>
          <span className="drop-zone-text">
            {isDragging
              ? 'Drop files here...'
              : 'Drag & drop files or click to browse'}
          </span>
          <span className="drop-zone-hint">
            Images, videos, or PDFs (max 50MB)
          </span>
        </div>
      </div>

      {error && (
        <div className="asset-error">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Asset Grid */}
      {(assets.length > 0 || pendingAssets.length > 0) && (
        <div className="asset-grid">
          {/* Existing Assets */}
          {assets.map(asset => (
            <AssetPreviewItem
              key={asset.filename}
              asset={asset}
              projectPath={projectPath}
              issueId={issueId!}
              onRemove={() => removeAsset(asset.filename)}
            />
          ))}

          {/* Pending Assets */}
          {pendingAssets.map(pending => (
            <PendingAssetPreviewItem
              key={pending.id}
              pending={pending}
              onRemove={() => removePending(pending.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
})

// Asset Preview for saved assets
interface AssetPreviewItemProps {
  asset: Asset
  projectPath: string
  issueId: string
  onRemove: () => void
}

function AssetPreviewItem({
  asset,
  projectPath,
  issueId,
  onRemove,
}: AssetPreviewItemProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadPreview = async () => {
      if (
        asset.mimeType.startsWith('image/') ||
        asset.mimeType.startsWith('video/')
      ) {
        try {
          const request = create(GetAssetRequestSchema, {
            projectPath,
            issueId,
            filename: asset.filename,
          })
          const response = await centyClient.getAsset(request)
          if (mounted && response.data) {
            // Create a new Uint8Array copy for Blob compatibility
            const bytes = new Uint8Array(response.data)
            const blob = new Blob([bytes], { type: asset.mimeType })
            setPreviewUrl(URL.createObjectURL(blob))
          }
        } catch (err) {
          console.error('Failed to load asset preview:', err)
        }
      }
      if (mounted) setLoading(false)
    }
    loadPreview()

    return () => {
      mounted = false
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [asset, projectPath, issueId]) // eslint-disable-line react-hooks/exhaustive-deps

  const type = asset.mimeType.startsWith('image/')
    ? 'image'
    : asset.mimeType.startsWith('video/')
      ? 'video'
      : 'pdf'

  return (
    <div className="asset-preview">
      {loading ? (
        <div className="asset-loading">Loading...</div>
      ) : type === 'image' && previewUrl ? (
        <img
          src={previewUrl}
          alt={asset.filename}
          className="asset-preview-image"
        />
      ) : type === 'video' && previewUrl ? (
        <video src={previewUrl} className="asset-preview-video" muted />
      ) : (
        <div className="asset-preview-pdf">
          <span className="asset-preview-pdf-icon">PDF</span>
          <span className="asset-preview-pdf-name">{asset.filename}</span>
        </div>
      )}
      <div className="asset-overlay">
        <button
          className="asset-remove-btn"
          onClick={onRemove}
          title="Remove asset"
        >
          x
        </button>
      </div>
    </div>
  )
}

// Pending Asset Preview
interface PendingAssetPreviewItemProps {
  pending: PendingAsset
  onRemove: () => void
}

function PendingAssetPreviewItem({
  pending,
  onRemove,
}: PendingAssetPreviewItemProps) {
  const type = pending.file.type.startsWith('image/')
    ? 'image'
    : pending.file.type.startsWith('video/')
      ? 'video'
      : 'pdf'

  return (
    <div className={`asset-preview pending ${pending.status}`}>
      {type === 'image' && pending.preview ? (
        <img
          src={pending.preview}
          alt={pending.file.name}
          className="asset-preview-image"
        />
      ) : type === 'video' ? (
        <div className="asset-preview-pdf">
          <span className="asset-preview-pdf-icon">VID</span>
          <span className="asset-preview-pdf-name">{pending.file.name}</span>
        </div>
      ) : (
        <div className="asset-preview-pdf">
          <span className="asset-preview-pdf-icon">PDF</span>
          <span className="asset-preview-pdf-name">{pending.file.name}</span>
        </div>
      )}

      {pending.status === 'error' && (
        <div className="asset-error-badge">
          {pending.error || 'Upload failed'}
        </div>
      )}

      <div className="asset-overlay">
        <button className="asset-remove-btn" onClick={onRemove} title="Remove">
          x
        </button>
      </div>
    </div>
  )
}
