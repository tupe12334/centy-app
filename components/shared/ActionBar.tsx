'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ActionCategory, type EntityAction } from '@/gen/centy_pb'
import '@/styles/components/ActionBar.css'

interface ActionBarProps {
  actions: EntityAction[]
  onAction: (actionId: string) => void | Promise<void>
  loadingActions?: Set<string>
  disabled?: boolean
  isEditing?: boolean
  onSave?: () => void
  onCancel?: () => void
  saving?: boolean
}

interface ConfirmDialogState {
  isOpen: boolean
  actionId: string
  actionLabel: string
}

export function ActionBar({
  actions,
  onAction,
  loadingActions = new Set(),
  disabled = false,
  isEditing = false,
  onSave,
  onCancel,
  saving = false,
}: ActionBarProps) {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    actionId: '',
    actionLabel: '',
  })
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setStatusDropdownOpen(false)
      }
    }

    if (statusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [statusDropdownOpen])

  const handleActionClick = useCallback(
    (action: EntityAction) => {
      if (!action.enabled || disabled || loadingActions.has(action.id)) return

      if (action.destructive) {
        setConfirmDialog({
          isOpen: true,
          actionId: action.id,
          actionLabel: action.label,
        })
      } else {
        onAction(action.id)
      }
    },
    [onAction, disabled, loadingActions]
  )

  const handleConfirm = useCallback(() => {
    onAction(confirmDialog.actionId)
    setConfirmDialog({ isOpen: false, actionId: '', actionLabel: '' })
  }, [onAction, confirmDialog.actionId])

  const handleCancelConfirm = useCallback(() => {
    setConfirmDialog({ isOpen: false, actionId: '', actionLabel: '' })
  }, [])

  const handleStatusAction = useCallback(
    (actionId: string) => {
      setStatusDropdownOpen(false)
      onAction(actionId)
    },
    [onAction]
  )

  // Group actions by category
  const crudActions = actions.filter(a => a.category === ActionCategory.CRUD)
  const modeActions = actions.filter(a => a.category === ActionCategory.MODE)
  const statusActions = actions.filter(
    a => a.category === ActionCategory.STATUS
  )
  const externalActions = actions.filter(
    a => a.category === ActionCategory.EXTERNAL
  )

  // When in editing mode, show Save/Cancel instead of regular actions
  if (isEditing) {
    return (
      <div className="action-bar">
        <div className="action-bar-group">
          <button
            onClick={onCancel}
            className="action-btn cancel-btn"
            disabled={disabled || saving}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="action-btn save-btn"
            disabled={disabled || saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    )
  }

  const renderActionButton = (action: EntityAction) => {
    const isLoading = loadingActions.has(action.id)
    const isDisabled = !action.enabled || disabled || isLoading

    return (
      <button
        key={action.id}
        onClick={() => handleActionClick(action)}
        className={`action-btn ${action.destructive ? 'destructive' : ''} ${isDisabled ? 'disabled' : ''}`}
        disabled={isDisabled}
        title={
          !action.enabled && action.disabledReason
            ? action.disabledReason
            : action.keyboardShortcut
              ? `${action.label} (${action.keyboardShortcut})`
              : action.label
        }
      >
        {isLoading ? 'Loading...' : action.label}
      </button>
    )
  }

  const renderStatusDropdown = () => {
    if (statusActions.length === 0) return null

    // Find the currently active status (if any, marked by some convention like selected class)
    // For now, we just render all status options in a dropdown
    return (
      <div className="status-selector" ref={statusDropdownRef}>
        <button
          className="action-btn status-dropdown-trigger"
          onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
          disabled={disabled}
          aria-expanded={statusDropdownOpen}
          aria-haspopup="listbox"
        >
          Status
          <span className="status-dropdown-arrow" aria-hidden="true">
            ▼
          </span>
        </button>
        {statusDropdownOpen && (
          <ul
            className="status-dropdown"
            role="listbox"
            aria-label="Status options"
          >
            {statusActions.map(action => {
              const isLoading = loadingActions.has(action.id)
              const isDisabled = !action.enabled || disabled || isLoading

              return (
                <li
                  key={action.id}
                  role="option"
                  aria-selected={false}
                  className={`status-option ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && handleStatusAction(action.id)}
                  title={
                    !action.enabled && action.disabledReason
                      ? action.disabledReason
                      : undefined
                  }
                >
                  {isLoading ? 'Loading...' : action.label}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="action-bar">
      {/* MODE actions (AI Plan, Implement) */}
      {modeActions.length > 0 && (
        <div className="action-bar-group action-bar-mode">
          {modeActions.map(renderActionButton)}
        </div>
      )}

      {/* EXTERNAL actions (Open in VS Code, Terminal) */}
      {externalActions.length > 0 && (
        <div className="action-bar-group action-bar-external">
          {externalActions.map(renderActionButton)}
        </div>
      )}

      {/* CRUD actions (Edit, Move, Duplicate, Delete) */}
      {crudActions.length > 0 && (
        <div className="action-bar-group action-bar-crud">
          {crudActions.map(renderActionButton)}
        </div>
      )}

      {/* STATUS actions (as dropdown) */}
      {renderStatusDropdown()}

      {/* Confirmation dialog for destructive actions */}
      {confirmDialog.isOpen && (
        <div className="action-confirm-overlay">
          <div className="action-confirm-dialog">
            <p>
              Are you sure you want to {confirmDialog.actionLabel.toLowerCase()}
              ?
            </p>
            <div className="action-confirm-actions">
              <button
                onClick={handleCancelConfirm}
                className="action-btn cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="action-btn confirm-delete-btn"
              >
                Yes, {confirmDialog.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
