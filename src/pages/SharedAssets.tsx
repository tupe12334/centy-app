import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { centyClient } from '../api/client.ts'
import { create } from '@bufbuild/protobuf'
import {
  ListSharedAssetsRequestSchema,
  DeleteAssetRequestSchema,
  GetAssetRequestSchema,
  IsInitializedRequestSchema,
  type Asset,
} from '../gen/centy_pb.ts'
import { useProject } from '../context/ProjectContext.tsx'
import './SharedAssets.css'

export function SharedAssets() {
  const { projectPath, isInitialized, setIsInitialized } = useProject()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<{
    asset: Asset
    url: string
  } | null>(null)

  const checkInitialized = useCallback(
    async (path: string) => {
      if (!path.trim()) {
        setIsInitialized(null)
        return
      }

      try {
        const request = create(IsInitializedRequestSchema, {
          projectPath: path.trim(),
        })
        const response = await centyClient.isInitialized(request)
        setIsInitialized(response.initialized)
      } catch {
        setIsInitialized(false)
      }
    },
    [setIsInitialized]
  )

  const fetchAssets = useCallback(async () => {
    if (!projectPath.trim() || isInitialized !== true) return

    setLoading(true)
    setError(null)

    try {
      const request = create(ListSharedAssetsRequestSchema, {
        projectPath: projectPath.trim(),
      })
      const response = await centyClient.listSharedAssets(request)
      setAssets(response.assets)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setLoading(false)
    }
  }, [projectPath, isInitialized])

  const handleDelete = useCallback(
    async (filename: string) => {
      if (!projectPath) return

      setDeleting(true)
      setError(null)

      try {
        const request = create(DeleteAssetRequestSchema, {
          projectPath,
          filename,
          isShared: true,
        })
        const response = await centyClient.deleteAsset(request)

        if (response.success) {
          setAssets(prev => prev.filter(a => a.filename !== filename))
          setDeleteConfirm(null)
        } else {
          setError(response.error || 'Failed to delete asset')
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to connect to daemon'
        )
      } finally {
        setDeleting(false)
      }
    },
    [projectPath]
  )

  const handlePreview = useCallback(
    async (asset: Asset) => {
      if (!projectPath) return

      try {
        const request = create(GetAssetRequestSchema, {
          projectPath,
          filename: asset.filename,
          isShared: true,
        })
        const response = await centyClient.getAsset(request)

        if (response.success && response.data) {
          const bytes = new Uint8Array(response.data)
          const blob = new Blob([bytes], { type: asset.mimeType })
          const url = URL.createObjectURL(blob)
          setPreviewAsset({ asset, url })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load asset')
      }
    },
    [projectPath]
  )

  const closePreview = useCallback(() => {
    if (previewAsset?.url) {
      URL.revokeObjectURL(previewAsset.url)
    }
    setPreviewAsset(null)
  }, [previewAsset])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkInitialized(projectPath)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [projectPath, checkInitialized])

  useEffect(() => {
    if (isInitialized === true) {
      fetchAssets()
    }
  }, [isInitialized, fetchAssets])

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewAsset?.url) {
        URL.revokeObjectURL(previewAsset.url)
      }
    }
  }, [previewAsset])

  const formatFileSize = (bytes: bigint | number) => {
    const size = Number(bytes)
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="shared-assets">
      <div className="shared-assets-header">
        <h2>Shared Assets</h2>
        <div className="header-actions">
          {projectPath && isInitialized === true && (
            <button
              onClick={fetchAssets}
              disabled={loading}
              className="refresh-btn"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {!projectPath && (
        <div className="no-project-message">
          <p>Select a project from the header to view shared assets</p>
        </div>
      )}

      {projectPath && isInitialized === false && (
        <div className="not-initialized-message">
          <p>Centy is not initialized in this directory</p>
          <Link to="/">Initialize Project</Link>
        </div>
      )}

      {projectPath && isInitialized === true && (
        <>
          {error && <div className="error-message">{error}</div>}

          {loading && assets.length === 0 ? (
            <div className="loading">Loading shared assets...</div>
          ) : assets.length === 0 ? (
            <div className="empty-state">
              <p>No shared assets found</p>
              <p className="hint">
                Shared assets are files that can be referenced across multiple
                issues
              </p>
            </div>
          ) : (
            <div className="assets-grid">
              {assets.map(asset => (
                <div key={asset.filename} className="asset-card">
                  <div
                    className="asset-preview"
                    onClick={() => handlePreview(asset)}
                  >
                    {asset.mimeType.startsWith('image/') ? (
                      <div className="preview-placeholder image">IMG</div>
                    ) : asset.mimeType.startsWith('video/') ? (
                      <div className="preview-placeholder video">VID</div>
                    ) : (
                      <div className="preview-placeholder file">FILE</div>
                    )}
                  </div>
                  <div className="asset-info">
                    <span className="asset-filename" title={asset.filename}>
                      {asset.filename}
                    </span>
                    <div className="asset-meta">
                      <span className="asset-size">
                        {formatFileSize(asset.size)}
                      </span>
                      <span className="asset-type">{asset.mimeType}</span>
                    </div>
                  </div>
                  <button
                    className="asset-delete-btn"
                    onClick={e => {
                      e.stopPropagation()
                      setDeleteConfirm(asset.filename)
                    }}
                    title="Delete asset"
                  >
                    x
                  </button>
                  {deleteConfirm === asset.filename && (
                    <div className="delete-confirm-overlay">
                      <p>Delete &ldquo;{asset.filename}&rdquo;?</p>
                      <div className="delete-confirm-actions">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="cancel-btn"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(asset.filename)}
                          disabled={deleting}
                          className="confirm-delete-btn"
                        >
                          {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewAsset && (
        <div className="preview-modal" onClick={closePreview}>
          <div
            className="preview-modal-content"
            onClick={e => e.stopPropagation()}
          >
            <button className="preview-close-btn" onClick={closePreview}>
              x
            </button>
            <h3>{previewAsset.asset.filename}</h3>
            {previewAsset.asset.mimeType.startsWith('image/') ? (
              <img src={previewAsset.url} alt={previewAsset.asset.filename} />
            ) : previewAsset.asset.mimeType.startsWith('video/') ? (
              <video src={previewAsset.url} controls />
            ) : (
              <div className="preview-download">
                <a
                  href={previewAsset.url}
                  download={previewAsset.asset.filename}
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
