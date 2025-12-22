# Mobile-friendly navbar and upper segment with hamburger menu

Make the navbar and upper segment of the website mobile-friendly with a hamburger menu pattern.

## Background

The current mobile implementation (640px breakpoint) has basic adjustments:

- Reduced padding and font sizes
- Logo icon hidden
- Navigation links centered and wrapped

However, there are significant mobile UX issues:

- No hamburger menu - navigation links wrap awkwardly
- Header controls may overflow on small screens
- No collapsible pattern for mobile views

## Components Affected

1. `components/layout/Header.tsx` - Main header component
2. `styles/globals.css` - Mobile breakpoint styles
3. Header controls: ThemeToggle, DaemonStatusIndicator, OrgSwitcher, ProjectSelector

## Requirements

### Hamburger Menu

- Implement hamburger menu icon visible on mobile (< 640px)
- Navigation links collapse into hamburger drawer/dropdown
- Smooth open/close animations

### Header Controls

- Header controls remain accessible on mobile
- Consider placing in hamburger menu or condensed layout
- Touch-friendly tap targets (min 44x44px)

### Theme Support

- Works correctly in both light and dark themes

## Acceptance Criteria

- [ ] Hamburger menu icon visible on mobile (< 640px)
- [ ] Navigation links collapse into hamburger drawer/dropdown
- [ ] Header controls remain accessible (in hamburger menu or condensed)
- [ ] Touch-friendly tap targets (min 44x44px)
- [ ] Smooth open/close animations
- [ ] Works in light and dark themes
- [ ] E2E visual tests for mobile navbar
- [ ] Screenshots for mobile viewport (375x667)
- [ ] Screenshots for tablet viewport (768x1024)
