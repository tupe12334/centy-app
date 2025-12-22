# Add e2e tests to CI pipeline

The client (centy-app) has comprehensive Playwright e2e tests set up in the e2e/ directory, but they are not currently run as part of the CI pipeline.

## Current State

- 10 e2e test spec files exist covering navigation, issues, documentation, demo mode, and visual regression
- Playwright is configured with multi-browser support (Chromium, Firefox, WebKit) and mobile device testing
- CI-aware settings already exist in playwright.config.ts (retries: 2, workers: 1)
- Scripts available: pnpm e2e, pnpm e2e:ui, etc.

## Proposed Change

Add an e2e test job to .github/workflows/ci.yml that:

1. Installs Playwright browsers
2. Runs the e2e test suite
3. Uploads test artifacts (screenshots, traces) on failure

## Considerations

- May need to start the dev server or use a built version for testing
- Consider running e2e tests in parallel with unit tests to reduce CI time
- Visual regression tests may need baseline snapshots committed
