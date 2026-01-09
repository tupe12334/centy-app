# SSG: Add force-static to /project/init page

The /project/init page renders a wizard UI for initializing Centy projects. The page shell can be statically generated since all data fetching happens client-side via gRPC. Add export const dynamic = ‘force-static’ for optimal SSG behavior.
