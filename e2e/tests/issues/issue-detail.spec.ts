import { test, expect } from '@playwright/test'
import { setupDemoMode, navigateToDemoProject } from '../../utils/test-helpers'

// Demo issue from lib/grpc/demo-data.ts
const DEMO_ISSUE = {
  id: 'demo-issue-1',
  displayNumber: 1,
  title: 'Implement dark mode toggle',
  status: 'open',
  priority: 'high',
}

test.describe('Issue Detail', () => {
  test('should display issue title', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, `/issues/${DEMO_ISSUE.id}`)

    await expect(page.getByText(DEMO_ISSUE.title)).toBeVisible({
      timeout: 10000,
    })
  })

  test('should display issue description', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, `/issues/${DEMO_ISSUE.id}`)

    // Demo issue has markdown content about dark mode
    await expect(page.getByText(/add a dark mode toggle/i)).toBeVisible({
      timeout: 10000,
    })
  })

  test('should display issue metadata', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, `/issues/${DEMO_ISSUE.id}`)

    // Should display status badge
    await expect(page.locator('.status-badge')).toBeVisible({ timeout: 10000 })

    // Should display issue number
    await expect(page.getByRole('button', { name: /#1/ })).toBeVisible({
      timeout: 10000,
    })
  })

  test('should display back navigation', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, `/issues/${DEMO_ISSUE.id}`)

    // Should have a back button or breadcrumb/link to issues
    const backNav = page
      .getByRole('link', { name: /back|issues/i })
      .or(page.getByRole('button', { name: /back/i }))
      .or(page.locator('a[href*="/issues"]'))
    await expect(backNav.first()).toBeVisible({ timeout: 10000 })
  })
})
