/* cspell:ignore arrowup arrowdown arrowleft arrowright */
'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { EntityAction } from '@/gen/centy_pb'

interface UseActionShortcutsOptions {
  actions: EntityAction[]
  onAction: (actionId: string) => void | Promise<void>
  enabled?: boolean
}

// Parse a keyboard shortcut string like "Ctrl+S", "Delete", "d"
// Returns { key, ctrlKey, metaKey, altKey, shiftKey }
function parseShortcut(shortcut: string): {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
} {
  const parts = shortcut.split('+').map(p => p.trim().toLowerCase())
  const modifiers = {
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
  }

  let key = ''

  for (const part of parts) {
    switch (part) {
      case 'ctrl':
      case 'control':
        modifiers.ctrlKey = true
        break
      case 'meta':
      case 'cmd':
      case 'command':
        modifiers.metaKey = true
        break
      case 'alt':
      case 'option':
        modifiers.altKey = true
        break
      case 'shift':
        modifiers.shiftKey = true
        break
      default:
        // This is the actual key
        key = part
    }
  }

  // Handle special key names
  const keyMap: Record<string, string> = {
    delete: 'delete',
    backspace: 'backspace',
    escape: 'escape',
    esc: 'escape',
    enter: 'enter',
    return: 'enter',
    space: ' ',
    tab: 'tab',
    arrowup: 'arrowup',
    arrowdown: 'arrowdown',
    arrowleft: 'arrowleft',
    arrowright: 'arrowright',
  }

  key = keyMap[key] || key

  return { key, ...modifiers }
}

// Check if the current element is an input field where shortcuts should be ignored
function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false

  const tagName = element.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true
  }

  // Check for contenteditable
  if (element.isContentEditable) {
    return true
  }

  return false
}

export function useActionShortcuts({
  actions,
  onAction,
  enabled = true,
}: UseActionShortcutsOptions) {
  const onActionRef = useRef(onAction)
  const actionsRef = useRef(actions)

  useEffect(() => {
    onActionRef.current = onAction
  }, [onAction])

  useEffect(() => {
    actionsRef.current = actions
  }, [actions])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Skip if focused on an input element
      if (isInputElement(event.target)) return

      const currentActions = actionsRef.current
      if (!currentActions || currentActions.length === 0) return

      const eventKey = event.key.toLowerCase()

      for (const action of currentActions) {
        if (!action.keyboardShortcut || !action.enabled) continue

        const shortcut = parseShortcut(action.keyboardShortcut)

        // Check if modifiers match
        const modifiersMatch =
          event.ctrlKey === shortcut.ctrlKey &&
          event.metaKey === shortcut.metaKey &&
          event.altKey === shortcut.altKey &&
          event.shiftKey === shortcut.shiftKey

        // Check if key matches
        const keyMatch = eventKey === shortcut.key

        if (modifiersMatch && keyMatch) {
          event.preventDefault()
          event.stopPropagation()
          onActionRef.current(action.id)
          return
        }
      }
    },
    [enabled]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])
}
