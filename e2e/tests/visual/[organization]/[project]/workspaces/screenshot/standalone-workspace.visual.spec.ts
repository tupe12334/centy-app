import { test, expect } from '@playwright/test'
import {
  setupDemoMode,
  navigateToDemoProject,
} from '../../../../../../utils/test-helpers'

test.describe('Standalone Workspace Modal Visual Tests @visual', () => {
  test('issues list with New Workspace button', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Wait for content to stabilize
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot(
      'issues-list-with-workspace-button.png',
      {
        fullPage: true,
      }
    )
  })

  test('standalone workspace modal - open state', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for page to load
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Open the modal
    await page.getByRole('button', { name: '+ New Workspace' }).click()

    // Wait for modal animation
    await page.waitForTimeout(300)

    await expect(page).toHaveScreenshot('standalone-workspace-modal.png', {
      fullPage: true,
    })
  })

  test('standalone workspace modal - with filled form', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for page to load
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Open the modal
    await page.getByRole('button', { name: '+ New Workspace' }).click()

    // Fill in the form
    await page.getByLabel('Name (optional)').fill('My Experimental Workspace')
    await page
      .getByLabel('Description (optional)')
      .fill(
        'Exploring new API integration patterns and testing edge cases for authentication flow'
      )

    // Select 24 hours TTL
    await page.getByLabel('Workspace Duration').selectOption('24')

    // Wait for content to stabilize
    await page.waitForTimeout(300)

    await expect(page).toHaveScreenshot(
      'standalone-workspace-modal-filled.png',
      {
        fullPage: true,
      }
    )
  })
})

test.describe('Standalone Workspace Modal Dark Theme Visual Tests @visual', () => {
  test('standalone workspace modal - dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for page to load
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Open the modal
    await page.getByRole('button', { name: '+ New Workspace' }).click()

    // Wait for modal animation
    await page.waitForTimeout(300)

    await expect(page).toHaveScreenshot('standalone-workspace-modal-dark.png', {
      fullPage: true,
    })
  })
})

test.describe('Standalone Workspace Modal Responsive Visual Tests @visual', () => {
  test('standalone workspace modal - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for page to load
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Open the modal
    await page.getByRole('button', { name: '+ New Workspace' }).click()

    // Wait for modal animation
    await page.waitForTimeout(300)

    await expect(page).toHaveScreenshot(
      'standalone-workspace-modal-mobile.png',
      {
        fullPage: true,
      }
    )
  })

  test('standalone workspace modal - tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for page to load
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Open the modal
    await page.getByRole('button', { name: '+ New Workspace' }).click()

    // Wait for modal animation
    await page.waitForTimeout(300)

    await expect(page).toHaveScreenshot(
      'standalone-workspace-modal-tablet.png',
      {
        fullPage: true,
      }
    )
  })
})
