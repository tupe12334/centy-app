import { test, expect } from '@playwright/test'
import { setupDemoMode, navigateTo } from '../../utils/test-helpers'

test.describe('Archived Projects Page', () => {
  test.describe('Empty State', () => {
    test('should display empty state when no archived projects', async ({
      page,
    }) => {
      await setupDemoMode(page)
      await navigateTo(page, '/archived')

      // Wait for loading to complete
      await expect(page.locator('.archived-projects')).toBeVisible()

      // Should show empty state message
      await expect(page.getByText('No archived projects')).toBeVisible()
      await expect(
        page.getByText('Archive projects from the project selector')
      ).toBeVisible()
    })

    test('should display header with back link', async ({ page }) => {
      await setupDemoMode(page)
      await navigateTo(page, '/archived')

      // Should show header
      await expect(page.getByRole('heading', { level: 2 })).toContainText(
        'Archived Projects'
      )

      // Should have back link
      await expect(page.getByText('Back to Projects')).toBeVisible()
    })

    test('should navigate back to home when clicking back link', async ({
      page,
    }) => {
      await setupDemoMode(page)
      await navigateTo(page, '/archived')

      // Click back link
      await page.getByText('Back to Projects').click()

      // Should navigate to home
      await expect(page).toHaveURL('/')
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

    test('should display archived project', async ({ page }) => {
      await navigateTo(page, '/archived')

      // Wait for loading to complete
      await expect(page.locator('.archived-projects')).toBeVisible()

      // Should show the archived project
      await expect(page.locator('.archived-item')).toBeVisible()

      // Should show project name
      await expect(page.locator('.archived-item-name').first()).toBeVisible()
    })

    test('should display project actions', async ({ page }) => {
      await navigateTo(page, '/archived')

      // Wait for archived item to load
      await expect(page.locator('.archived-item')).toBeVisible()

      // Should show action buttons
      await expect(page.locator('.restore-btn').first()).toBeVisible()
      await expect(page.locator('.restore-select-btn').first()).toBeVisible()
      await expect(page.locator('.remove-btn').first()).toBeVisible()
    })

    test('should show remove all button when projects exist', async ({
      page,
    }) => {
      await navigateTo(page, '/archived')

      // Wait for content to load
      await expect(page.locator('.archived-item')).toBeVisible()

      // Should show remove all button
      await expect(page.locator('.remove-all-btn')).toBeVisible()
    })

    test('should show confirmation when clicking remove', async ({ page }) => {
      await navigateTo(page, '/archived')

      // Wait for archived item to load
      await expect(page.locator('.archived-item')).toBeVisible()

      // Click remove button
      await page.locator('.remove-btn').first().click()

      // Should show confirmation
      await expect(page.getByText('Remove permanently?')).toBeVisible()
      await expect(page.locator('.confirm-yes-btn').first()).toBeVisible()
      await expect(page.locator('.confirm-no-btn').first()).toBeVisible()
    })

    test('should cancel removal when clicking no', async ({ page }) => {
      await navigateTo(page, '/archived')

      // Wait for archived item to load
      await expect(page.locator('.archived-item')).toBeVisible()

      // Click remove button
      await page.locator('.remove-btn').first().click()

      // Click no to cancel
      await page.locator('.confirm-no-btn').first().click()

      // Should show remove button again
      await expect(page.locator('.remove-btn').first()).toBeVisible()
    })

    test('should restore project when clicking restore', async ({ page }) => {
      await navigateTo(page, '/archived')

      // Wait for archived item to load
      await expect(page.locator('.archived-item')).toBeVisible()

      // Click restore button
      await page.locator('.restore-btn').first().click()

      // Project should be removed from archived list (shows empty state)
      await expect(page.getByText('No archived projects')).toBeVisible()
    })
  })

  test.describe('Remove All Confirmation', () => {
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

    test('should show confirmation when clicking remove all', async ({
      page,
    }) => {
      await navigateTo(page, '/archived')

      // Wait for content to load
      await expect(page.locator('.archived-item')).toBeVisible()

      // Click remove all button
      await page.locator('.remove-all-btn').click()

      // Should show confirmation
      await expect(page.getByText('Remove all permanently?')).toBeVisible()
    })

    test('should cancel remove all when clicking no', async ({ page }) => {
      await navigateTo(page, '/archived')

      // Wait for content to load
      await expect(page.locator('.archived-item')).toBeVisible()

      // Click remove all button
      await page.locator('.remove-all-btn').click()

      // Click no to cancel
      await page.locator('.remove-all-confirm .confirm-no-btn').click()

      // Should show remove all button again
      await expect(page.locator('.remove-all-btn')).toBeVisible()
    })
  })
})
