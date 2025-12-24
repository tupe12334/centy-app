import { test, expect } from '@playwright/test'
import { setupDemoMode, navigateToDemoProject } from '../../utils/test-helpers'

test.describe('Issues Visual Tests @visual', () => {
  test('issues list - with demo data', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Wait for content to stabilize
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('issues-list-with-data.png', {
      fullPage: true,
    })
  })

  test('issues list - with different statuses', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Wait for content to stabilize
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('issues-list-with-statuses.png', {
      fullPage: true,
    })
  })
})

test.describe('Issue Detail Visual Tests @visual', () => {
  test('issue detail page', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues/demo-issue-1')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Wait for content to stabilize
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('issue-detail.png', {
      fullPage: true,
    })
  })
})
