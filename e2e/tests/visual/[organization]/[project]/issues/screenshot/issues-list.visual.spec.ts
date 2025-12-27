import { test, expect } from '@playwright/test'
import {
  setupDemoMode,
  navigateToDemoProject,
} from '../../../../../../utils/test-helpers'

test.describe('Issues List Visual Tests @visual', () => {
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

test.describe('Issues Page Layout Visual Tests @visual', () => {
  test('issues page - dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('issues-dark.png', {
      fullPage: true,
    })
  })
})

test.describe('Issues Page Responsive Visual Tests @visual', () => {
  test('issues page - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('issues-mobile.png', {
      fullPage: true,
    })
  })

  test('issues page - tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('issues-tablet.png', {
      fullPage: true,
    })
  })
})

test.describe('Demo Mode Issues Visual Tests @visual', () => {
  test('demo mode - issues page with demo data', async ({ page }) => {
    // Set up demo mode before navigating
    await page.addInitScript(() => {
      sessionStorage.setItem('centy_demo_mode', 'true')
      localStorage.setItem('centy-selected-org', 'demo-org')
      localStorage.setItem('centy-project-path', '/demo/centy-showcase')
    })

    // Navigate directly to issues page in demo mode
    await page.goto('/issues?org=demo-org&project=%2Fdemo%2Fcenty-showcase')
    await page.waitForLoadState('domcontentloaded')

    // Verify demo mode indicator is visible
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Verify demo issues are displayed
    await expect(page.locator('text=Implement dark mode toggle')).toBeVisible({
      timeout: 10000,
    })

    // Wait for page to stabilize before screenshot
    await page.waitForTimeout(500)

    // Take screenshot
    await expect(page).toHaveScreenshot('demo-mode-issues.png', {
      fullPage: true,
    })
  })
})
