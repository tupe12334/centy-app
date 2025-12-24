import { ProjectRouterClient } from './ProjectRouterClient'

export async function generateStaticParams() {
  // Return a placeholder - Cloudflare Pages SPA fallback handles unknown routes
  return [{ path: undefined }]
}

export default function CatchAllPage() {
  return <ProjectRouterClient />
}
