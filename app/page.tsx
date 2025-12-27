'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProjectSelector } from '@/components/project/ProjectSelector'
import { resolveProjectPath } from '@/lib/project-resolver'

const LAST_PROJECT_STORAGE_KEY = 'centy-last-project-path'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showSelector, setShowSelector] = useState(false)

  useEffect(() => {
    async function handleRouting() {
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      const lastProjectPath = localStorage.getItem(LAST_PROJECT_STORAGE_KEY)

      if (lastProjectPath) {
        try {
          const result = await resolveProjectPath(lastProjectPath)
          if (result) {
            router.replace(`/${result.orgSlug}/${result.projectName}/issues`)
            return
          }
        } catch {
          // Failed to resolve, show selector
        }
      }

      setLoading(false)
      setShowSelector(true)
    }

    handleRouting()
  }, [router])

  if (loading) {
    return (
      <div className="home-loading">
        <p>Loading...</p>
      </div>
    )
  }

  if (showSelector) {
    return (
      <div className="home-page">
        <div className="welcome-section">
          <h1>Welcome to Centy</h1>
          <p>
            Select a project to get started, or view all issues across projects.
          </p>
        </div>

        <div className="home-actions">
          <div className="project-selection">
            <h3>Select a Project</h3>
            <ProjectSelector />
          </div>

          <div className="quick-links">
            <h3>Or view all</h3>
            <Link href="/issues" className="quick-link">
              All Issues
            </Link>
            <Link href="/docs" className="quick-link">
              All Docs
            </Link>
            <Link href="/organizations" className="quick-link">
              Organizations
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}
