'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const organization = params.organization as string
  const project = params.project as string

  useEffect(() => {
    // Redirect to issues as the default project page
    router.replace(`/${organization}/${project}/issues`)
  }, [organization, project, router])

  return (
    <div className="loading">
      <p>Loading project...</p>
    </div>
  )
}
