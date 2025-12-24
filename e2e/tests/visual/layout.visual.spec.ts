import { test, expect } from '@playwright/test'
import {
  setupDemoMode,
  navigateTo,
  navigateToDemoProject,
} from '../../utils/test-helpers'

test.describe('Layout Visual Tests @visual', () => {
  test('homepage - light theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await setupDemoMode(page)
    await navigateTo(page, '/')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('homepage-light.png', {
      fullPage: true,
    })
  })

  test('homepage - dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await setupDemoMode(page)
    await navigateTo(page, '/')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
    })
  })

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

test.describe('Responsive Layout Visual Tests @visual', () => {
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

test.describe('Docs Visual Tests @visual', () => {
  test('docs page - with demo content', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/docs')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('docs-list.png', {
      fullPage: true,
    })
  })
})
