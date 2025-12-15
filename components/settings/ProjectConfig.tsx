'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  GetConfigRequestSchema,
  GetManifestRequestSchema,
  GetDaemonInfoRequestSchema,
  GetProjectVersionRequestSchema,
  UpdateVersionRequestSchema,
  UpdateConfigRequestSchema,
  IsInitializedRequestSchema,
  GetLocalLlmConfigRequestSchema,
  UpdateLocalLlmConfigRequestSchema,
  GetProjectInfoRequestSchema,
  SetProjectOrganizationRequestSchema,
  type Config,
  type Manifest,
  type DaemonInfo,
  type ProjectVersionInfo,
  type CustomFieldDefinition,
  type LlmConfig,
  type LocalLlmConfig,
} from '@/gen/centy_pb'
import { useProject } from '@/components/providers/ProjectProvider'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import { StateListEditor } from '@/components/settings/StateListEditor'
import { PriorityEditor } from '@/components/settings/PriorityEditor'
import { CustomFieldsEditor } from '@/components/settings/CustomFieldsEditor'
import { DefaultsEditor } from '@/components/settings/DefaultsEditor'
import { LlmSettingsEditor } from '@/components/settings/LlmSettingsEditor'
import { AgentConfigEditor } from '@/components/settings/AgentConfigEditor'
import { ProjectTitleEditor } from '@/components/settings/ProjectTitleEditor'

