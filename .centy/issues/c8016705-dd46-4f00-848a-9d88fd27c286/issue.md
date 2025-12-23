# Add e2e tests for VS Code button visibility based on PATH availability

## E2E Testing Request

### Related Issue

Issue #76: Hide Open in VS Code button when code is not in PATH and show info message

### Test Scenarios Required

1. **VS Code Available**
   - When daemon reports code command is available in PATH
   - Button should be visible and functional
   - Screenshot: vscode-button-visible-{theme}.png

2. **VS Code Unavailable**
   - When daemon reports code command is NOT in PATH
   - Button should be hidden
   - Info message should explain feature requires VS Code in PATH
   - Screenshot: vscode-button-hidden-info-{theme}.png

3. **Visual Regression Tests**
   - Capture screenshots for both states (light/dark themes)
   - Test across Chromium, Firefox, WebKit

### Implementation Notes

- Add gRPC mock handler for VS Code availability status
- Create visual tests in e2e/tests/visual/vscode-button.visual.spec.ts
- Follow existing patterns in e2e/mocks/handlers/ for mock setup
- Store screenshots in screenshots/visual/

### Acceptance Criteria

- [ ] E2E test covers VS Code available scenario
- [ ] E2E test covers VS Code unavailable scenario
- [ ] Screenshots captured for visual regression
- [ ] Tests pass across all configured browsers
