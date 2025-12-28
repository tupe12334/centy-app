'use client'

import { useRef, useEffect } from 'react'
import '@/styles/components/WorkspaceModeModal.css'

// Workspace mode for agent execution
export enum WorkspaceMode {
  CURRENT = 'current',
  TEMP = 'temp',
}

interface WorkspaceModeModalProps {
  issueNumber?: number
  onClose: () => void
  onSelect: (mode: WorkspaceMode) => void
}

export function WorkspaceModeModal({
  issueNumber,
  onClose,
  onSelect,
}: WorkspaceModeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div className="workspace-modal-overlay">
      <div className="workspace-modal" ref={modalRef}>
        <div className="workspace-modal-header">
          <h3>Open Agent for Issue #{issueNumber}</h3>
          <button onClick={onClose} className="workspace-modal-close">
            Cancel
          </button>
        </div>

        <div className="workspace-modal-body">
          <p className="workspace-modal-description">
            Choose where to run the AI agent:
          </p>

          <div className="workspace-modal-options">
            <button
              onClick={() => onSelect(WorkspaceMode.CURRENT)}
              className="workspace-option"
            >
              <div className="workspace-option-title">Current Project</div>
              <div className="workspace-option-description">
                Run the agent in the current project directory
              </div>
            </button>

            <button
              onClick={() => onSelect(WorkspaceMode.TEMP)}
              className="workspace-option"
            >
              <div className="workspace-option-title">Temporary Workspace</div>
              <div className="workspace-option-description">
                Create an isolated git worktree for this work
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
