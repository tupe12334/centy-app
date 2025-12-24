# Implement Docker-based visual testing for CI consistency

## Problem

Visual regression tests fail in CI because screenshots are generated on macOS locally but CI runs on Ubuntu Linux. Font rendering differs between operating systems, causing consistent pixel mismatches (5000+ pixels different).

Current workaround: Visual tests are skipped in CI (`testIgnore: '**/*.visual.spec.ts'`), which means visual regressions are not caught automatically.

## Proposed Solution: Hybrid Docker Approach

Implement a Docker-based workflow that:

1. **Regular CI**: Skip visual tests for fast feedback (current behavior)
2. **Visual Updates**: Use Docker locally to generate screenshots that match CI environment
3. **Visual Validation**: Optionally run visual tests in CI when explicitly triggered

This gives us:

- Fast regular CI (no visual test overhead)
- Reliable visual testing when needed
- Single source of truth for snapshots
- No platform-specific snapshot duplication

## Implementation Tasks

### 1. Create Docker Configuration

Create `e2e/docker-compose.yml`:

```yaml
version: '3.8'
services:
  playwright:
    image: mcr.microsoft.com/playwright:v1.48.0-jammy
    working_dir: /app
    volumes:
      - ..:/app
      - /app/node_modules
    environment:
      - CI=true
    network_mode: host
```

### 2. Add Package Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "e2e:visual": "playwright test --grep @visual --project=chromium",
    "e2e:visual:docker": "docker compose -f e2e/docker-compose.yml run --rm playwright pnpm e2e:visual",
    "e2e:visual:update": "docker compose -f e2e/docker-compose.yml run --rm playwright pnpm e2e:visual -- --update-snapshots"
  }
}
```

### 3. Update Playwright Config

Modify `playwright.config.ts` to support visual tests in CI when triggered:

```typescript
const runVisualTests = process.env.RUN_VISUAL_TESTS === 'true'

projects: process.env.CI
  ? [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
        testIgnore: runVisualTests ? undefined : '**/*.visual.spec.ts',
      },
    ]
  : [
      /* local config */
    ]
```

### 4. Add CI Workflow for Visual Tests

Create `.github/workflows/visual-tests.yml`:

```yaml
name: Visual Tests

on:
  workflow_dispatch: # Manual trigger
  pull_request:
    paths:
      - 'screenshots/**'
      - 'e2e/tests/visual/**'

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install chromium --with-deps
      - run: pnpm e2e:visual
        env:
          RUN_VISUAL_TESTS: 'true'
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: visual-diffs
          path: test-results/
```

### 5. Regenerate All Snapshots with Docker

Once Docker setup is complete:

```bash
# Remove old macOS-generated snapshots
rm -rf screenshots/

# Generate new snapshots using Docker (matches CI)
pnpm e2e:visual:update

# Commit new snapshots
git add screenshots/
git commit -m "chore: regenerate visual snapshots using Docker"
```

### 6. Update Documentation

Add to README or CONTRIBUTING.md:

```markdown
## Visual Testing

Visual tests ensure UI consistency. They run in a Docker container to match CI.

### Running Visual Tests

\`\`\`bash

# Run visual tests (requires Docker)

pnpm e2e:visual:docker

# Update snapshots after intentional UI changes

pnpm e2e:visual:update
\`\`\`

### When Visual Tests Fail

1. Review the diff in \`test-results/\`
2. If changes are intentional, run \`pnpm e2e:visual:update\`
3. Commit updated snapshots
```

## Acceptance Criteria

- [ ] Docker compose configuration works on macOS, Linux, Windows
- [ ] `pnpm e2e:visual:docker` runs visual tests in Docker container
- [ ] `pnpm e2e:visual:update` updates snapshots using Docker
- [ ] All visual test snapshots regenerated with Docker
- [ ] Visual tests pass in CI when `RUN_VISUAL_TESTS=true`
- [ ] Separate GitHub workflow for visual test validation
- [ ] Documentation updated with visual testing instructions

## Notes

- Uses Playwright's official Docker image for consistency
- `network_mode: host` allows container to access the dev server
- CI only runs visual tests when screenshots or visual test files change
- Manual workflow dispatch allows on-demand visual validation
