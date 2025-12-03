import { useState } from 'react'
import './DefaultsEditor.css'

interface DefaultsEditorProps {
  value: Record<string, string>
  onChange: (defaults: Record<string, string>) => void
  suggestedKeys?: string[]
}

export function DefaultsEditor({
  value,
  onChange,
  suggestedKeys = [],
}: DefaultsEditorProps) {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const entries = Object.entries(value)

  const handleAdd = () => {
    if (newKey.trim() && !value[newKey.trim()]) {
      onChange({
        ...value,
        [newKey.trim()]: newValue,
      })
      setNewKey('')
      setNewValue('')
    }
  }

  const handleRemove = (key: string) => {
    const newDefaults = { ...value }
    delete newDefaults[key]
    onChange(newDefaults)
  }

  const handleValueChange = (key: string, newVal: string) => {
    onChange({
      ...value,
      [key]: newVal,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const availableKeys = suggestedKeys.filter(k => !value[k])

  return (
    <div className="defaults-editor">
      {entries.length > 0 && (
        <table className="defaults-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, val]) => (
              <tr key={key}>
                <td className="defaults-key">{key}</td>
                <td>
                  <input
                    type="text"
                    value={val}
                    onChange={e => handleValueChange(key, e.target.value)}
                    className="defaults-value-input"
                  />
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleRemove(key)}
                    className="defaults-remove-btn"
                    title="Remove"
                  >
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="defaults-add-row">
        <input
          type="text"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Key"
          className="defaults-key-input"
          list="suggested-keys"
        />
        {availableKeys.length > 0 && (
          <datalist id="suggested-keys">
            {availableKeys.map(k => (
              <option key={k} value={k} />
            ))}
          </datalist>
        )}
        <input
          type="text"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Value"
          className="defaults-value-input"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newKey.trim() || !!value[newKey.trim()]}
          className="defaults-add-btn"
        >
          Add
        </button>
      </div>

      {entries.length === 0 && (
        <p className="defaults-empty">No default values configured</p>
      )}
    </div>
  )
}
