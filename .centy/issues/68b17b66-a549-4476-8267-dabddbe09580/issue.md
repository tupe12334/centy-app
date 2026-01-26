# GetIssue RPC uses global project selector instead of URL path

When accessing an issue via direct URL (e.g., /centy-io/centy-app/issues/{uuid}), the GetIssue RPC uses the globally selected project from the header dropdown instead of deriving the project from the URL path.

\## Steps to Reproduce

1. Navigate to an issue in project A (e.g., centy-app)

2. Copy the issue URL

3. Change the global project selector to a different project (e.g., centy-daemon)

4. Paste the URL and navigate to it directly

\## Expected Behavior

The issue should load correctly based on the org/project specified in the URL path.

\## Actual Behavior

The daemon returns “not found” because it looks for the issue in the globally selected project (centy-daemon) instead of the project from the URL (centy-app).

\## Root Cause

The GetIssue RPC appears to use the global project context instead of parsing the project from the URL path parameters.

\## Impact

- Direct links to issues don’t work reliably

- Sharing issue URLs with others may fail if they have a different project selected

- Bookmarked issues may not load correctly
