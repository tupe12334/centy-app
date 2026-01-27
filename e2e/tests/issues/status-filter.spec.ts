import { test, expect } from '@playwright/test'
import { setupDemoMode, navigateToDemoProject } from '../../utils/test-helpers'

test.describe('Status Filter', () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for demo mode and issues to load
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })
  })

  test('should display all allowed states in the status filter dropdown', async ({
    page,
  }) => {
    // Find and click the status filter dropdown trigger
    const statusFilter = page
      .locator('.column-filter-multi .multi-select-trigger')
      .first()
    await expect(statusFilter).toBeVisible({ timeout: 10000 })
    await statusFilter.click()

    // Wait for dropdown to open
    await page.waitForTimeout(200)

    // Verify all states from demo config are present in the dropdown
    // Demo config has: ['open', 'in-progress', 'for-validation', 'closed']
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

    // Take screenshot of the dropdown with all states visible
    await expect(page).toHaveScreenshot('status-filter-dropdown-all-states.png')
  })

  test('should filter issues by for-validation state', async ({ page }) => {
    // Find and click the status filter dropdown trigger
    const statusFilter = page
      .locator('.column-filter-multi .multi-select-trigger')
      .first()
    await expect(statusFilter).toBeVisible({ timeout: 10000 })
    await statusFilter.click()

    // Wait for dropdown to open
    const dropdown = page.locator('.multi-select-dropdown')
    await expect(dropdown).toBeVisible({ timeout: 5000 })

    // Select "For Validation" option by clicking the label
    await dropdown
      .locator('label')
      .filter({ hasText: 'For Validation' })
      .click()

    // Close dropdown by pressing Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    // Verify the filter is applied - should show the demo issue with for-validation status
    // Demo issue #6 has "for-validation" status
    await expect(page.getByText('Add keyboard shortcuts')).toBeVisible({
      timeout: 10000,
    })

    // Take screenshot of filtered results
    await expect(page).toHaveScreenshot(
      'status-filter-for-validation-results.png',
      {
        fullPage: true,
      }
    )
  })

  test('should show for-validation status badge with correct styling', async ({
    page,
  }) => {
    // First filter to show only for-validation issues
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
    await page.waitForTimeout(300)

    // Now find the for-validation status badge in the filtered list
    const forValidationBadge = page
      .locator('.status-badge')
      .filter({ hasText: 'for-validation' })
    await expect(forValidationBadge).toBeVisible({ timeout: 10000 })

    // Take screenshot of the status badge
    await forValidationBadge.scrollIntoViewIfNeeded()
    await expect(forValidationBadge).toHaveScreenshot(
      'for-validation-status-badge.png'
    )
  })

  test('should display correct count of states in filter', async ({ page }) => {
    // Find and click the status filter dropdown trigger
    const statusFilter = page
      .locator('.column-filter-multi .multi-select-trigger')
      .first()
    await expect(statusFilter).toBeVisible({ timeout: 10000 })
    await statusFilter.click()

    // Wait for dropdown to open
    const dropdown = page.locator('.multi-select-dropdown')
    await expect(dropdown).toBeVisible({ timeout: 5000 })

    // Count the number of options (excluding the "All" option)
    const options = dropdown.locator('.multi-select-option:not(.select-all)')
    const optionCount = await options.count()

    // Should have 4 states: open, in-progress, for-validation, closed
    expect(optionCount).toBe(4)
  })
})
