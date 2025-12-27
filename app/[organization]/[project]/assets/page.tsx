import { SharedAssets } from '@/components/assets/SharedAssets'

export async function generateStaticParams() {
  return [{ organization: '_placeholder', project: '_placeholder' }]
}

export default function ProjectAssetsPage() {
  return <SharedAssets />
}
