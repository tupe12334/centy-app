# App: Add organization management

Add organization support to centy-app:

## Features to add:

- Create/update/delete organizations
- Assign projects to organizations
- Group projects by organization in project list
- Filter projects by organization
- Show ungrouped projects
- Display organization badge in project cards

## Related

- Issue #29 (Projects organization - CLI implementation)
- Uses new daemon RPCs: CreateOrganization, ListOrganizations, GetOrganization, UpdateOrganization, DeleteOrganization, SetProjectOrganization
