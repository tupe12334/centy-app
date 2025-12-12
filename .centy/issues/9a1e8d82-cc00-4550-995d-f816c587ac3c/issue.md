# Use display_path for user-friendly project paths

Update the app to use the new `display_path` field from API responses instead of raw `project_path`.

## Background

The daemon now provides a `display_path` field that formats paths with `~/` instead of the full home directory path (e.g., `~/dev/project` instead of `/Users/username/dev/project`).

This field is available in:

- `ProjectInfo.display_path`
- `IssueWithProject.display_path`
- `DocWithProject.display_path`
- `PrWithProject.display_path`

## Tasks

- [ ] Update project selector to show `display_path`
- [ ] Update global search results (issues, docs, PRs) to show `display_path`
- [ ] Update any other UI components that display project paths

## Related

- Daemon issue: 3f2df5db-5595-4b22-86a6-7e0fc576cfa7 (completed)
