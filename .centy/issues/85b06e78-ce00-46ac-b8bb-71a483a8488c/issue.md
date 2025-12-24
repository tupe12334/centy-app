# Deploy workflow runs independently of CI - tests can fail while deploy succeeds

## Problem

The deploy workflow (deploy.yml) triggers on push to main independently of the CI workflow (ci.yml). Both workflows run in parallel, meaning:

- Deployment can succeed even when tests are failing
- No gate between passing tests and production deployment

## Current Behavior

Both ci.yml and deploy.yml trigger simultaneously on push to main with no dependency between them.

## Expected Behavior

Deploy should only proceed after CI passes successfully.

## Suggested Solutions

1. Use workflow_run to trigger deploy after CI completes
2. Add tests to deploy workflow before the deploy step
3. Use branch protection rules to require CI checks before merging to main
