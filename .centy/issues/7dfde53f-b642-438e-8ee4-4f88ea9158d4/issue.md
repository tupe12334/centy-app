# Split general settings and project config into separate pages

The current Settings page combines both daemon/application-level settings and project-specific configuration. These should be split into two distinct pages for better organization and user experience.

## Current State

- Single unified Settings page at /settings
- Combines daemon settings (version, URL, restart controls) with project config (states, priorities, custom fields, defaults, LLM settings)
- Main component: centy-app/components/settings/Settings.tsx (606 lines)

## Proposed Changes

1. Create a new /settings page for general/daemon settings only
2. Create a new /project/config page for project-specific configuration
3. Update navigation in Header.tsx to include both pages
4. Refactor Settings.tsx into two smaller, focused components
5. Split Settings.css accordingly

## Acceptance Criteria

- [ ] General settings page shows only daemon-related settings
- [ ] Project config page shows only project-specific settings
- [ ] Navigation updated with both pages
- [ ] Existing functionality preserved
- [ ] Each page has appropriate empty/loading states
