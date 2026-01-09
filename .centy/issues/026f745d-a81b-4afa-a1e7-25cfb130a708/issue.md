# SSG: Add force-static to /\[org\]/\[proj\]/users/new page

The users/new page is a form page with generateStaticParams placeholders. Add export const dynamic = ‘force-static’ for explicit SSG configuration and consistency with other form pages.
