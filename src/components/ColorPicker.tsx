import './ColorPicker.css'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const displayValue = value || '#888888'

  return (
    <div className="color-picker">
      {label && <label className="color-picker-label">{label}</label>}
      <div className="color-picker-input-wrapper">
        <input
          type="color"
          value={displayValue}
          onChange={e => onChange(e.target.value)}
          className="color-picker-input"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="#RRGGBB"
          className="color-picker-text"
          pattern="^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$"
        />
        <div
          className="color-picker-swatch"
          style={{ backgroundColor: displayValue }}
        />
      </div>
    </div>
  )
}
