# Enhance pre-push hook to include all visual tests

## Problem

Currently, the pre-push hook only runs a subset of visual tests (`*.pre-push.visual.spec.ts`), which means most visual regression tests are skipped until CI runs. This creates a gap where visual regressions can be pushed and only caught later in CI.

## Current Behavior

The pre-push hook in `.husky/pre-push` runs:

1. `pnpm e2e` - All functional e2e tests
1. `pnpm e2e:visual:pre-push` - Only `*.pre-push.visual.spec.ts` files (header, homepage)

Visual tests for specific pages (issues, docs, PRs, etc.) are NOT run on pre-push.

## Proposed Enhancement

Make the pre-push testing more comprehensive by:

1. **Option A: Run all visual tests on pre-push**
   - Pros: Catches all visual regressions before push
   - Cons: Slower pre-push (may add 30-60 seconds)

1. **Option B: Smart visual test selection**
   - Only run visual tests for files that changed
   - Use git diff to detect which pages were modified
   - Run corresponding visual tests

1. **Option C: Parallel visual test execution**
   - Run visual tests in parallel with functional tests
   - Use background processes to speed up overall time

## Acceptance Criteria

- [ ] All visual regression tests run before code is pushed
- [ ] Pre-push time remains reasonable (\< 2 minutes total)
- [ ] Clear feedback when visual tests fail
- [ ] Easy to update screenshots when intentional changes are made
- [ ] Works consistently across macOS and Linux

## Related

- Issue #100: Visual tests fail locally but pass in CI (cross-platform consistency)
- Current pre-push only tests: `header.pre-push.visual.spec.ts`, `root-page.pre-push.visual.spec.ts`
