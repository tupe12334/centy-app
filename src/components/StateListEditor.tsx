import { useState } from 'react'
import { ColorPicker } from './ColorPicker.tsx'
import './StateListEditor.css'

interface StateListEditorProps {
  states: string[]
  stateColors: Record<string, string>
  defaultState: string
  onStatesChange: (states: string[]) => void
  onColorsChange: (colors: Record<string, string>) => void
  onDefaultChange: (defaultState: string) => void
}

const DEFAULT_STATE_COLORS: Record<string, string> = {
  open: '#10b981',
  'in-progress': '#f59e0b',
  closed: '#6b7280',
}

export function StateListEditor({
  states,
  stateColors,
  defaultState,
  onStatesChange,
  onColorsChange,
  onDefaultChange,
}: StateListEditorProps) {
  const [newState, setNewState] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const getColor = (state: string) => {
    return stateColors[state] || DEFAULT_STATE_COLORS[state] || '#888888'
  }

  const handleAddState = () => {
    const trimmed = newState.trim().toLowerCase().replace(/\s+/g, '-')
    if (trimmed && !states.includes(trimmed)) {
      onStatesChange([...states, trimmed])
      setNewState('')
    }
  }

  const handleRemoveState = (state: string) => {
    if (states.length <= 1) return
    if (state === defaultState) return

    const newStates = states.filter(s => s !== state)
    onStatesChange(newStates)

    // Clean up color
    const newColors = { ...stateColors }
    delete newColors[state]
    onColorsChange(newColors)
  }

  const handleColorChange = (state: string, color: string) => {
    onColorsChange({
      ...stateColors,
      [state]: color,
    })
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newStates = [...states]
    const [removed] = newStates.splice(draggedIndex, 1)
    newStates.splice(index, 0, removed)
    onStatesChange(newStates)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddState()
    }
  }

  return (
    <div className="state-list-editor">
      <div className="state-list">
        {states.map((state, index) => (
          <div
            key={state}
            className={`state-item ${draggedIndex === index ? 'dragging' : ''}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={e => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="state-drag-handle" title="Drag to reorder">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div
              className="state-preview"
              style={{ backgroundColor: getColor(state) }}
            >
              {state}
            </div>

            <ColorPicker
              value={getColor(state)}
              onChange={color => handleColorChange(state, color)}
            />

            <select
              value={state === defaultState ? 'default' : ''}
              onChange={e => {
                if (e.target.value === 'default') {
                  onDefaultChange(state)
                }
              }}
              className="state-default-select"
            >
              <option value="">-</option>
              <option value="default">Default</option>
            </select>

            <button
              type="button"
              onClick={() => handleRemoveState(state)}
              disabled={states.length <= 1 || state === defaultState}
              className="state-remove-btn"
              title={
                state === defaultState
                  ? 'Cannot remove default state'
                  : states.length <= 1
                    ? 'Must have at least one state'
                    : 'Remove state'
              }
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <div className="state-add-row">
        <input
          type="text"
          value={newState}
          onChange={e => setNewState(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New state name..."
          className="state-add-input"
        />
        <button
          type="button"
          onClick={handleAddState}
          disabled={
            !newState.trim() ||
            states.includes(newState.trim().toLowerCase().replace(/\s+/g, '-'))
          }
          className="state-add-btn"
        >
          + Add State
        </button>
      </div>

      <p className="state-hint">
        Drag to reorder. The default state is used for new issues.
      </p>
    </div>
  )
}
