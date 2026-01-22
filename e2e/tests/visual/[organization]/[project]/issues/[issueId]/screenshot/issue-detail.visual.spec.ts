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

test.describe('Editor Selector Visual Tests @visual', () => {
  test.describe('Default State (VS Code Selected)', () => {
    test('editor selector - light theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await setupDemoMode(page)
      await navigateToDemoProject(page, '/issues/demo-issue-1')

      // Verify editor selector is visible
      await expect(page.locator('.editor-selector')).toBeVisible({
        timeout: 10000,
      })
      // Verify primary button shows VS Code
      await expect(page.locator('.editor-primary-btn.vscode')).toBeVisible()
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('editor-selector-vscode-light.png', {
        fullPage: true,
      })
    })

    test('editor selector - dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await setupDemoMode(page)
      await navigateToDemoProject(page, '/issues/demo-issue-1')

      await expect(page.locator('.editor-selector')).toBeVisible({
        timeout: 10000,
      })
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('editor-selector-vscode-dark.png', {
        fullPage: true,
      })
    })
  })

  test.describe('Dropdown Open State', () => {
    test('dropdown menu visible - light theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await setupDemoMode(page)
      await navigateToDemoProject(page, '/issues/demo-issue-1')

      // Wait for editor selector to be visible
      await expect(page.locator('.editor-selector')).toBeVisible({
        timeout: 10000,
      })

      // Click the dropdown button to open the menu
      await page.locator('.editor-dropdown-btn').click()

      // Wait for dropdown to be visible
      await expect(page.locator('.editor-dropdown')).toBeVisible()
      await page.waitForTimeout(300)

      await expect(page).toHaveScreenshot(
        'editor-selector-dropdown-open-light.png',
        {
          fullPage: true,
        }
      )
    })

    test('dropdown menu visible - dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await setupDemoMode(page)
      await navigateToDemoProject(page, '/issues/demo-issue-1')

      await expect(page.locator('.editor-selector')).toBeVisible({
        timeout: 10000,
      })

      // Click the dropdown button to open the menu
      await page.locator('.editor-dropdown-btn').click()

      // Wait for dropdown to be visible
      await expect(page.locator('.editor-dropdown')).toBeVisible()
      await page.waitForTimeout(300)

      await expect(page).toHaveScreenshot(
        'editor-selector-dropdown-open-dark.png',
        {
          fullPage: true,
        }
      )
    })
  })

  test.describe('Terminal Selected State', () => {
    test('terminal selected - light theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })

      // Set Terminal as the preferred editor before navigating
      await page.addInitScript(() => {
        localStorage.setItem('centy-preferred-editor', '2') // EditorType.TERMINAL = 2
      })

      await setupDemoMode(page)
      await navigateToDemoProject(page, '/issues/demo-issue-1')

      // Wait for editor selector with terminal theme
      await expect(page.locator('.editor-selector')).toBeVisible({
        timeout: 10000,
      })
      // Verify primary button shows Terminal styling
      await expect(page.locator('.editor-primary-btn.terminal')).toBeVisible()
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot(
        'editor-selector-terminal-light.png',
        {
          fullPage: true,
        }
      )
    })

    test('terminal selected - dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })

      // Set Terminal as the preferred editor before navigating
      await page.addInitScript(() => {
        localStorage.setItem('centy-preferred-editor', '2') // EditorType.TERMINAL = 2
      })

      await setupDemoMode(page)
      await navigateToDemoProject(page, '/issues/demo-issue-1')

      await expect(page.locator('.editor-selector')).toBeVisible({
        timeout: 10000,
      })
      await expect(page.locator('.editor-primary-btn.terminal')).toBeVisible()
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('editor-selector-terminal-dark.png', {
        fullPage: true,
      })
    })
  })

  test.describe('Editor Selection Workflow', () => {
    test('selecting Terminal from dropdown', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await setupDemoMode(page)
      await navigateToDemoProject(page, '/issues/demo-issue-1')

      // Wait for editor selector
      await expect(page.locator('.editor-selector')).toBeVisible({
        timeout: 10000,
      })

      // Initially VS Code should be selected
      await expect(page.locator('.editor-primary-btn.vscode')).toBeVisible()

      // Open dropdown
      await page.locator('.editor-dropdown-btn').click()
      await expect(page.locator('.editor-dropdown')).toBeVisible()

      // Click on Terminal option
      await page
        .locator('.editor-option')
        .filter({ hasText: 'Terminal' })
        .click()

      // Dropdown should close and Terminal should be selected
      await expect(page.locator('.editor-dropdown')).not.toBeVisible()
      // Note: The button will still show vscode until the next page load
      // because the selection triggers an action, not just a preference change

      await page.waitForTimeout(500)
      await expect(page).toHaveScreenshot(
        'editor-selector-after-terminal-select.png',
        {
          fullPage: true,
        }
      )
    })
  })
})
