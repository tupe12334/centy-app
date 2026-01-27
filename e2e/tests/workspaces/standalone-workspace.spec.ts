import { test, expect } from '@playwright/test'
import { setupDemoMode, navigateToDemoProject } from '../../utils/test-helpers'

test.describe('Standalone Workspace Modal', () => {
  test('should display New Workspace button on issues list page', async ({
    page,
  }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for page to load
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()

    // Check for New Workspace button
    const workspaceBtn = page.getByRole('button', { name: '+ New Workspace' })
    await expect(workspaceBtn).toBeVisible()
  })

  test('should open standalone workspace modal when clicking New Workspace button', async ({
    page,
  }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for page to load
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()

    // Click New Workspace button
    await page.getByRole('button', { name: '+ New Workspace' }).click()

    // Modal should be visible
    await expect(page.getByText('New Standalone Workspace')).toBeVisible()
    await expect(
      page.getByText('Create a temporary workspace without associating it')
    ).toBeVisible()
  })

  test('should display all form fields in the modal', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for page to load and click New Workspace
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()
    await page.getByRole('button', { name: '+ New Workspace' }).click()

    // Check for all form fields
    await expect(page.getByLabel('Name (optional)')).toBeVisible()
    await expect(page.getByLabel('Description (optional)')).toBeVisible()
    await expect(page.getByLabel('Workspace Duration')).toBeVisible()

    // Check for editor options
    await expect(page.getByText('VS Code')).toBeVisible()
    await expect(page.getByText('Terminal')).toBeVisible()
  })

  test('should have TTL options', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for page to load and open modal
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()
    await page.getByRole('button', { name: '+ New Workspace' }).click()

    // Check TTL dropdown options
    const ttlSelect = page.getByLabel('Workspace Duration')
    await expect(ttlSelect).toBeVisible()

    // Verify default is 12 hours
    await expect(ttlSelect).toHaveValue('12')

    // Check that options exist
    const options = ttlSelect.locator('option')
    await expect(options).toHaveCount(5)
  })

  test('should close modal on Cancel button click', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for page to load and open modal
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()
    await page.getByRole('button', { name: '+ New Workspace' }).click()

    // Modal should be visible
    await expect(page.getByText('New Standalone Workspace')).toBeVisible()

    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Modal should be hidden
    await expect(page.getByText('New Standalone Workspace')).not.toBeVisible()
  })

  test('should close modal on Escape key press', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for page to load and open modal
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()
    await page.getByRole('button', { name: '+ New Workspace' }).click()

    // Modal should be visible
    await expect(page.getByText('New Standalone Workspace')).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Modal should be hidden
    await expect(page.getByText('New Standalone Workspace')).not.toBeVisible()
  })

  test('should close modal when clicking outside', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for page to load and open modal
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()
    await page.getByRole('button', { name: '+ New Workspace' }).click()

    // Modal should be visible
    await expect(page.getByText('New Standalone Workspace')).toBeVisible()

    // Click on the overlay (outside the modal) - use bottom left to avoid demo-mode-indicator
    const viewport = page.viewportSize() || { height: 600 }
    await page
      .locator('.standalone-modal-overlay')
      .click({ position: { x: 10, y: viewport.height - 50 } })

    // Modal should be hidden
    await expect(page.getByText('New Standalone Workspace')).not.toBeVisible()
  })

  test('should allow entering workspace name and description', async ({
    page,
  }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for page to load and open modal
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()
    await page.getByRole('button', { name: '+ New Workspace' }).click()

    // Fill in the form
    await page.getByLabel('Name (optional)').fill('My Test Workspace')
    await page
      .getByLabel('Description (optional)')
      .fill('Testing the new workspace feature')

    // Verify values are filled
    await expect(page.getByLabel('Name (optional)')).toHaveValue(
      'My Test Workspace'
    )
    await expect(page.getByLabel('Description (optional)')).toHaveValue(
      'Testing the new workspace feature'
    )
  })

  test('should have Create Workspace button', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Wait for page to load and open modal
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()
    await page.getByRole('button', { name: '+ New Workspace' }).click()

    // Check for Create Workspace button
    const createBtn = page.getByRole('button', { name: 'Create Workspace' })
    await expect(createBtn).toBeVisible()
    await expect(createBtn).toBeEnabled()
  })
})
