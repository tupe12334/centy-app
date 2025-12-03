import { useState } from 'react'
import type { CustomFieldDefinition } from '../gen/centy_pb.ts'
import './CustomFieldsEditor.css'

interface CustomFieldsEditorProps {
  fields: CustomFieldDefinition[]
  onChange: (fields: CustomFieldDefinition[]) => void
}

const FIELD_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Checkbox' },
  { value: 'enum', label: 'Select (Enum)' },
]

export function CustomFieldsEditor({
  fields,
  onChange,
}: CustomFieldsEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = (field: CustomFieldDefinition) => {
    onChange([...fields, field])
    setIsAdding(false)
  }

  const handleUpdate = (index: number, field: CustomFieldDefinition) => {
    const newFields = [...fields]
    newFields[index] = field
    onChange(newFields)
    setEditingIndex(null)
  }

  const handleRemove = (index: number) => {
    onChange(fields.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newFields = [...fields]
    ;[newFields[index - 1], newFields[index]] = [
      newFields[index],
      newFields[index - 1],
    ]
    onChange(newFields)
  }

  const handleMoveDown = (index: number) => {
    if (index === fields.length - 1) return
    const newFields = [...fields]
    ;[newFields[index], newFields[index + 1]] = [
      newFields[index + 1],
      newFields[index],
    ]
    onChange(newFields)
  }

  return (
    <div className="custom-fields-editor">
      {fields.length > 0 && (
        <div className="custom-fields-list">
          {fields.map((field, index) => (
            <div key={field.name} className="custom-field-item">
              {editingIndex === index ? (
                <CustomFieldForm
                  field={field}
                  existingNames={fields
                    .filter((_, i) => i !== index)
                    .map(f => f.name)}
                  onSave={f => handleUpdate(index, f)}
                  onCancel={() => setEditingIndex(null)}
                />
              ) : (
                <CustomFieldDisplay
                  field={field}
                  index={index}
                  totalCount={fields.length}
                  onEdit={() => setEditingIndex(index)}
                  onRemove={() => handleRemove(index)}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {isAdding ? (
        <div className="custom-field-item">
          <CustomFieldForm
            existingNames={fields.map(f => f.name)}
            onSave={handleAdd}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="custom-field-add-btn"
        >
          + Add Custom Field
        </button>
      )}

      {fields.length === 0 && !isAdding && (
        <p className="custom-fields-empty">No custom fields configured</p>
      )}
    </div>
  )
}

interface CustomFieldDisplayProps {
  field: CustomFieldDefinition
  index: number
  totalCount: number
  onEdit: () => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function CustomFieldDisplay({
  field,
  index,
  totalCount,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
}: CustomFieldDisplayProps) {
  const typeLabel =
    FIELD_TYPES.find(t => t.value === field.fieldType)?.label || field.fieldType

  return (
    <div className="custom-field-display">
      <div className="custom-field-header">
        <div className="custom-field-move-btns">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="custom-field-move-btn"
            title="Move up"
          >
            &uarr;
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalCount - 1}
            className="custom-field-move-btn"
            title="Move down"
          >
            &darr;
          </button>
        </div>

        <span className="custom-field-name">{field.name}</span>

        {field.required && <span className="custom-field-required">*</span>}

        <span className="custom-field-type">{typeLabel}</span>

        <div className="custom-field-actions">
          <button
            type="button"
            onClick={onEdit}
            className="custom-field-edit-btn"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="custom-field-remove-btn"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="custom-field-details">
        {field.defaultValue && (
          <span>
            Default: <code>{field.defaultValue}</code>
          </span>
        )}
        {field.fieldType === 'enum' && field.enumValues.length > 0 && (
          <span>
            Options:{' '}
            {field.enumValues.map((v, i) => (
              <code key={v}>
                {v}
                {i < field.enumValues.length - 1 ? ', ' : ''}
              </code>
            ))}
          </span>
        )}
      </div>
    </div>
  )
}

interface CustomFieldFormProps {
  field?: CustomFieldDefinition
  existingNames: string[]
  onSave: (field: CustomFieldDefinition) => void
  onCancel: () => void
}

function CustomFieldForm({
  field,
  existingNames,
  onSave,
  onCancel,
}: CustomFieldFormProps) {
  const [name, setName] = useState(field?.name || '')
  const [fieldType, setFieldType] = useState(field?.fieldType || 'string')
  const [required, setRequired] = useState(field?.required || false)
  const [defaultValue, setDefaultValue] = useState(field?.defaultValue || '')
  const [enumValues, setEnumValues] = useState<string[]>(
    field?.enumValues || []
  )
  const [newEnumValue, setNewEnumValue] = useState('')

  const isValid =
    name.trim() &&
    !existingNames.includes(name.trim()) &&
    (fieldType !== 'enum' || enumValues.length > 0)

  const handleSave = () => {
    if (!isValid) return
    onSave({
      name: name.trim(),
      fieldType,
      required,
      defaultValue: defaultValue || '',
      enumValues: fieldType === 'enum' ? enumValues : [],
      $typeName: 'centy.CustomFieldDefinition',
    })
  }

  const handleAddEnumValue = () => {
    const trimmed = newEnumValue.trim()
    if (trimmed && !enumValues.includes(trimmed)) {
      setEnumValues([...enumValues, trimmed])
      setNewEnumValue('')
    }
  }

  const handleRemoveEnumValue = (value: string) => {
    setEnumValues(enumValues.filter(v => v !== value))
    if (defaultValue === value) {
      setDefaultValue('')
    }
  }

  return (
    <div className="custom-field-form">
      <div className="custom-field-form-row">
        <div className="custom-field-form-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="field_name"
            className="custom-field-form-input"
          />
        </div>

        <div className="custom-field-form-group">
          <label>Type</label>
          <select
            value={fieldType}
            onChange={e => setFieldType(e.target.value)}
            className="custom-field-form-select"
          >
            {FIELD_TYPES.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="custom-field-form-group custom-field-form-checkbox">
          <label>
            <input
              type="checkbox"
              checked={required}
              onChange={e => setRequired(e.target.checked)}
            />
            Required
          </label>
        </div>
      </div>

      {fieldType === 'enum' && (
        <div className="custom-field-enum-section">
          <label>Options</label>
          <div className="custom-field-enum-list">
            {enumValues.map(value => (
              <span key={value} className="custom-field-enum-tag">
                {value}
                <button
                  type="button"
                  onClick={() => handleRemoveEnumValue(value)}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="custom-field-enum-add">
            <input
              type="text"
              value={newEnumValue}
              onChange={e => setNewEnumValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddEnumValue()
                }
              }}
              placeholder="Add option..."
              className="custom-field-form-input"
            />
            <button
              type="button"
              onClick={handleAddEnumValue}
              disabled={
                !newEnumValue.trim() || enumValues.includes(newEnumValue.trim())
              }
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="custom-field-form-group">
        <label>Default Value</label>
        {fieldType === 'enum' ? (
          <select
            value={defaultValue}
            onChange={e => setDefaultValue(e.target.value)}
            className="custom-field-form-select"
          >
            <option value="">No default</option>
            {enumValues.map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        ) : fieldType === 'boolean' ? (
          <select
            value={defaultValue}
            onChange={e => setDefaultValue(e.target.value)}
            className="custom-field-form-select"
          >
            <option value="">No default</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        ) : (
          <input
            type={fieldType === 'number' ? 'number' : 'text'}
            value={defaultValue}
            onChange={e => setDefaultValue(e.target.value)}
            placeholder={fieldType === 'number' ? '0' : 'Default value...'}
            className="custom-field-form-input"
          />
        )}
      </div>

      <div className="custom-field-form-actions">
        <button type="button" onClick={onCancel} className="secondary">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid}
          className="primary"
        >
          {field ? 'Update' : 'Add'} Field
        </button>
      </div>
    </div>
  )
}
