# Runtime Error: generateStaticParams missing for dynamic route with output: export

When navigating to /issues/[[...params]] route, Next.js throws a runtime error:

**Error Message:**
Page "/issues/[[...params]]/page" is missing param "/issues/[[...params]]" in "generateStaticParams()", which is required with "output: export" config.

**Steps to Reproduce:**

1. Navigate to http://localhost:5180/issues/291e7d8c-de2f-431c-85c9-ebaa2a2bfc29/?project=%2FUsers%2Fofek%2Fdev%2Fgit%2Fgithub%2Fcenty-io%2Fcenty-daemon
2. Page fails to render and shows Next.js error overlay

**Expected Behavior:**
The issue detail page should load and display the AI Plan button.

**Root Cause:**
The dynamic catch-all route [[...params]] requires generateStaticParams() to define all possible paths when using output: export configuration in Next.js.

**Possible Solutions:**

1. Remove output: export from next.config if SSR/dynamic rendering is needed
2. Implement generateStaticParams() to return all possible issue paths
3. Change the route structure to avoid catch-all params with static export
