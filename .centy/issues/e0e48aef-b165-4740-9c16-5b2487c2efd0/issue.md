# Add Open in VS Code button for issues

## Summary

Add a button/action in the issue detail page that calls the daemon's OpenInTempVscode endpoint to open the issue in a temporary VS Code workspace.

## Background

The daemon already implements the temp workspace feature:

- OpenInTempVscode RPC - clones project to temp folder, sets up VS Code tasks.json, opens VS Code
- ListTempWorkspaces RPC - lists all temp workspaces
- CloseTempWorkspace RPC - cleanup a workspace
- CleanupExpiredWorkspaces RPC - cleanup expired workspaces

The proto types are already generated in gen/centy_pb.ts.

## Requirements

1. Add an Open in VS Code button on the issue detail page
2. When clicked, call OpenInTempVscode with project_path, issue_id, and action (plan/implement)
3. Show loading state while opening
4. Handle success/error responses appropriately
5. Consider showing a list of active temp workspaces in settings or a dedicated page
