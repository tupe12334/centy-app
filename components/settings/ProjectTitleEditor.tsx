'use client'

import { useState, useCallback, useEffect } from 'react'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import { ListProjectsRequestSchema, type ProjectInfo } from '@/gen/centy_pb'

interface ProjectTitleEditorProps {
  projectPath: string
}

export function ProjectTitleEditor({ projectPath }: ProjectTitleEditorProps) {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null)
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectPath) return

    const fetchProjectInfo = async () => {
      try {
        const request = create(ListProjectsRequestSchema, {})
        const response = await centyClient.listProjects(request)
        const project = response.projects.find(p => p.path === projectPath)
        if (project) {
          setProjectInfo(project)
          setTitle(project.name || '')
        }
      } catch (err) {
        console.error('Failed to fetch project info:', err)
      }
    }

    fetchProjectInfo()
  }, [projectPath])

  const handleSave = useCallback(async () => {
    // TODO: Project title editing RPCs not implemented in daemon
    setError('Project title editing not yet implemented')
  }, [])

  if (!projectInfo) {
    return (
      <div className="project-title-editor loading">
        Loading project info...
      </div>
    )
  }

  return (
    <div className="project-title-editor">
      <div className="form-group">
        <label htmlFor="project-title">Project Title:</label>
        <input
          id="project-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Project name"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button onClick={handleSave} className="save-btn">
        Save Title
      </button>
    </div>
  )
}
