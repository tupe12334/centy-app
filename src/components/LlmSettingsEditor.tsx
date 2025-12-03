import type { LlmConfig } from '../gen/centy_pb.ts'
import './LlmSettingsEditor.css'

interface LlmSettingsEditorProps {
  value: LlmConfig | undefined
  onChange: (config: LlmConfig) => void
}

export function LlmSettingsEditor({ value, onChange }: LlmSettingsEditorProps) {
  const config: LlmConfig = value || {
    autoCloseOnComplete: false,
    updateStatusOnStart: false,
    allowDirectEdits: false,
    $typeName: 'centy.LlmConfig',
  }

  const handleChange = (field: keyof LlmConfig, checked: boolean) => {
    onChange({
      ...config,
      [field]: checked,
    })
  }

  return (
    <div className="llm-settings-editor">
      <label className="llm-checkbox">
        <input
          type="checkbox"
          checked={config.autoCloseOnComplete || false}
          onChange={e => handleChange('autoCloseOnComplete', e.target.checked)}
        />
        <span className="llm-checkbox-label">
          <strong>Auto-close on complete</strong>
          <span className="llm-checkbox-description">
            Automatically close issues when marked complete by LLM
          </span>
        </span>
      </label>

      <label className="llm-checkbox">
        <input
          type="checkbox"
          checked={config.updateStatusOnStart || false}
          onChange={e => handleChange('updateStatusOnStart', e.target.checked)}
        />
        <span className="llm-checkbox-label">
          <strong>Update status on start</strong>
          <span className="llm-checkbox-description">
            Update status to in-progress when LLM starts work
          </span>
        </span>
      </label>

      <label className="llm-checkbox">
        <input
          type="checkbox"
          checked={config.allowDirectEdits || false}
          onChange={e => handleChange('allowDirectEdits', e.target.checked)}
        />
        <span className="llm-checkbox-label">
          <strong>Allow direct edits</strong>
          <span className="llm-checkbox-description">
            Allow LLM to directly edit issue files instead of using CLI
          </span>
        </span>
      </label>
    </div>
  )
}
