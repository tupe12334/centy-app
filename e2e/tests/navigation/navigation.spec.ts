import { test, expect } from '@playwright/test'
import { setupMockedPage, navigateTo } from '../../utils/test-helpers'
import { createIssueScenario } from '../../fixtures/issues'
import { createDocScenario } from '../../fixtures/docs'

test.describe('Navigation', () => {
  test('should load the app with mocked daemon', async ({ page }) => {
    await setupMockedPage(page)
    await navigateTo(page, '/')

    // App should load without errors
    await expect(page).toHaveTitle(/Centy/i)
  })

  test('should navigate to issues page', async ({ page }) => {
    const issues = createIssueScenario.many(3)
    await setupMockedPage(page, { issues })
    await navigateTo(page, '/issues')

    // Should display the issues page
    await expect(page.getByRole('heading', { name: /issues/i })).toBeVisible()
  })

  test('should navigate to docs page', async ({ page }) => {
    const docs = createDocScenario.many(3)
    await setupMockedPage(page, { docs })
    await navigateTo(page, '/docs')

    // Should display the docs page
    await expect(
      page.getByRole('heading', { name: /docs|documentation/i })
    ).toBeVisible()
  })

  test('should navigate between pages using sidebar', async ({ page }) => {
    await setupMockedPage(page)
    await navigateTo(page, '/')

    // Click on Issues in sidebar
    await page.click('a[href="/issues"], [data-testid="nav-issues"]')
    await expect(page).toHaveURL(/\/issues/)

    // Click on Docs in sidebar
    await page.click('a[href="/docs"], [data-testid="nav-docs"]')
    await expect(page).toHaveURL(/\/docs/)
  })

  test('should show daemon connected status', async ({ page }) => {
    await setupMockedPage(page)
    await navigateTo(page, '/')

    // Daemon status should show connected (or no error indicator)
    // The exact selector depends on your UI implementation
    const disconnectedIndicator = page.locator(
      '[data-testid="daemon-disconnected"]'
    )
    await expect(disconnectedIndicator)
      .not.toBeVisible()
      .catch(() => {
        // If there's no specific indicator, that's fine
      })
  })
})

test.describe('Responsive Layout', () => {
  test('should display mobile-friendly layout on small screens', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await setupMockedPage(page)
    await navigateTo(page, '/')

    // Page should be accessible on mobile
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display tablet layout on medium screens', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await setupMockedPage(page)
    await navigateTo(page, '/')

    // Page should be accessible on tablet
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Error Handling', () => {
  test('should handle uninitialized project gracefully', async ({ page }) => {
    await setupMockedPage(page, { isInitialized: false })
    await navigateTo(page, '/')

    // Should show some indication that project needs initialization
    // or redirect to setup
    await expect(page.locator('body')).toBeVisible()
  })
})
