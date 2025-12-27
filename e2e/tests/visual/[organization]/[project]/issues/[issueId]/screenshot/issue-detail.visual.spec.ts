import { test, expect } from '@playwright/test'
import {
  setupDemoMode,
  navigateToDemoProject,
} from '../../../../../../../utils/test-helpers'

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

test.describe('VS Code Button Visual Tests @visual', () => {
  test.describe('VS Code Available (Demo Mode)', () => {
    test('button visible - light theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await setupDemoMode(page)
      await navigateToDemoProject(page, '/issues/demo-issue-1')

      // Verify button is visible
      await expect(page.locator('.vscode-btn')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.vscode-unavailable-hint')).not.toBeVisible()
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('vscode-button-visible-light.png', {
        fullPage: true,
      })
    })

    test('button visible - dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await setupDemoMode(page)
      await navigateToDemoProject(page, '/issues/demo-issue-1')

      await expect(page.locator('.vscode-btn')).toBeVisible({ timeout: 10000 })
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('vscode-button-visible-dark.png', {
        fullPage: true,
      })
    })
  })

  test.describe('VS Code Unavailable', () => {
    test('info message shown - light theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })

      // Set the test override BEFORE enabling demo mode
      await page.addInitScript(() => {
        ;(
          window as Window & { __TEST_VSCODE_AVAILABLE__?: boolean }
        ).__TEST_VSCODE_AVAILABLE__ = false
      })

      await setupDemoMode(page)
      await navigateToDemoProject(page, '/issues/demo-issue-1')

      // Verify button is hidden and info message is shown
      await expect(page.locator('.vscode-btn')).not.toBeVisible()
      await expect(page.locator('.vscode-unavailable-hint')).toBeVisible({
        timeout: 10000,
      })
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot(
        'vscode-button-hidden-info-light.png',
        {
          fullPage: true,
        }
      )
    })

    test('info message shown - dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })

      // Set the test override BEFORE enabling demo mode
      await page.addInitScript(() => {
        ;(
          window as Window & { __TEST_VSCODE_AVAILABLE__?: boolean }
        ).__TEST_VSCODE_AVAILABLE__ = false
      })

      await setupDemoMode(page)
      await navigateToDemoProject(page, '/issues/demo-issue-1')

      await expect(page.locator('.vscode-unavailable-hint')).toBeVisible({
        timeout: 10000,
      })
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot(
        'vscode-button-hidden-info-dark.png',
        {
          fullPage: true,
        }
      )
    })
  })
})
