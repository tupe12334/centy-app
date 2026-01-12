'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { EditorType, type EditorInfo } from '@/gen/centy_pb'
import { useDaemonStatus } from '@/components/providers/DaemonStatusProvider'
import '@/styles/components/EditorSelector.css'

const EDITOR_PREFERENCE_KEY = 'centy-preferred-editor'

interface EditorSelectorProps {
  onOpenInVscode: () => Promise<void>
  onOpenInTerminal: () => Promise<void>
  disabled?: boolean
  loading?: boolean
}

export function EditorSelector({
  onOpenInVscode,
  onOpenInTerminal,
  disabled = false,
  loading = false,
}: EditorSelectorProps) {
  const { editors } = useDaemonStatus()
  const [showDropdown, setShowDropdown] = useState(false)
  const [preferredEditor, setPreferredEditor] = useState<EditorType>(
    EditorType.VSCODE
  )
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load preference from localStorage on mount
  useEffect(() => {
    // Schedule setState asynchronously to satisfy eslint react-hooks/set-state-in-effect
    const timeoutId = setTimeout(() => {
      const saved = localStorage.getItem(EDITOR_PREFERENCE_KEY)
      if (saved) {
        const editorType = parseInt(saved, 10) as EditorType
        if (
          editorType === EditorType.VSCODE ||
          editorType === EditorType.TERMINAL
        ) {
          setPreferredEditor(editorType)
        }
      }
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [])

  // Save preference to localStorage
  const savePreference = useCallback((editorType: EditorType) => {
    setPreferredEditor(editorType)
    localStorage.setItem(EDITOR_PREFERENCE_KEY, String(editorType))
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Get editor info by type
  const getEditorInfo = useCallback(
    (type: EditorType): EditorInfo | undefined => {
      return editors.find(e => e.editorType === type)
    },
    [editors]
  )

  // Check if an editor is available
  const isEditorAvailable = useCallback(
    (type: EditorType): boolean => {
      const editor = getEditorInfo(type)
      return editor?.available ?? false
    },
    [getEditorInfo]
  )

  // Get the preferred editor's display info
  const preferredEditorInfo = getEditorInfo(preferredEditor)
  const preferredEditorName = preferredEditorInfo?.name || 'VS Code'
  const preferredEditorAvailable = isEditorAvailable(preferredEditor)

  // Handle primary button click
  const handlePrimaryClick = useCallback(async () => {
    if (disabled || loading || !preferredEditorAvailable) return

    if (preferredEditor === EditorType.VSCODE) {
      await onOpenInVscode()
    } else if (preferredEditor === EditorType.TERMINAL) {
      await onOpenInTerminal()
    }
  }, [
    disabled,
    loading,
    preferredEditor,
    preferredEditorAvailable,
    onOpenInVscode,
    onOpenInTerminal,
  ])

  // Handle editor selection from dropdown
  const handleSelectEditor = useCallback(
    async (editorType: EditorType) => {
      if (disabled || loading) return

      const available = isEditorAvailable(editorType)
      if (!available) return

      savePreference(editorType)
      setShowDropdown(false)

      // Immediately open the selected editor
      if (editorType === EditorType.VSCODE) {
        await onOpenInVscode()
      } else if (editorType === EditorType.TERMINAL) {
        await onOpenInTerminal()
      }
    },
    [
      disabled,
      loading,
      isEditorAvailable,
      savePreference,
      onOpenInVscode,
      onOpenInTerminal,
    ]
  )

  // If no editors available, show unavailable hint
  const hasAnyAvailable = editors.some(e => e.available)
  if (!hasAnyAvailable && editors.length > 0) {
    return (
      <span
        className="editor-unavailable-hint"
        title="No editors are available. Install VS Code or use Terminal."
      >
        No editors available
      </span>
    )
  }

  // If editors haven't loaded yet, show loading state
  if (editors.length === 0) {
    return null
  }

  return (
    <div className="editor-selector" ref={dropdownRef}>
      <div className="editor-selector-button-group">
        <button
          className={`editor-primary-btn ${preferredEditor === EditorType.TERMINAL ? 'terminal' : 'vscode'}`}
          onClick={handlePrimaryClick}
          disabled={disabled || loading || !preferredEditorAvailable}
          title={
            preferredEditorAvailable
              ? preferredEditorInfo?.description
              : `${preferredEditorName} is not available`
          }
        >
          <span className="editor-icon">
            {preferredEditor === EditorType.TERMINAL ? (
              <TerminalIcon />
            ) : (
              <VscodeIcon />
            )}
          </span>
          {loading ? 'Opening...' : `Open in ${preferredEditorName}`}
        </button>
        <button
          className={`editor-dropdown-btn ${preferredEditor === EditorType.TERMINAL ? 'terminal' : 'vscode'}`}
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled || loading}
          aria-label="Select editor"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        >
          <span
            className={`editor-dropdown-arrow ${showDropdown ? 'open' : ''}`}
          >
            &#9660;
          </span>
        </button>
      </div>

      {showDropdown && (
        <ul className="editor-dropdown" role="listbox" aria-label="Editors">
          {editors.map(editor => (
            <li
              key={editor.editorType}
              role="option"
              aria-selected={editor.editorType === preferredEditor}
              aria-disabled={!editor.available}
              className={`editor-option ${editor.editorType === preferredEditor ? 'selected' : ''} ${!editor.available ? 'disabled' : ''}`}
              onClick={() =>
                editor.available && handleSelectEditor(editor.editorType)
              }
              title={
                editor.available
                  ? editor.description
                  : `${editor.name} is not available`
              }
            >
              <span className="editor-option-icon">
                {editor.editorType === EditorType.TERMINAL ? (
                  <TerminalIcon />
                ) : (
                  <VscodeIcon />
                )}
              </span>
              <div className="editor-option-content">
                <span className="editor-option-name">{editor.name}</span>
                {!editor.available && (
                  <span className="editor-option-unavailable">
                    Not available
                  </span>
                )}
              </div>
              {editor.editorType === preferredEditor && editor.available && (
                <span className="editor-option-check">&#10003;</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// VS Code icon component
function VscodeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.583 17.222L8.528 8.167 2.75 13.944v2.111l4.917 4.195 9.916-3.028zm0-10.444L8.528 15.833 2.75 10.056V7.944l4.917-4.194 9.916 3.028zM2.75 10.056L8.528 12 2.75 13.944v-3.888zm14.833 10.166L21.25 18v-12l-3.667 2.222v7.778l.028 2.222z" />
    </svg>
  )
}

// Terminal icon component
function TerminalIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  )
}
