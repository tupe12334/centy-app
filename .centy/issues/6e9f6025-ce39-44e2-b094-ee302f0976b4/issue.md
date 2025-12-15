# Organization views and org issue management

Add organization views and org issue management to the web app.

## Goal

Enable users to view, create, and manage organization-level issues in the centy-app.

## Tasks

- Add organization list view (sidebar or main navigation)
- Create organization detail page showing:
  - Org info (name, description, project count)
  - Org issues list with filtering
  - Projects assigned to the org
- Add org issue CRUD UI:
  - Create org issue form
  - Org issue detail view
  - Edit org issue form
  - Delete org issue confirmation
- Add org issue to project assignment UI (referenced_projects)
- Integrate with gRPC-web org issue endpoints

## API Endpoints to Use

- CreateOrgIssue, GetOrgIssue, ListOrgIssues, UpdateOrgIssue, DeleteOrgIssue
- GetOrgConfig for org-level states and priorities
