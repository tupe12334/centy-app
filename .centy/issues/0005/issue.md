# Visual tests fail locally but pass in CI

## Problem

Visual/screenshot tests pass in CI (ubuntu-latest) but fail locally on macOS with 1px dimension differences. This causes the pre-push hook to fail with false positives.

## Root Cause

- Font rendering differs between Linux (CI) and macOS (local development)
- Screenshots generated on Linux don't match when compared on macOS
- Sub-pixel rendering and font hinting vary by OS

## Impact

- Developers must use `--no-verify` to push, bypassing important checks
- Visual regressions could slip through unnoticed
- Inconsistent developer experience

## Proposed Solutions

1. **Use Docker for local visual tests** - Run Playwright in a Linux container locally
2. **Generate platform-specific snapshots** - Maintain separate baselines per OS
3. **Use consistent fonts** - See related issue about strict fonts
4. **Increase pixel tolerance** - Allow small threshold for platform differences

## Acceptance Criteria

- [ ] Visual tests pass locally on macOS
- [ ] Visual tests pass in CI on Linux
- [ ] Pre-push hook works without `--no-verify`
- [ ] No false positives from environment differences
