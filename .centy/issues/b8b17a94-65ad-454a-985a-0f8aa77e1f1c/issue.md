# Add search functionality to projects select dropdown

Add a search input to the ProjectSelector dropdown that filters projects as the user types. This will improve UX when users have many projects and need to quickly find a specific one.

## Implementation Notes

- Add a search input at the top of the dropdown (above the project list)
- Filter projects client-side as user types
- Search should match against project name and path
- Keep the existing 'manual path' input at the bottom for entering paths not in the list
