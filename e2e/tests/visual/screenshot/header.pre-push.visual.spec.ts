import { test, expect } from '@playwright/test'
import { setupDemoMode, navigateTo } from '../../../utils/test-helpers'
import os from 'os'

/**
 * Pre-push visual test for the application header.
 *
 * This test validates the header appearance including:
 * - The neural network logo
 * - "Centy" branding text
 * - Header controls (theme toggle, daemon status, etc.)
 * - Navigation bar
 * - Tagline
 *
 * Uses platform-specific baselines (darwin/linux/win32) to handle font
 * rendering differences across operating systems.
 *
 * This test runs as part of the pre-push hook to catch header visual
 * regressions before code is pushed.
 */
test.describe('Header Pre-push Visual Test @visual', () => {
  // Get platform identifier for platform-specific snapshots
  const platform = os.platform() // 'darwin', 'linux', 'win32'

  test.describe('Desktop viewport', () => {
    test('header with logo - light theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await setupDemoMode(page)
      await navigateTo(page, '/')

      // Wait for demo mode indicator to confirm app and mock data loaded
      await expect(page.locator('.demo-mode-indicator')).toBeVisible()

      // Wait for content to stabilize (animations, lazy loading)
      await page.waitForTimeout(500)

      // Verify header elements are present
      const header = page.locator('.app-header')
      await expect(header).toBeVisible()

      // Verify logo is loaded
      const logo = header.locator('.header-logo-icon')
      await expect(logo).toBeVisible()

      // Verify Centy text is present
      await expect(header.locator('h1')).toContainText('Centy')

      // Capture header screenshot with platform-specific baseline
      // Using element screenshot for focused testing and reduced flakiness
      await expect(header).toHaveScreenshot(`header-light-${platform}.png`, {
        maxDiffPixelRatio: 0.05,
        threshold: 0.3,
      })
    })

    test('header with logo - dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await setupDemoMode(page)
      await navigateTo(page, '/')

      // Wait for demo mode indicator to confirm app and mock data loaded
      await expect(page.locator('.demo-mode-indicator')).toBeVisible()

      // Wait for content to stabilize
      await page.waitForTimeout(500)

      const header = page.locator('.app-header')
      await expect(header).toBeVisible()

      // Capture header screenshot with platform-specific baseline
      await expect(header).toHaveScreenshot(`header-dark-${platform}.png`, {
        maxDiffPixelRatio: 0.05,
        threshold: 0.3,
      })
    })
  })

  test.describe('Mobile viewport (375x667)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
    })

    test('header with logo - mobile light theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await setupDemoMode(page)
      await navigateTo(page, '/')

      // Wait for demo mode indicator
      await expect(page.locator('.demo-mode-indicator')).toBeVisible()
      await page.waitForTimeout(500)

      const header = page.locator('.app-header')
      await expect(header).toBeVisible()

      // Verify mobile menu toggle is visible on mobile
      await expect(header.locator('.mobile-menu-toggle')).toBeVisible()

      // Capture mobile header screenshot
      await expect(header).toHaveScreenshot(
        `header-mobile-light-${platform}.png`,
        {
          maxDiffPixelRatio: 0.05,
          threshold: 0.3,
        }
      )
    })

    test('header with logo - mobile dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await setupDemoMode(page)
      await navigateTo(page, '/')

      // Wait for demo mode indicator
      await expect(page.locator('.demo-mode-indicator')).toBeVisible()
      await page.waitForTimeout(500)

      const header = page.locator('.app-header')
      await expect(header).toBeVisible()

      // Capture mobile header screenshot
      await expect(header).toHaveScreenshot(
        `header-mobile-dark-${platform}.png`,
        {
          maxDiffPixelRatio: 0.05,
          threshold: 0.3,
        }
      )
    })
  })

  test.describe('Header logo validation', () => {
    test('logo image loads correctly', async ({ page }) => {
      await setupDemoMode(page)
      await navigateTo(page, '/')

      // Wait for app to load
      await expect(page.locator('.demo-mode-indicator')).toBeVisible()

      const logo = page.locator('.header-logo-icon')
      await expect(logo).toBeVisible()

      // Verify logo src attribute
      await expect(logo).toHaveAttribute('src', '/logo.svg')

      // Verify logo dimensions
      await expect(logo).toHaveAttribute('width', '28')
      await expect(logo).toHaveAttribute('height', '28')

      // Verify logo loaded successfully (no broken image)
      const logoNaturalWidth = await logo.evaluate(
        (img: HTMLImageElement) => img.naturalWidth
      )
      expect(logoNaturalWidth).toBeGreaterThan(0)
    })
  })
})
