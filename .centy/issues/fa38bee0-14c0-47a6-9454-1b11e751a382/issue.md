# Replace custom ProjectSelector with Radix UI Select component

Replace the custom ProjectSelector dropdown implementation with Radix UI's Select component for better accessibility, keyboard navigation, and maintainability.

## Current Implementation

- Custom dropdown using `@floating-ui/react` for positioning
- Manual state management for open/close
- Custom styling and animations
- Recently added search functionality

## Proposed Changes

- Use `@radix-ui/react-select` or `@radix-ui/react-combobox` (for search support)
- Leverage built-in accessibility features (ARIA, keyboard nav)
- Maintain existing functionality:
  - Project list with favorites sorting
  - Organization grouping
  - Search/filter capability
  - Manual path entry
  - Archive and favorite actions

## Benefits

- Better accessibility out of the box
- Consistent keyboard navigation
- Reduced custom code maintenance
- Standard patterns for dropdown behavior
