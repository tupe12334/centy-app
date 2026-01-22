import { test, expect } from '@playwright/test'
import { setupDemoMode, navigateTo } from '../../../utils/test-helpers'

test.describe('Archived Page Visual Tests @visual', () => {
  test.describe('Empty State', () => {
    test('archived page empty - light theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await setupDemoMode(page)
      await navigateTo(page, '/archived')

      // Wait for content to load
      await expect(page.locator('.archived-projects')).toBeVisible({
        timeout: 10000,
      })
      await expect(page.getByText('No archived projects')).toBeVisible()
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('archived-empty-light.png', {
        fullPage: true,
      })
    })

    test('archived page empty - dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await setupDemoMode(page)
      await navigateTo(page, '/archived')

      // Wait for content to load
      await expect(page.locator('.archived-projects')).toBeVisible({
        timeout: 10000,
      })
      await expect(page.getByText('No archived projects')).toBeVisible()
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('archived-empty-dark.png', {
        fullPage: true,
      })
    })
  })

  test.describe('With Archived Projects', () => {
    test.beforeEach(async ({ page }) => {
      // Set up demo mode with an archived project
      await page.addInitScript(() => {
        sessionStorage.setItem('centy_demo_mode', 'true')
        localStorage.setItem('centy-selected-org', 'demo-org')
        localStorage.setItem('centy-project-path', '/demo/centy-showcase')
        // Add the demo project to archived list
        localStorage.setItem(
          'centy-archived-projects',
          JSON.stringify(['/demo/centy-showcase'])
        )
      })
    })

    test('archived page with project - light theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await navigateTo(page, '/archived')

      // Wait for archived item to load
      await expect(page.locator('.archived-item')).toBeVisible({
        timeout: 10000,
      })
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('archived-with-project-light.png', {
        fullPage: true,
      })
    })

    test('archived page with project - dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await navigateTo(page, '/archived')

      // Wait for archived item to load
      await expect(page.locator('.archived-item')).toBeVisible({
        timeout: 10000,
      })
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('archived-with-project-dark.png', {
        fullPage: true,
      })
    })
  })

  test.describe('Remove Confirmation State', () => {
    test.beforeEach(async ({ page }) => {
      // Set up demo mode with an archived project
      await page.addInitScript(() => {
        sessionStorage.setItem('centy_demo_mode', 'true')
        localStorage.setItem('centy-selected-org', 'demo-org')
        localStorage.setItem('centy-project-path', '/demo/centy-showcase')
        // Add the demo project to archived list
        localStorage.setItem(
          'centy-archived-projects',
          JSON.stringify(['/demo/centy-showcase'])
        )
      })
    })

    test('archived page remove confirmation - light theme', async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await navigateTo(page, '/archived')

      // Wait for archived item to load
      await expect(page.locator('.archived-item')).toBeVisible({
        timeout: 10000,
      })

      // Click remove to show confirmation
      await page.locator('.remove-btn').first().click()
      await expect(page.getByText('Remove permanently?')).toBeVisible()
      await page.waitForTimeout(300)

      await expect(page).toHaveScreenshot(
        'archived-remove-confirmation-light.png',
        {
          fullPage: true,
        }
      )
    })

    test('archived page remove confirmation - dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await navigateTo(page, '/archived')

      // Wait for archived item to load
      await expect(page.locator('.archived-item')).toBeVisible({
        timeout: 10000,
      })

      // Click remove to show confirmation
      await page.locator('.remove-btn').first().click()
      await expect(page.getByText('Remove permanently?')).toBeVisible()
      await page.waitForTimeout(300)

      await expect(page).toHaveScreenshot(
        'archived-remove-confirmation-dark.png',
        {
          fullPage: true,
        }
      )
    })
  })

  test.describe('Remove All Confirmation State', () => {
    test.beforeEach(async ({ page }) => {
      // Set up demo mode with an archived project
      await page.addInitScript(() => {
        sessionStorage.setItem('centy_demo_mode', 'true')
        localStorage.setItem('centy-selected-org', 'demo-org')
        localStorage.setItem('centy-project-path', '/demo/centy-showcase')
        // Add the demo project to archived list
        localStorage.setItem(
          'centy-archived-projects',
          JSON.stringify(['/demo/centy-showcase'])
        )
      })
    })

    test('archived page remove all confirmation - light theme', async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await navigateTo(page, '/archived')

      // Wait for content to load
      await expect(page.locator('.archived-item')).toBeVisible({
        timeout: 10000,
      })

      // Click remove all to show confirmation
      await page.locator('.remove-all-btn').click()
      await expect(page.getByText('Remove all permanently?')).toBeVisible()
      await page.waitForTimeout(300)

      await expect(page).toHaveScreenshot(
        'archived-remove-all-confirmation-light.png',
        {
          fullPage: true,
        }
      )
    })

    test('archived page remove all confirmation - dark theme', async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await navigateTo(page, '/archived')

      // Wait for content to load
      await expect(page.locator('.archived-item')).toBeVisible({
        timeout: 10000,
      })

      // Click remove all to show confirmation
      await page.locator('.remove-all-btn').click()
      await expect(page.getByText('Remove all permanently?')).toBeVisible()
      await page.waitForTimeout(300)

      await expect(page).toHaveScreenshot(
        'archived-remove-all-confirmation-dark.png',
        {
          fullPage: true,
        }
      )
    })
  })

  test.describe('Responsive - Mobile Viewport', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
    })

    test('archived page empty - mobile light', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await setupDemoMode(page)
      await navigateTo(page, '/archived')

      // Wait for content to load
      await expect(page.locator('.archived-projects')).toBeVisible({
        timeout: 10000,
      })
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('archived-empty-mobile-light.png', {
        fullPage: true,
      })
    })

    test('archived page with project - mobile light', async ({ page }) => {
      await page.addInitScript(() => {
        sessionStorage.setItem('centy_demo_mode', 'true')
        localStorage.setItem('centy-selected-org', 'demo-org')
        localStorage.setItem('centy-project-path', '/demo/centy-showcase')
        localStorage.setItem(
          'centy-archived-projects',
          JSON.stringify(['/demo/centy-showcase'])
        )
      })

      await page.emulateMedia({ colorScheme: 'light' })
      await navigateTo(page, '/archived')

      // Wait for archived item to load
      await expect(page.locator('.archived-item')).toBeVisible({
        timeout: 10000,
      })
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot(
        'archived-with-project-mobile-light.png',
        {
          fullPage: true,
        }
      )
    })
  })

  test.describe('Responsive - Tablet Viewport', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
    })

    test('archived page with project - tablet light', async ({ page }) => {
      await page.addInitScript(() => {
        sessionStorage.setItem('centy_demo_mode', 'true')
        localStorage.setItem('centy-selected-org', 'demo-org')
        localStorage.setItem('centy-project-path', '/demo/centy-showcase')
        localStorage.setItem(
          'centy-archived-projects',
          JSON.stringify(['/demo/centy-showcase'])
        )
      })

      await page.emulateMedia({ colorScheme: 'light' })
      await navigateTo(page, '/archived')

      // Wait for archived item to load
      await expect(page.locator('.archived-item')).toBeVisible({
        timeout: 10000,
      })
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot(
        'archived-with-project-tablet-light.png',
        {
          fullPage: true,
        }
      )
    })
  })
})
