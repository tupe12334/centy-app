import { test, expect } from '@playwright/test'
import {
  setupDemoMode,
  navigateTo,
  navigateToDemoProject,
} from '../../utils/test-helpers'

test.describe('Navigation', () => {
  test('should load the app in demo mode', async ({ page }) => {
    await setupDemoMode(page)
    await navigateTo(page, '/')

    // App should load without errors
    await expect(page).toHaveTitle(/Centy/i)
  })

  test('should navigate to issues page', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Should display the issues page
    await expect(page.getByRole('heading', { name: /issues/i })).toBeVisible({
      timeout: 10000,
    })
  })

  test('should navigate to docs page', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/docs')

    // Should display the docs page
    await expect(
      page.getByRole('heading', { name: /docs|documentation/i })
    ).toBeVisible({ timeout: 10000 })
  })

  test('should navigate between pages using navigation', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/')

    // Click on Issues in navigation
    await page.click('a[href*="/issues"]')
    await expect(page).toHaveURL(/\/issues/)

    // Click on Docs in navigation
    await page.click('a[href*="/docs"]')
    await expect(page).toHaveURL(/\/docs/)
  })

  test('should show demo mode indicator', async ({ page }) => {
    await setupDemoMode(page)
    await navigateTo(page, '/')

    // Demo mode indicator should be visible
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })
  })
})

test.describe('Responsive Layout', () => {
  test('should display mobile-friendly layout on small screens', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await setupDemoMode(page)
    await navigateTo(page, '/')

    // Page should be accessible on mobile
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display tablet layout on medium screens', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await setupDemoMode(page)
    await navigateTo(page, '/')

    // Page should be accessible on tablet
    await expect(page.locator('body')).toBeVisible()
  })
})
