# SSG: Add force-static to /organizations/new page

The /organizations/new page is a form-only page that doesn’t require any server-side data fetching. Add export const dynamic = ‘force-static’ to explicitly mark this page as statically generated, ensuring Next.js never attempts dynamic rendering.
