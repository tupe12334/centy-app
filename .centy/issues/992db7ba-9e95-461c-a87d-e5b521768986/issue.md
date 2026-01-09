# SSG: Convert /archived page to Server Component wrapper

The /archived/page.tsx likely has ‘use client’ at page level. Convert to Server Component wrapper pattern - remove ‘use client’ and add export const dynamic = ‘force-static’ for optimal SSG behavior.
