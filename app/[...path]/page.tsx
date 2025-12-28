import { CatchAllRouter } from '@/components/routing/CatchAllRouter'

export async function generateStaticParams() {
  // Return a placeholder to satisfy Next.js static export requirement
  // Actual routing is handled client-side by parsing the pathname
  return [{ path: ['_fallback'] }]
}

/**
 * Catch-all route handler for dynamic [organization]/[project]/... paths
 *
 * This page handles all paths that don't match explicit routes.
 * The CatchAllRouter component parses the pathname client-side
 * and renders the appropriate component.
 */
export default function CatchAllPage() {
  return <CatchAllRouter />
}
