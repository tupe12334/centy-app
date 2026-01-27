import { test, expect } from '@playwright/test'
import {
  setupDemoMode,
  navigateToDemoProject,
} from '../../../../../../utils/test-helpers'

test.describe('Status Filter Visual Tests @visual', () => {
  test('status filter dropdown - all states visible', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Find and click the status filter dropdown trigger
    const statusFilter = page
      .locator('.column-filter-multi .multi-select-trigger')
      .first()
    await expect(statusFilter).toBeVisible({ timeout: 10000 })
    await statusFilter.click()

    // Wait for dropdown to open and stabilize
    await page.waitForTimeout(500)

    // Verify all states are visible before taking screenshot
    const dropdown = page.locator('.multi-select-dropdown')
    await expect(dropdown).toBeVisible({ timeout: 5000 })
    await expect(
      dropdown.locator('label').filter({ hasText: 'Open' })
    ).toBeVisible()
    await expect(
      dropdown.locator('label').filter({ hasText: 'In Progress' })
    ).toBeVisible()
    await expect(
      dropdown.locator('label').filter({ hasText: 'For Validation' })
    ).toBeVisible()
    await expect(
      dropdown.locator('label').filter({ hasText: 'Closed' })
    ).toBeVisible()

    await expect(page).toHaveScreenshot('status-filter-dropdown-open.png', {
      fullPage: true,
    })
  })

  test('status filter - for-validation state selected', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Find and click the status filter dropdown trigger
    const statusFilter = page
      .locator('.column-filter-multi .multi-select-trigger')
      .first()
    await expect(statusFilter).toBeVisible({ timeout: 10000 })
    await statusFilter.click()

    // Wait for dropdown to open
    const dropdown = page.locator('.multi-select-dropdown')
    await expect(dropdown).toBeVisible({ timeout: 5000 })

    // Select "For Validation" option
    await dropdown
      .locator('label')
      .filter({ hasText: 'For Validation' })
      .click()

    // Close dropdown
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Verify filtered results show the for-validation issue
    await expect(page.getByText('Add keyboard shortcuts')).toBeVisible({
      timeout: 10000,
    })

    await expect(page).toHaveScreenshot(
      'status-filter-for-validation-selected.png',
      {
        fullPage: true,
      }
    )
  })

  test('issues list - for-validation status badge styling', async ({
    page,
  }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Wait for content to stabilize
    await page.waitForTimeout(500)

    // Verify for-validation badge is visible
    const forValidationBadge = page
      .locator('.status-badge')
      .filter({ hasText: 'for-validation' })
    await expect(forValidationBadge).toBeVisible({ timeout: 10000 })

    // Take screenshot of the full issues list showing the for-validation status
    await expect(page).toHaveScreenshot('issues-list-with-for-validation.png', {
      fullPage: true,
    })
  })
})

test.describe('Status Filter Responsive Visual Tests @visual', () => {
  test('status filter dropdown - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Find and click the status filter dropdown trigger
    const statusFilter = page
      .locator('.column-filter-multi .multi-select-trigger')
      .first()
    await expect(statusFilter).toBeVisible({ timeout: 10000 })
    await statusFilter.click()

    // Wait for dropdown to open
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('status-filter-dropdown-mobile.png', {
      fullPage: true,
    })
  })
})
