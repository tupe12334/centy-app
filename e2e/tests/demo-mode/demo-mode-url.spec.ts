import { test, expect } from '@playwright/test'

// Skip these tests on Firefox due to consistent flakiness
// TODO: Investigate Firefox-specific timing issues in demo mode
test.describe('Demo Mode URL Activation', () => {
  test.skip(({ browserName }) => browserName === 'firefox', 'Flaky on Firefox')
  test('should activate demo mode when visiting with ?demo=true', async ({
    page,
  }) => {
    // Navigate to the app with ?demo=true (no pre-set sessionStorage)
    await page.goto('/?demo=true')
    await page.waitForLoadState('networkidle')

    // Wait for demo mode indicator to be visible
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()

    // Verify the URL shows demo-org in path (app now uses path-based routing)
    await expect(page).toHaveURL(/demo-org/)

    // Verify demo org is selected
    await expect(
      page.getByText('Demo Organization', { exact: false }).first()
    ).toBeVisible()
  })

  test('should show demo issues after URL activation', async ({ page }) => {
    // Navigate directly with demo mode and project path
    await page.goto('/demo-org/centy-showcase/issues/?demo=true')
    await page.waitForLoadState('domcontentloaded')

    // Wait for demo mode to be active
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()

    // Verify demo issues are displayed
    await expect(
      page.getByText('Implement dark mode toggle', { exact: false })
    ).toBeVisible()
  })

  test('should persist demo mode after navigation', async ({ page }) => {
    // Activate demo mode via URL and navigate to issues
    await page.goto('/demo-org/centy-showcase/issues/?demo=true')
    await page.waitForLoadState('domcontentloaded')

    // Wait for demo mode to be active
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()

    // Wait for issues to load
    await expect(
      page.getByText('Implement dark mode toggle', { exact: false })
    ).toBeVisible()

    // Navigate to Docs using in-app navigation
    await page.click('a[href*="/docs"]')
    await page.waitForLoadState('domcontentloaded')

    // Demo mode indicator should still be visible
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()

    // Navigate back to home by clicking the Centy logo
    await page.click('a[href="/"]')
    await page.waitForLoadState('domcontentloaded')

    // Demo mode should still be active
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()
  })
})
