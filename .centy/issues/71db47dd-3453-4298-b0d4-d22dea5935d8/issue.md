# Redesign root page - from init wizard to projects hub

## Problem

The current root page (\`/\`) only shows the InitProject wizard. This makes sense for first-time users, but:

- Once projects are initialized, users rarely return to \`/\`
- It doesn't leverage centy's multi-project capabilities
- Returning users get little value from the root page

## Proposal

Transform the root page into a **context-aware projects hub**:

### Behavior Based on State

| State             | Root Page Behavior                  |
| ----------------- | ----------------------------------- |
| No projects       | Show InitProject wizard (current)   |
| One project       | **Auto-redirect to `/issues`**      |
| Multiple projects | Projects gallery with activity feed |

> **Note**: Archived projects are NOT shown on the root page - only active projects.

### Projects Gallery Features (Multiple Projects)

- **Project Cards Grid/List**
  - Project name and path
  - Open issues count, docs count
  - Last activity timestamp
  - Quick actions (go to issues, settings)
- **Activity Sidebar/Panel**
  - Recent issues across all projects
  - Recently modified items
  - Quick filters (my issues, needs attention)

- **Quick Actions**
  - Create issue (with project selector)
  - Add new project (opens InitProject as modal/drawer)
  - Search across all projects

- **Organization Awareness**
  - Group projects by organization
  - Show org-level stats

### Design Considerations

1. **InitProject becomes a modal** - Triggered by Add Project button rather than being the whole page
2. **Remember last project** - Could show quick-access to last used project
3. **Empty state polish** - When no projects, the init wizard should feel welcoming
4. **AI-native hints** - Could show Issues ready for AI or similar AI-focused quick views

## Decisions Made

- [x] Single project: **Auto-redirect to `/issues`**
- [x] Archived projects on root page: **No** - only show active projects
- [ ] Activity feed: unified or per-project tabs?
- [ ] Mobile behavior for projects gallery?

## Technical Notes

- InitProject component should be refactored to work as both page and modal
- May need a new /api/projects/stats endpoint for efficient stats loading
- Consider virtualization for users with many projects
