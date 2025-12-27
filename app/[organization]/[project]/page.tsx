import { redirect } from 'next/navigation'

export async function generateStaticParams() {
  return [{ organization: '_placeholder', project: '_placeholder' }]
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ organization: string; project: string }>
}) {
  const { organization, project } = await params
  redirect(`/${organization}/${project}/issues`)
}
