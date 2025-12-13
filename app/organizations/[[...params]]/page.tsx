import { OrganizationsPageClient } from './OrganizationsPageClient'

export async function generateStaticParams() {
  return [{ params: undefined }]
}

export default function Page() {
  return <OrganizationsPageClient />
}
