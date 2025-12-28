'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { centyClient } from '@/lib/grpc/client'
import { create } from '@bufbuild/protobuf'
import {
  ListProjectsRequestSchema,
  ListOrganizationsRequestSchema,
  SetProjectFavoriteRequestSchema,
  type ProjectInfo,
  type Organization,
} from '@/gen/centy_pb'
import { UNGROUPED_ORG_MARKER } from '@/lib/project-resolver'

export function ProjectsGrid() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch both projects and organizations in parallel
      const [projectsResponse, orgsResponse] = await Promise.all([
        centyClient.listProjects(
          create(ListProjectsRequestSchema, {
            includeStale: false,
          })
        ),
        centyClient.listOrganizations(
          create(ListOrganizationsRequestSchema, {})
        ),
      ])

      setProjects(projectsResponse.projects)
      setOrganizations(orgsResponse.organizations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggleFavorite = async (
    e: React.MouseEvent,
    project: ProjectInfo
  ) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const request = create(SetProjectFavoriteRequestSchema, {
        projectPath: project.path,
        isFavorite: !project.isFavorite,
      })
      const response = await centyClient.setProjectFavorite(request)
      if (response.success && response.project) {
        setProjects(prev =>
          prev.map(p => (p.path === project.path ? response.project! : p))
        )
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  const handleProjectClick = (project: ProjectInfo) => {
    const orgSlug = project.organizationSlug || UNGROUPED_ORG_MARKER
    router.push(`/${orgSlug}/${project.name}/issues`)
  }

  // Group projects by organization
  const groupedProjects = useMemo(() => {
    const groups: Map<string, { name: string; projects: ProjectInfo[] }> =
      new Map()

    // Initialize ungrouped
    groups.set('', { name: 'Ungrouped', projects: [] })

    for (const project of projects) {
      const orgSlug = project.organizationSlug || ''
      if (!groups.has(orgSlug)) {
        const org = organizations.find(o => o.slug === orgSlug)
        groups.set(orgSlug, { name: org?.name || orgSlug, projects: [] })
      }
      groups.get(orgSlug)!.projects.push(project)
    }

    // Sort: organizations first (alphabetically), then ungrouped
    // Filter out empty groups
    const sortedGroups = Array.from(groups.entries())
      .filter(([, g]) => g.projects.length > 0)
      .sort(([slugA], [slugB]) => {
        if (slugA === '' && slugB !== '') return 1
        if (slugA !== '' && slugB === '') return -1
        return slugA.localeCompare(slugB)
      })

    // Sort projects within each group: favorites first, then by name
    sortedGroups.forEach(([, group]) => {
      group.projects.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1
        if (!a.isFavorite && b.isFavorite) return 1
        return a.name.localeCompare(b.name)
      })
    })

    return sortedGroups
  }, [projects, organizations])

  if (loading) {
    return (
      <div className="projects-grid-loading">
        <p>Loading projects...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="projects-grid-error">
        <p>Error: {error}</p>
        <button onClick={fetchData} className="retry-btn">
          Retry
        </button>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="projects-grid-empty">
        <h2>No projects found</h2>
        <p>
          Initialize a project with Centy to see it here, or{' '}
          <Link href="/organizations/new">create an organization</Link> to get
          started.
        </p>
      </div>
    )
  }

  return (
    <div className="projects-grid-container">
      <div className="projects-grid-header">
        <h1>Projects</h1>
        <div className="projects-grid-actions">
          <button onClick={fetchData} className="refresh-btn">
            Refresh
          </button>
          <Link href="/organizations/new" className="create-org-btn">
            + New Organization
          </Link>
        </div>
      </div>

      {groupedProjects.map(([orgSlug, group]) => (
        <div key={orgSlug || '__ungrouped'} className="project-org-group">
          <div className="org-group-header">
            <h2>
              {orgSlug ? (
                <>
                  <span className="org-icon">🏢</span>
                  {group.name}
                </>
              ) : (
                <>
                  <span className="org-icon">📁</span>
                  {group.name}
                </>
              )}
            </h2>
            <span className="org-project-count">{group.projects.length}</span>
          </div>

          <div className="projects-grid">
            {group.projects.map(project => (
              <div
                key={project.path}
                className="project-card"
                onClick={() => handleProjectClick(project)}
              >
                <div className="project-card-header">
                  <h3 className="project-name">{project.name}</h3>
                  <button
                    className={`favorite-btn ${project.isFavorite ? 'active' : ''}`}
                    onClick={e => handleToggleFavorite(e, project)}
                    title={
                      project.isFavorite
                        ? 'Remove from favorites'
                        : 'Add to favorites'
                    }
                  >
                    {project.isFavorite ? '★' : '☆'}
                  </button>
                </div>

                {!project.initialized && (
                  <div className="project-badge not-initialized">
                    Not initialized
                  </div>
                )}

                {project.initialized && (
                  <div className="project-stats">
                    <div className="project-stat">
                      <span className="stat-icon">📋</span>
                      <span className="stat-label">Issues</span>
                      <span className="stat-value">{project.issueCount}</span>
                    </div>
                    <div className="project-stat">
                      <span className="stat-icon">📄</span>
                      <span className="stat-label">Docs</span>
                      <span className="stat-value">{project.docCount}</span>
                    </div>
                  </div>
                )}

                <div className="project-path" title={project.displayPath}>
                  {project.displayPath}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="projects-grid-footer">
        <Link href="/issues" className="view-all-link">
          View All Issues
        </Link>
        <Link href="/docs" className="view-all-link">
          View All Docs
        </Link>
        <Link href="/organizations" className="view-all-link">
          Manage Organizations
        </Link>
      </div>
    </div>
  )
}
