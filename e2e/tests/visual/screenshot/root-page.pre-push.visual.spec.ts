import { test, expect } from '@playwright/test'
import { setupDemoMode, navigateTo } from '../../../utils/test-helpers'
import os from 'os'

/**
 * Pre-push visual smoke test for the root page.
 *
 * This is a minimal, focused test designed to run in the pre-push hook.
 * It validates the core root page layout with mock data to catch
 * visual regressions before code is pushed.
 *
 * Uses platform-specific baselines (darwin/linux/win32) to handle font
 * rendering differences across operating systems.
 *
 * For comprehensive visual testing, see homepage.visual.spec.ts
 */
test.describe('Root Page Pre-push Visual Test @visual', () => {
  // Get platform identifier for platform-specific snapshots
  const platform = os.platform() // 'darwin', 'linux', 'win32'

  test('root page with demo data - light theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await setupDemoMode(page)
    await navigateTo(page, '/')

    // Wait for demo mode indicator to confirm app and mock data loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Wait for content to stabilize (animations, lazy loading)
    await page.waitForTimeout(500)

    // Capture root page screenshot with platform-specific baseline
    // Higher tolerance (5%) to account for minor anti-aliasing differences
    await expect(page).toHaveScreenshot(`root-page-${platform}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
      threshold: 0.3,
    })
  })
})
