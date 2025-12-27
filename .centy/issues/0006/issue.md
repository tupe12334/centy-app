# Implement strict fonts for consistent rendering across environments

## Problem

The application renders differently across environments (macOS, Linux, Windows) due to system font differences. This causes:

- Visual test failures
- Inconsistent user experience
- Layout shifts between platforms

## Goal

The UI should look **exactly the same** in every environment - local development, CI, and production.

## Proposed Solution

### 1. Use Web Fonts with Strict Loading

```css
@font-face {
  font-family: 'App Font';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: block; /* Prevent flash of unstyled text */
}
```

### 2. Bundle Specific Font Files

- Include exact font files (e.g., Inter, Roboto Mono) in the project
- Don't rely on system fonts or Google Fonts CDN
- Use WOFF2 format for best compression

### 3. Normalize Font Rendering

```css
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale; /* cspell:disable-line */
  text-rendering: optimizeLegibility;
}
```

### 4. Font Metrics Normalization

Consider using `font-synthesis: none` and explicit font metrics to prevent browser adjustments.

## Acceptance Criteria

- [ ] All fonts are bundled in the project (no external CDN)
- [ ] Font rendering is identical on macOS, Linux, and Windows
- [ ] Visual tests pass on all platforms without pixel differences
- [ ] No layout shifts during font loading
- [ ] Document the font stack in the style guide
