'use client'

import { useState, useCallback, useEffect } from 'react'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  ListProjectsRequestSchema,
  SetProjectUserTitleRequestSchema,
  SetProjectTitleRequestSchema,
  type ProjectInfo,
} from '@/gen/centy_pb'
import '@/styles/components/ProjectTitleEditor.css'

interface ProjectTitleEditorProps {
  projectPath: string
}

type TitleScope = 'user' | 'project'

export function ProjectTitleEditor({ projectPath }: ProjectTitleEditorProps) {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null)
  const [userTitle, setUserTitle] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [scope, setScope] = useState<TitleScope>('user')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!projectPath) return

    const fetchProjectInfo = async () => {
      try {
        const request = create(ListProjectsRequestSchema, {})
        const response = await centyClient.listProjects(request)
        const project = response.projects.find(p => p.path === projectPath)
        if (project) {
          setProjectInfo(project)
          setUserTitle(project.userTitle || '')
          setProjectTitle(project.projectTitle || '')
        }
      } catch (err) {
        console.error('Failed to fetch project info:', err)
      }
    }

    fetchProjectInfo()
  }, [projectPath])

  const handleSave = useCallback(async () => {
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      if (scope === 'user') {
        const request = create(SetProjectUserTitleRequestSchema, {
          projectPath,
          title: userTitle,
        })
        const response = await centyClient.setProjectUserTitle(request)
        if (!response.success) {
          setError(response.error || 'Failed to save user title')
          return
        }
        if (response.project) {
          setProjectInfo(response.project)
          setUserTitle(response.project.userTitle || '')
          setProjectTitle(response.project.projectTitle || '')
        }
        setSuccess('User title saved successfully')
      } else {
        const request = create(SetProjectTitleRequestSchema, {
          projectPath,
          title: projectTitle,
        })
        const response = await centyClient.setProjectTitle(request)
        if (!response.success) {
          setError(response.error || 'Failed to save project title')
          return
        }
        if (response.project) {
          setProjectInfo(response.project)
          setUserTitle(response.project.userTitle || '')
          setProjectTitle(response.project.projectTitle || '')
        }
        setSuccess('Project title saved successfully')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save title')
    } finally {
      setSaving(false)
    }
  }, [scope, userTitle, projectTitle, projectPath])

  const handleClear = useCallback(async () => {
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      if (scope === 'user') {
        const request = create(SetProjectUserTitleRequestSchema, {
          projectPath,
          title: '', // Empty string clears the title
        })
        const response = await centyClient.setProjectUserTitle(request)
        if (!response.success) {
          setError(response.error || 'Failed to clear user title')
          return
        }
        if (response.project) {
          setProjectInfo(response.project)
          setUserTitle('')
          setProjectTitle(response.project.projectTitle || '')
        }
        setSuccess('User title cleared')
      } else {
        const request = create(SetProjectTitleRequestSchema, {
          projectPath,
          title: '', // Empty string clears the title
        })
        const response = await centyClient.setProjectTitle(request)
        if (!response.success) {
          setError(response.error || 'Failed to clear project title')
          return
        }
        if (response.project) {
          setProjectInfo(response.project)
          setUserTitle(response.project.userTitle || '')
          setProjectTitle('')
        }
        setSuccess('Project title cleared')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear title')
    } finally {
      setSaving(false)
    }
  }, [scope, projectPath])

  const currentTitle = scope === 'user' ? userTitle : projectTitle
  const setCurrentTitle = scope === 'user' ? setUserTitle : setProjectTitle
  const hasChanges =
    scope === 'user'
      ? userTitle !== (projectInfo?.userTitle || '')
      : projectTitle !== (projectInfo?.projectTitle || '')

  if (!projectInfo) {
    return <div className="title-loading">Loading project info...</div>
  }

  return (
    <div className="project-title-editor">
      <div className="title-scope-selector">
        <span className="title-scope-label">Title Scope:</span>
        <div className="title-scope-buttons">
          <button
            type="button"
            onClick={() => setScope('user')}
            className={`title-scope-btn ${scope === 'user' ? 'active' : ''}`}
          >
            User (local)
          </button>
          <button
            type="button"
            onClick={() => setScope('project')}
            className={`title-scope-btn ${scope === 'project' ? 'active' : ''}`}
          >
            Project (shared)
          </button>
        </div>
      </div>

      <p className="title-scope-hint">
        {scope === 'user'
          ? 'User titles are stored locally and only visible to you.'
          : 'Project titles are stored in .centy/project.json and shared with your team.'}
      </p>

      <div className="title-input-group">
        <label htmlFor="project-title" className="title-input-label">
          Custom Title:
        </label>
        <input
          id="project-title"
          type="text"
          value={currentTitle}
          onChange={e => setCurrentTitle(e.target.value)}
          placeholder={projectInfo.name || 'Project name'}
          className="title-input"
        />
      </div>

      {error && <div className="title-error">{error}</div>}

      {success && <div className="title-success">{success}</div>}

      <div className="title-actions">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="title-save-btn"
        >
          {saving ? 'Saving...' : 'Save Title'}
        </button>
        <button
          onClick={handleClear}
          disabled={saving || !currentTitle}
          className="title-clear-btn"
        >
          Clear Title
        </button>
      </div>

      <div className="title-preview">
        <h4 className="title-preview-label">Current Display Name</h4>
        <p className="title-preview-value">
          <strong>
            {projectInfo.userTitle ||
              projectInfo.projectTitle ||
              projectInfo.name ||
              'Unnamed Project'}
          </strong>
          <span className="title-source">
            (
            {projectInfo.userTitle
              ? 'user title'
              : projectInfo.projectTitle
                ? 'project title'
                : 'directory name'}
            )
          </span>
        </p>
      </div>
    </div>
  )
}
