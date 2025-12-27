import { ProjectConfig } from '@/components/settings/ProjectConfig'

export async function generateStaticParams() {
  return [{ organization: '_placeholder', project: '_placeholder' }]
}

export default function ProjectConfigPage() {
  return <ProjectConfig />
}
