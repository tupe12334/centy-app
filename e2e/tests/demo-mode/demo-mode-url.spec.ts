import { test, expect } from '@playwright/test'

test.describe('Demo Mode URL Activation', () => {
  test('should activate demo mode when visiting with ?demo=true', async ({
    page,
  }) => {
    // Navigate to the app with ?demo=true (no pre-set sessionStorage)
    await page.goto('/?demo=true')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Verify demo mode indicator is visible
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()

    // Verify the URL was cleaned up to show org and project
    await expect(page).toHaveURL(/org=demo-org/)
    await expect(page).toHaveURL(/project=/)

    // Verify demo org is selected
    await expect(page.locator('text=Demo Organization')).toBeVisible()
  })

  test('should show demo issues after URL activation', async ({ page }) => {
    // Navigate with ?demo=true
    await page.goto('/?demo=true')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Navigate to issues page
    await page.click('a[href*="/issues"]')
    await page.waitForLoadState('networkidle')

    // Verify demo issues are displayed
    await expect(page.locator('text=Implement dark mode toggle')).toBeVisible()
  })

  test('should persist demo mode after navigation', async ({ page }) => {
    // Activate demo mode via URL
    await page.goto('/?demo=true')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Navigate to another page
    await page.click('a[href*="/issues"]')
    await page.waitForLoadState('networkidle')

    // Demo mode indicator should still be visible
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()

    // Navigate back to home
    await page.click('a[href="/"]')
    await page.waitForLoadState('networkidle')

    // Demo mode should still be active
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()
  })
})
