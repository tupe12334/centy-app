'use client'

import { useState } from 'react'
import {
  type AgentConfig,
  type LocalLlmConfig,
  AgentType,
  AgentConfigSchema,
  LocalLlmConfigSchema,
} from '@/gen/centy_pb'
import { create } from '@bufbuild/protobuf'

interface AgentConfigEditorProps {
  config: LocalLlmConfig | undefined
  onChange: (config: LocalLlmConfig) => void
  scope: 'global' | 'project'
  globalConfig?: LocalLlmConfig
}

const AGENT_TYPES = [
  { value: AgentType.CLAUDE, label: 'Claude' },
  { value: AgentType.GEMINI, label: 'Gemini' },
  { value: AgentType.CODEX, label: 'Codex' },
  { value: AgentType.OPENCODE, label: 'OpenCode' },
  { value: AgentType.CUSTOM, label: 'Custom' },
]

function getAgentTypeLabel(type: AgentType): string {
  return AGENT_TYPES.find(t => t.value === type)?.label || 'Unknown'
}

export function AgentConfigEditor({
  config,
  onChange,
  scope,
  globalConfig,
}: AgentConfigEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const localConfig: LocalLlmConfig =
    config ||
    create(LocalLlmConfigSchema, {
      defaultAgent: '',
      agents: [],
      envVars: {},
    })

  const inheritedAgents =
    scope === 'project' && globalConfig
      ? globalConfig.agents.filter(
          ga => !localConfig.agents.some(la => la.name === ga.name)
        )
      : []

  const allAgentNames = [
    ...localConfig.agents.map(a => a.name),
    ...inheritedAgents.map(a => a.name),
  ]

  const handleAdd = (agent: AgentConfig) => {
    const newAgents = [...localConfig.agents, agent]
    onChange({
      ...localConfig,
      agents: newAgents,
      defaultAgent: localConfig.defaultAgent || agent.name,
    })
    setIsAdding(false)
  }

  const handleUpdate = (index: number, agent: AgentConfig) => {
    const newAgents = [...localConfig.agents]
    const oldName = newAgents[index].name
    newAgents[index] = agent

    let newDefaultAgent = localConfig.defaultAgent
    if (oldName === localConfig.defaultAgent) {
      newDefaultAgent = agent.name
    }

    onChange({
      ...localConfig,
      agents: newAgents,
      defaultAgent: newDefaultAgent,
    })
    setEditingIndex(null)
  }

  const handleRemove = (index: number) => {
    const removedName = localConfig.agents[index].name
    const newAgents = localConfig.agents.filter((_, i) => i !== index)

    let newDefaultAgent = localConfig.defaultAgent
    if (removedName === localConfig.defaultAgent) {
      newDefaultAgent = newAgents.length > 0 ? newAgents[0].name : ''
    }

    onChange({
      ...localConfig,
      agents: newAgents,
      defaultAgent: newDefaultAgent,
    })
  }

  const handleDefaultAgentChange = (agentName: string) => {
    onChange({
      ...localConfig,
      defaultAgent: agentName,
    })
  }

  const handleEnvVarsChange = (envVars: { [key: string]: string }) => {
    onChange({
      ...localConfig,
      envVars,
    })
  }

  return (
    <div className="agent-config-editor">
      {/* Default Agent Selector */}
      <div className="agent-default-selector">
        <label htmlFor="default-agent">Default Agent</label>
        <select
          id="default-agent"
          value={localConfig.defaultAgent}
          onChange={e => handleDefaultAgentChange(e.target.value)}
          className="agent-form-select"
        >
          <option value="">Select default agent...</option>
          {localConfig.agents.map(agent => (
            <option key={agent.name} value={agent.name}>
              {agent.name}
            </option>
          ))}
          {inheritedAgents.map(agent => (
            <option key={agent.name} value={agent.name}>
              {agent.name} (inherited)
            </option>
          ))}
        </select>
        <p className="agent-default-description">
          The agent that will be used by default when spawning LLM tasks.
        </p>
      </div>

      {/* Agent List */}
      <div className="agent-section">
        <h4>Agents</h4>

        {localConfig.agents.length > 0 && (
          <div className="agent-list">
            {localConfig.agents.map((agent, index) => (
              <div key={agent.name} className="agent-item">
                {editingIndex === index ? (
                  <AgentForm
                    agent={agent}
                    existingNames={localConfig.agents
                      .filter((_, i) => i !== index)
                      .map(a => a.name)}
                    onSave={a => handleUpdate(index, a)}
                    onCancel={() => setEditingIndex(null)}
                  />
                ) : (
                  <AgentDisplay
                    agent={agent}
                    isDefault={agent.name === localConfig.defaultAgent}
                    onEdit={() => setEditingIndex(index)}
                    onRemove={() => handleRemove(index)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Inherited Agents (Project Scope) */}
        {inheritedAgents.length > 0 && (
          <div className="agent-inherited-section">
            <h5>Inherited from Global</h5>
            <div className="agent-list">
              {inheritedAgents.map(agent => (
                <div key={agent.name} className="agent-item agent-inherited">
                  <AgentDisplay
                    agent={agent}
                    isDefault={agent.name === localConfig.defaultAgent}
                    isInherited
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {isAdding ? (
          <div className="agent-item">
            <AgentForm
              existingNames={allAgentNames}
              onSave={handleAdd}
              onCancel={() => setIsAdding(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="agent-add-btn"
          >
            + Add Agent
          </button>
        )}

        {localConfig.agents.length === 0 &&
          inheritedAgents.length === 0 &&
          !isAdding && (
            <p className="agent-empty">
              No agents configured. Add an agent to get started.
            </p>
          )}
      </div>

      {/* Environment Variables */}
      <div className="agent-section">
        <h4>Environment Variables</h4>
        <p className="agent-section-description">
          Environment variables that will be passed to all agents.
        </p>
        <EnvVarsEditor
          value={localConfig.envVars}
          onChange={handleEnvVarsChange}
        />
      </div>
    </div>
  )
}

interface AgentDisplayProps {
  agent: AgentConfig
  isDefault: boolean
  isInherited?: boolean
  onEdit?: () => void
  onRemove?: () => void
}

function AgentDisplay({
  agent,
  isDefault,
  isInherited,
  onEdit,
  onRemove,
}: AgentDisplayProps) {
  return (
    <div className="agent-display">
      <div className="agent-display-header">
        <span className="agent-name">{agent.name}</span>
        <span className="agent-type-badge">
          {getAgentTypeLabel(agent.agentType)}
        </span>
        {isDefault && <span className="agent-default-badge">Default</span>}
        {isInherited && (
          <span className="agent-inherited-badge">Inherited</span>
        )}

        {!isInherited && (
          <div className="agent-actions">
            <button type="button" onClick={onEdit} className="agent-edit-btn">
              Edit
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="agent-remove-btn"
              title="Remove agent"
            >
              &times;
            </button>
          </div>
        )}
      </div>

      <div className="agent-details">
        {agent.command && (
          <span className="agent-detail">
            Command: <code>{agent.command}</code>
          </span>
        )}
        {agent.defaultArgs.length > 0 && (
          <span className="agent-detail">
            Args:{' '}
            {agent.defaultArgs.map((arg, i) => (
              <code key={i}>{arg}</code>
            ))}
          </span>
        )}
        {agent.planTemplate && (
          <span className="agent-detail">
            Plan: <code>{agent.planTemplate}</code>
          </span>
        )}
        {agent.implementTemplate && (
          <span className="agent-detail">
            Implement: <code>{agent.implementTemplate}</code>
          </span>
        )}
      </div>
    </div>
  )
}

interface AgentFormProps {
  agent?: AgentConfig
  existingNames: string[]
  onSave: (agent: AgentConfig) => void
  onCancel: () => void
}

function AgentForm({ agent, existingNames, onSave, onCancel }: AgentFormProps) {
  const [name, setName] = useState(agent?.name || '')
  const [agentType, setAgentType] = useState<AgentType>(
    agent?.agentType || AgentType.CLAUDE
  )
  const [command, setCommand] = useState(agent?.command || '')
  const [defaultArgs, setDefaultArgs] = useState<string[]>(
    agent?.defaultArgs || []
  )
  const [planTemplate, setPlanTemplate] = useState(agent?.planTemplate || '')
  const [implementTemplate, setImplementTemplate] = useState(
    agent?.implementTemplate || ''
  )
  const [newArg, setNewArg] = useState('')

  const isNameUnique = !existingNames.includes(name.trim())
  const isCustomWithCommand = agentType !== AgentType.CUSTOM || command.trim()
  const isValid = name.trim() && isNameUnique && isCustomWithCommand

  const handleSave = () => {
    if (!isValid) return
    onSave(
      create(AgentConfigSchema, {
        agentType,
        name: name.trim(),
        command: command.trim(),
        defaultArgs,
        planTemplate: planTemplate.trim(),
        implementTemplate: implementTemplate.trim(),
      })
    )
  }

  const handleAddArg = () => {
    const trimmed = newArg.trim()
    if (trimmed && !defaultArgs.includes(trimmed)) {
      setDefaultArgs([...defaultArgs, trimmed])
      setNewArg('')
    }
  }

  const handleRemoveArg = (arg: string) => {
    setDefaultArgs(defaultArgs.filter(a => a !== arg))
  }

  return (
    <div className="agent-form">
      <div className="agent-form-row">
        <div className="agent-form-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="my-agent"
            className="agent-form-input"
          />
          {name && !isNameUnique && (
            <span className="agent-form-error">Name must be unique</span>
          )}
        </div>

        <div className="agent-form-group">
          <label>Type</label>
          <select
            value={agentType}
            onChange={e => setAgentType(Number(e.target.value) as AgentType)}
            className="agent-form-select"
          >
            {AGENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="agent-form-group">
        <label>
          Command{' '}
          {agentType === AgentType.CUSTOM && (
            <span className="required">*</span>
          )}
        </label>
        <input
          type="text"
          value={command}
          onChange={e => setCommand(e.target.value)}
          placeholder={
            agentType === AgentType.CUSTOM
              ? '/path/to/agent'
              : 'claude (optional override)'
          }
          className="agent-form-input"
        />
        {agentType === AgentType.CUSTOM && !command.trim() && (
          <span className="agent-form-error">
            Command is required for custom agents
          </span>
        )}
      </div>

      <div className="agent-form-group">
        <label>Default Arguments</label>
        <div className="agent-args-list">
          {defaultArgs.map(arg => (
            <span key={arg} className="agent-arg-tag">
              {arg}
              <button type="button" onClick={() => handleRemoveArg(arg)}>
                &times;
              </button>
            </span>
          ))}
        </div>
        <div className="agent-args-add">
          <input
            type="text"
            value={newArg}
            onChange={e => setNewArg(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddArg()
              }
            }}
            placeholder="Add argument..."
            className="agent-form-input"
          />
          <button
            type="button"
            onClick={handleAddArg}
            disabled={!newArg.trim() || defaultArgs.includes(newArg.trim())}
          >
            Add
          </button>
        </div>
      </div>

      <div className="agent-form-row">
        <div className="agent-form-group">
          <label>Plan Template</label>
          <input
            type="text"
            value={planTemplate}
            onChange={e => setPlanTemplate(e.target.value)}
            placeholder="Template name for plan action"
            className="agent-form-input"
          />
        </div>

        <div className="agent-form-group">
          <label>Implement Template</label>
          <input
            type="text"
            value={implementTemplate}
            onChange={e => setImplementTemplate(e.target.value)}
            placeholder="Template name for implement action"
            className="agent-form-input"
          />
        </div>
      </div>

      <div className="agent-form-actions">
        <button type="button" onClick={onCancel} className="secondary">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid}
          className="primary"
        >
          {agent ? 'Update' : 'Add'} Agent
        </button>
      </div>
    </div>
  )
}

interface EnvVarsEditorProps {
  value: { [key: string]: string }
  onChange: (value: { [key: string]: string }) => void
}

function EnvVarsEditor({ value, onChange }: EnvVarsEditorProps) {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const entries = Object.entries(value)

  const handleAdd = () => {
    const key = newKey.trim()
    const val = newValue.trim()
    if (key && !value[key]) {
      onChange({ ...value, [key]: val })
      setNewKey('')
      setNewValue('')
    }
  }

  const handleRemove = (key: string) => {
    const newEnvVars = { ...value }
    delete newEnvVars[key]
    onChange(newEnvVars)
  }

  const handleUpdate = (oldKey: string, newVal: string) => {
    onChange({ ...value, [oldKey]: newVal })
  }

  return (
    <div className="env-vars-editor">
      {entries.length > 0 && (
        <div className="env-vars-list">
          {entries.map(([key, val]) => (
            <div key={key} className="env-var-item">
              <span className="env-var-key">{key}</span>
              <input
                type="text"
                value={val}
                onChange={e => handleUpdate(key, e.target.value)}
                className="env-var-value"
              />
              <button
                type="button"
                onClick={() => handleRemove(key)}
                className="env-var-remove"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="env-var-add">
        <input
          type="text"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          placeholder="KEY"
          className="env-var-key-input"
        />
        <input
          type="text"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="value"
          className="env-var-value-input"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newKey.trim() || !!value[newKey.trim()]}
        >
          Add
        </button>
      </div>

      {entries.length === 0 && (
        <p className="env-vars-empty">No environment variables configured.</p>
      )}
    </div>
  )
}
