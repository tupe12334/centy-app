# SSG: Convert /settings page to Server Component wrapper

The /settings/page.tsx is currently a Client Component with ‘use client’ directive. Remove it and add export const dynamic = ‘force-static’. The GeneralSettings component will hydrate client-side while the page shell is statically generated.
