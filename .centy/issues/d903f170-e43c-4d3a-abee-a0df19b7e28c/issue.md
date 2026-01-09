# Remove general-scope pages and enforce project-scoped routing for docs and issues

## Problem Statement

Currently, the application allows users to access general-scope pages like `/docs/` and `/issues/` without requiring a project context. This violates the architectural principle that all content should be scoped within a project.

## Current Behavior

Users can navigate to:

- `/docs` and `/docs/new` - General docs pages without project context
- `/issues` and `/issues/new` - General issues pages without project context

These routes exist in the codebase at:

- `centy-app/app/docs/`
- `centy-app/app/issues/`

## Desired Behavior

All docs and issues pages should require a project scope. Users should only be able to access:

- `/[organization]/[project]/docs/` - Project-scoped docs
- `/[organization]/[project]/issues/` - Project-scoped issues

## Technical Implementation

### Routes to Remove

1. `centy-app/app/docs/` directory and all subdirectories
1. `centy-app/app/issues/` directory and all subdirectories

### Routes to Keep

1. `centy-app/app/[organization]/[project]/docs/` - Already exists
1. `centy-app/app/[organization]/[project]/issues/` - Already exists

### Changes Required

1. **Remove Route Directories**
   - Delete `centy-app/app/docs/` and `centy-app/app/docs/new/`
   - Delete `centy-app/app/issues/` and `centy-app/app/issues/new/`

1. **Update Navigation Components**
   - Find all components that link to `/docs` or `/issues`
   - Update them to navigate to project-scoped routes
   - Add project context requirement to navigation

1. **Add Redirects (Optional)**
   - Consider adding middleware redirects from `/docs/*` to project selection
   - Redirect from `/issues/*` to project selection or last visited project

1. **Update Deep Linking**
   - External links will need project context
   - Update any shareable URLs to include project scope

## Impact Analysis

### Breaking Changes

- Existing bookmarks to `/docs` or `/issues` will break
- External links without project context will not work
- Users must select a project before accessing these pages

### User Experience

- Forces better context awareness
- Users always know which project they’re working in
- Prevents confusion from mixing content across projects

### Similar Pages to Consider

This pattern may also apply to:

- `/pull-requests` → `/[organization]/[project]/pull-requests`
- `/users` → `/[organization]/[project]/users` (if user lists should be project-scoped)

## Migration Strategy

1. Identify all navigation to general routes
1. Update navigation to require project context
1. Add user-friendly error or redirect for direct access attempts
1. Remove route directories
1. Test all navigation flows
1. Update documentation

## Acceptance Criteria

- [ ] `/docs` and `/issues` routes no longer exist
- [ ] All navigation to docs/issues requires project context
- [ ] Accessing `/docs` or `/issues` directly shows appropriate message or redirects
- [ ] All existing functionality works with project-scoped routes
- [ ] No broken links in the application