export function ProjectConfig() {
  const { projectPath, isInitialized, setIsInitialized } = useProject()
  const { organizations, refreshOrganizations } = useOrganization()

  const [config, setConfig] = useState<Config | null>(null)
  const [projectOrgSlug, setProjectOrgSlug] = useState<string>('')
  const [savingOrg, setSavingOrg] = useState(false)
  const [originalConfig, setOriginalConfig] = useState<Config | null>(null)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [daemonInfo, setDaemonInfo] = useState<DaemonInfo | null>(null)
  const [versionInfo, setVersionInfo] = useState<ProjectVersionInfo | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [targetVersion, setTargetVersion] = useState('')
  const [updating, setUpdating] = useState(false)

  // LLM Config state for project-level agent configuration
  const [projectLlmConfig, setProjectLlmConfig] = useState<
    LocalLlmConfig | undefined
  >(undefined)
  const [originalProjectLlmConfig, setOriginalProjectLlmConfig] = useState<
    LocalLlmConfig | undefined
  >(undefined)
  const [globalLlmConfig, setGlobalLlmConfig] = useState<
    LocalLlmConfig | undefined
  >(undefined)
  const [savingLlmConfig, setSavingLlmConfig] = useState(false)

  const isLlmConfigDirty =
    projectLlmConfig && originalProjectLlmConfig
      ? JSON.stringify(projectLlmConfig) !==
        JSON.stringify(originalProjectLlmConfig)
      : false

  const isDirty =
    config && originalConfig
      ? JSON.stringify(config) !== JSON.stringify(originalConfig)
      : false

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const checkInitialized = useCallback(
    async (path: string) => {
      if (!path.trim()) {
        setIsInitialized(null)
        return
      }

      try {
        const request = create(IsInitializedRequestSchema, {
          projectPath: path.trim(),
        })
        const response = await centyClient.isInitialized(request)
        setIsInitialized(response.initialized)
      } catch {
        setIsInitialized(false)
      }
    },
    [setIsInitialized]
  )

  const fetchDaemonInfo = useCallback(async () => {
    try {
      const request = create(GetDaemonInfoRequestSchema, {})
      const response = await centyClient.getDaemonInfo(request)
      setDaemonInfo(response)
    } catch (err) {
      console.error('Failed to fetch daemon info:', err)
    }
  }, [])

  const fetchProjectData = useCallback(async () => {
    if (!projectPath.trim() || isInitialized !== true) return

    setLoading(true)
    setError(null)

    try {
      const configRequest = create(GetConfigRequestSchema, {
        projectPath: projectPath.trim(),
      })
      const configResponse = await centyClient.getConfig(configRequest)
      setConfig(configResponse)
      setOriginalConfig(structuredClone(configResponse))

      const manifestRequest = create(GetManifestRequestSchema, {
        projectPath: projectPath.trim(),
      })
      const manifestResponse = await centyClient.getManifest(manifestRequest)
      setManifest(manifestResponse)

      const versionRequest = create(GetProjectVersionRequestSchema, {
        projectPath: projectPath.trim(),
      })
      const versionResponse =
        await centyClient.getProjectVersion(versionRequest)
      setVersionInfo(versionResponse)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setLoading(false)
    }
  }, [projectPath, isInitialized])

  const handleSaveConfig = useCallback(async () => {
    if (!projectPath || !config) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const request = create(UpdateConfigRequestSchema, {
        projectPath: projectPath.trim(),
        config: config,
      })
      const response = await centyClient.updateConfig(request)

      if (response.success && response.config) {
        setSuccess('Configuration saved successfully')
        setConfig(response.config)
        setOriginalConfig(structuredClone(response.config))
      } else {
        setError(response.error || 'Failed to save configuration')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setSaving(false)
    }
  }, [projectPath, config])

  const handleResetConfig = useCallback(() => {
    if (originalConfig) {
      setConfig(structuredClone(originalConfig))
    }
  }, [originalConfig])

  const handleUpdateVersion = useCallback(async () => {
    if (!projectPath || !targetVersion) return

    setUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const request = create(UpdateVersionRequestSchema, {
        projectPath,
        targetVersion,
      })
      const response = await centyClient.updateVersion(request)

      if (response.success) {
        setSuccess(
          `Updated from ${response.fromVersion} to ${response.toVersion}. Migrations applied: ${response.migrationsApplied.join(', ') || 'none'}`
        )
        setTargetVersion('')
        const versionRequest = create(GetProjectVersionRequestSchema, {
          projectPath,
        })
        const versionResponse =
          await centyClient.getProjectVersion(versionRequest)
        setVersionInfo(versionResponse)
      } else {
        setError(response.error || 'Failed to update version')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setUpdating(false)
    }
  }, [projectPath, targetVersion])

  const updateConfig = useCallback(
    (updates: Partial<Config>) => {
      if (!config) return
      setConfig({ ...config, ...updates })
    },
    [config]
  )

  const fetchLlmConfigs = useCallback(async () => {
    if (!projectPath.trim()) return

    try {
      // Fetch global config first
      const globalRequest = create(GetLocalLlmConfigRequestSchema, {
        projectPath: '',
      })
      const globalResponse = await centyClient.getLocalLlmConfig(globalRequest)
      setGlobalLlmConfig(globalResponse.config)

      // Fetch project config
      const projectRequest = create(GetLocalLlmConfigRequestSchema, {
        projectPath: projectPath.trim(),
      })
      const projectResponse =
        await centyClient.getLocalLlmConfig(projectRequest)
      setProjectLlmConfig(projectResponse.config)
      setOriginalProjectLlmConfig(
        projectResponse.config
          ? structuredClone(projectResponse.config)
          : undefined
      )
    } catch (err) {
      console.error('Failed to fetch LLM configs:', err)
    }
  }, [projectPath])

  const handleSaveLlmConfig = useCallback(async () => {
    if (!projectPath || !projectLlmConfig) return

    setSavingLlmConfig(true)
    setError(null)
    setSuccess(null)

    try {
      const request = create(UpdateLocalLlmConfigRequestSchema, {
        projectPath: projectPath.trim(),
        config: projectLlmConfig,
      })
      const response = await centyClient.updateLocalLlmConfig(request)

      if (response.success && response.config) {
        setSuccess('Agent configuration saved successfully')
        setProjectLlmConfig(response.config)
        setOriginalProjectLlmConfig(structuredClone(response.config))
      } else {
        setError(response.error || 'Failed to save agent configuration')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to daemon'
      )
    } finally {
      setSavingLlmConfig(false)
    }
  }, [projectPath, projectLlmConfig])

  const handleResetLlmConfig = useCallback(() => {
    if (originalProjectLlmConfig) {
      setProjectLlmConfig(structuredClone(originalProjectLlmConfig))
    }
  }, [originalProjectLlmConfig])

  const fetchProjectOrg = useCallback(async () => {
    if (!projectPath.trim()) return

    try {
      const request = create(GetProjectInfoRequestSchema, {
        projectPath: projectPath.trim(),
      })
      const response = await centyClient.getProjectInfo(request)
      if (response.found && response.project) {
        setProjectOrgSlug(response.project.organizationSlug || '')
      }
    } catch (err) {
      console.error('Failed to fetch project organization:', err)
    }
  }, [projectPath])

  const handleOrgChange = useCallback(
    async (newOrgSlug: string) => {
      if (!projectPath.trim()) return

      setSavingOrg(true)
      setError(null)
      setSuccess(null)

      try {
        const request = create(SetProjectOrganizationRequestSchema, {
          projectPath: projectPath.trim(),
          organizationSlug: newOrgSlug,
        })
        const response = await centyClient.setProjectOrganization(request)

        if (response.success) {
          setProjectOrgSlug(newOrgSlug)
          setSuccess(
            newOrgSlug
              ? 'Project assigned to organization'
              : 'Project removed from organization'
          )
          refreshOrganizations()
        } else {
          setError(response.error || 'Failed to update organization')
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to connect to daemon'
        )
      } finally {
        setSavingOrg(false)
      }
    },
    [projectPath, refreshOrganizations]
  )

  useEffect(() => {
    fetchDaemonInfo()
  }, [fetchDaemonInfo])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkInitialized(projectPath)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [projectPath, checkInitialized])

  useEffect(() => {
    if (isInitialized === true) {
      fetchProjectData()
      fetchLlmConfigs()
      fetchProjectOrg()
    }
  }, [isInitialized, fetchProjectData, fetchLlmConfigs, fetchProjectOrg])

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>Project Configuration</h2>
        {isDirty && <span className="unsaved-indicator">Unsaved changes</span>}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {!projectPath && (
        <div className="no-project-message">
          <p>Select a project from the header to view project configuration</p>
        </div>
      )}

      {projectPath && isInitialized === false && (
        <div className="not-initialized-message">
          <p>Centy is not initialized in this directory</p>
          <Link href="/">Initialize Project</Link>
        </div>
      )}

      {projectPath && isInitialized === true && (
        <>
          {loading ? (
            <div className="loading">Loading project configuration...</div>
          ) : (
            <>
              <section className="settings-section">
                <h3>Organization</h3>
                <div className="settings-card">
                  <div className="form-group">
                    <label htmlFor="project-org">Assign to Organization</label>
                    <div className="org-select-row">
                      <select
                        id="project-org"
                        value={projectOrgSlug}
                        onChange={e => handleOrgChange(e.target.value)}
                        disabled={savingOrg}
                        className="org-select"
                      >
                        <option value="">No Organization (Ungrouped)</option>
                        {organizations.map(org => (
                          <option key={org.slug} value={org.slug}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                      {savingOrg && (
                        <span className="saving-indicator">Saving...</span>
                      )}
                    </div>
                    <span className="form-hint">
                      Group this project under an organization for better
                      management.{' '}
                      <Link href="/organizations">Manage organizations</Link>
                    </span>
                  </div>
                </div>
              </section>

              <section className="settings-section">
                <h3>Project Title</h3>
                <div className="settings-card">
                  <ProjectTitleEditor projectPath={projectPath} />
                </div>
              </section>

              <section className="settings-section">
                <h3>Version Management</h3>
                <div className="settings-card">
                  {versionInfo && (
                    <>
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">Project Version</span>
                          <span className="info-value">
                            {versionInfo.projectVersion}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Daemon Version</span>
                          <span className="info-value">
                            {versionInfo.daemonVersion}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Status</span>
                          <span
                            className={`info-value status-${versionInfo.comparison}`}
                          >
                            {versionInfo.comparison === 'equal'
                              ? 'Up to date'
                              : versionInfo.comparison === 'project_behind'
                                ? 'Update available'
                                : 'Project ahead of daemon'}
                          </span>
                        </div>
                        {versionInfo.degradedMode && (
                          <div className="info-item warning">
                            <span className="info-label">Warning</span>
                            <span className="info-value">
                              Running in degraded mode (project version ahead of
                              daemon)
                            </span>
                          </div>
                        )}
                      </div>

                      {versionInfo.comparison === 'project_behind' &&
                        daemonInfo?.availableVersions &&
                        daemonInfo.availableVersions.length > 0 && (
                          <div className="version-update">
                            <label htmlFor="target-version">
                              Update to version:
                            </label>
                            <select
                              id="target-version"
                              value={targetVersion}
                              onChange={e => setTargetVersion(e.target.value)}
                            >
                              <option value="">Select version...</option>
                              {daemonInfo.availableVersions.map(v => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={handleUpdateVersion}
                              disabled={!targetVersion || updating}
                              className="update-btn"
                            >
                              {updating ? 'Updating...' : 'Update'}
                            </button>
                          </div>
                        )}
                    </>
                  )}
                </div>
              </section>

              {config && (
                <>
                  <section className="settings-section">
                    <h3>Issue States</h3>
                    <div className="settings-card">
                      <StateListEditor
                        states={config.allowedStates}
                        stateColors={config.stateColors}
                        defaultState={config.defaultState}
                        onStatesChange={states =>
                          updateConfig({ allowedStates: states })
                        }
                        onColorsChange={colors =>
                          updateConfig({ stateColors: colors })
                        }
                        onDefaultChange={defaultState =>
                          updateConfig({ defaultState })
                        }
                      />
                    </div>
                  </section>

                  <section className="settings-section">
                    <h3>Priority Levels</h3>
                    <div className="settings-card">
                      <PriorityEditor
                        levels={config.priorityLevels}
                        colors={config.priorityColors}
                        onLevelsChange={priorityLevels =>
                          updateConfig({ priorityLevels })
                        }
                        onColorsChange={colors =>
                          updateConfig({ priorityColors: colors })
                        }
                      />
                    </div>
                  </section>

                  <section className="settings-section">
                    <h3>Custom Fields</h3>
                    <div className="settings-card">
                      <CustomFieldsEditor
                        fields={config.customFields as CustomFieldDefinition[]}
                        onChange={customFields =>
                          updateConfig({ customFields })
                        }
                      />
                    </div>
                  </section>

                  <section className="settings-section">
                    <h3>Default Values</h3>
                    <div className="settings-card">
                      <DefaultsEditor
                        value={config.defaults}
                        onChange={defaults => updateConfig({ defaults })}
                        suggestedKeys={config.customFields.map(f => f.name)}
                      />
                    </div>
                  </section>

                  <section className="settings-section">
                    <h3>LLM Settings</h3>
                    <div className="settings-card">
                      <LlmSettingsEditor
                        value={config.llm as LlmConfig | undefined}
                        onChange={llm => updateConfig({ llm })}
                      />
                    </div>
                  </section>

                  <div className="settings-actions">
                    <button
                      type="button"
                      onClick={handleResetConfig}
                      disabled={!isDirty || saving}
                      className="reset-btn"
                    >
                      Reset Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveConfig}
                      disabled={!isDirty || saving}
                      className="save-btn"
                    >
                      {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </>
              )}

              <section className="settings-section">
                <h3>Agent Configuration (Project Override)</h3>
                {isLlmConfigDirty && (
                  <span className="unsaved-indicator">Unsaved changes</span>
                )}
                <p className="section-description">
                  Configure agents for this project. Leave empty to use global
                  settings.
                </p>
                <div className="settings-card">
                  <AgentConfigEditor
                    config={projectLlmConfig}
                    onChange={setProjectLlmConfig}
                    scope="project"
                    globalConfig={globalLlmConfig}
                  />
                </div>
                <div className="settings-actions">
                  <button
                    type="button"
                    onClick={handleResetLlmConfig}
                    disabled={!isLlmConfigDirty || savingLlmConfig}
                    className="reset-btn"
                  >
                    Reset Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLlmConfig}
                    disabled={!isLlmConfigDirty || savingLlmConfig}
                    className="save-btn"
                  >
                    {savingLlmConfig ? 'Saving...' : 'Save Agent Configuration'}
                  </button>
                </div>
              </section>

              <section className="settings-section">
                <h3>Manifest</h3>
                <div className="settings-card">
                  {manifest && (
                    <div className="manifest-details">
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">Schema Version</span>
                          <span className="info-value">
                            {manifest.schemaVersion}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Centy Version</span>
                          <span className="info-value">
                            {manifest.centyVersion}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Created</span>
                          <span className="info-value">
                            {manifest.createdAt
                              ? new Date(manifest.createdAt).toLocaleString()
                              : '-'}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Updated</span>
                          <span className="info-value">
                            {manifest.updatedAt
                              ? new Date(manifest.updatedAt).toLocaleString()
                              : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}
