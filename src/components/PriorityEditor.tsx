import { ColorPicker } from './ColorPicker.tsx'
import './PriorityEditor.css'

interface PriorityEditorProps {
  levels: number
  colors: Record<string, string>
  onLevelsChange: (levels: number) => void
  onColorsChange: (colors: Record<string, string>) => void
}

const DEFAULT_PRIORITY_COLORS: Record<string, string> = {
  '1': '#ef4444', // Red - highest
  '2': '#f59e0b', // Amber
  '3': '#10b981', // Green - lowest
  '4': '#3b82f6', // Blue
  '5': '#8b5cf6', // Purple
}

function getPriorityLabel(level: number, totalLevels: number): string {
  if (totalLevels <= 3) {
    const labels = ['High', 'Medium', 'Low']
    return labels[level - 1] || `P${level}`
  }
  if (totalLevels === 4) {
    const labels = ['Critical', 'High', 'Medium', 'Low']
    return labels[level - 1] || `P${level}`
  }
  return `P${level}`
}

export function PriorityEditor({
  levels,
  colors,
  onLevelsChange,
  onColorsChange,
}: PriorityEditorProps) {
  const getColor = (level: number) => {
    return (
      colors[String(level)] ||
      DEFAULT_PRIORITY_COLORS[String(level)] ||
      '#888888'
    )
  }

  const handleColorChange = (level: number, color: string) => {
    onColorsChange({
      ...colors,
      [String(level)]: color,
    })
  }

  const handleLevelsChange = (newLevels: number) => {
    onLevelsChange(newLevels)
    // Clean up colors for levels that no longer exist
    const newColors: Record<string, string> = {}
    for (let i = 1; i <= newLevels; i++) {
      if (colors[String(i)]) {
        newColors[String(i)] = colors[String(i)]
      }
    }
    onColorsChange(newColors)
  }

  const priorityLevels = Array.from({ length: levels }, (_, i) => i + 1)

  return (
    <div className="priority-editor">
      <div className="priority-levels-selector">
        <label htmlFor="priority-levels">Number of priority levels:</label>
        <select
          id="priority-levels"
          value={levels}
          onChange={e => handleLevelsChange(Number(e.target.value))}
          className="priority-levels-select"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <option key={n} value={n}>
              {n} level{n > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="priority-list">
        {priorityLevels.map(level => (
          <div key={level} className="priority-item">
            <div
              className="priority-preview"
              style={{ backgroundColor: getColor(level) }}
            >
              {getPriorityLabel(level, levels)}
            </div>

            <span className="priority-level-label">Priority {level}</span>

            <ColorPicker
              value={getColor(level)}
              onChange={color => handleColorChange(level, color)}
            />
          </div>
        ))}
      </div>

      <p className="priority-hint">
        Priority 1 is the highest priority. Labels are shown based on the number
        of levels.
      </p>
    </div>
  )
}
