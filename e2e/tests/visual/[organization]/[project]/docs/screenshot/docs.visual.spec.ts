import { test, expect } from '@playwright/test'
import {
  setupDemoMode,
  navigateToDemoProject,
} from '../../../../../../utils/test-helpers'

test.describe('Docs Visual Tests @visual', () => {
  test('docs page - with demo content', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/docs')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('docs-list.png', {
      fullPage: true,
    })
  })
})
