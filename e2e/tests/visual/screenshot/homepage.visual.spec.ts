import { test, expect } from '@playwright/test'
import { setupDemoMode, navigateTo } from '../../../utils/test-helpers'

/**
 * Set up demo mode for testing without daemon connection
 */
async function setupDemoModeLocal(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('centy_demo_mode', 'true')
    localStorage.setItem('centy-selected-org', 'demo-org')
    localStorage.setItem('centy-project-path', '/demo/centy-showcase')
  })
}

/**
 * Navigate to a page in demo mode and dismiss mobile overlay if present
 */
async function navigateDemoMode(
  page: import('@playwright/test').Page,
  path: string
) {
  const separator = path.includes('?') ? '&' : '?'
  await page.goto(
    `${path}${separator}org=demo-org&project=%2Fdemo%2Fcenty-showcase`
  )
  await page.waitForLoadState('networkidle')

  // Dismiss mobile not supported overlay if present
  const dismissButton = page.locator('.mobile-dismiss-button')
  if (await dismissButton.isVisible().catch(() => false)) {
    await dismissButton.click()
    await page.waitForTimeout(300)
  }
}

test.describe('Homepage Layout Visual Tests @visual', () => {
  test('homepage - light theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await setupDemoMode(page)
    await navigateTo(page, '/')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('homepage-light.png', {
      fullPage: true,
    })
  })

  test('homepage - dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await setupDemoMode(page)
    await navigateTo(page, '/')

    // Wait for demo mode indicator to confirm data is loaded
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
    })
  })
})

test.describe('Demo Mode Homepage Visual Tests @visual', () => {
  test('demo mode - homepage with demo org and project', async ({ page }) => {
    // Set up demo mode before navigating
    await page.addInitScript(() => {
      sessionStorage.setItem('centy_demo_mode', 'true')
      localStorage.setItem('centy-selected-org', 'demo-org')
      localStorage.setItem('centy-project-path', '/demo/centy-showcase')
    })

    // Navigate to demo mode URL
    await page.goto('/?org=demo-org&project=%2Fdemo%2Fcenty-showcase')
    await page.waitForLoadState('domcontentloaded')

    // Handle mobile not supported overlay if present
    const continueBtn = page.getByRole('button', { name: 'Continue Anyway' })
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click()
    }

    // Verify demo mode indicator is visible
    await expect(page.locator('.demo-mode-indicator')).toBeVisible()

    // Verify demo org is shown (check button text which works on both desktop and mobile)
    await expect(
      page.getByRole('button', { name: /Demo Organization/ })
    ).toBeVisible()

    // Wait for page to stabilize before screenshot
    await page.waitForTimeout(500)

    // Take screenshot of demo mode homepage
    await expect(page).toHaveScreenshot('demo-mode-homepage.png', {
      fullPage: true,
    })
  })
})

test.describe('Mobile Navbar Visual Tests @visual', () => {
  test.describe('Mobile viewport (375x667)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await setupDemoModeLocal(page)
    })

    test('navbar - hamburger menu closed - light theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await navigateDemoMode(page, '/')
      await page.waitForTimeout(500)

      // Verify hamburger button is visible
      await expect(page.locator('.mobile-menu-toggle')).toBeVisible()

      // Verify desktop nav is hidden
      await expect(page.locator('.app-nav')).not.toBeVisible()

      await expect(page).toHaveScreenshot('mobile-navbar-closed-light.png', {
        fullPage: true,
      })
    })

    test('navbar - hamburger menu closed - dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await navigateDemoMode(page, '/')
      await page.waitForTimeout(500)

      await expect(page.locator('.mobile-menu-toggle')).toBeVisible()

      await expect(page).toHaveScreenshot('mobile-navbar-closed-dark.png', {
        fullPage: true,
      })
    })

    test('navbar - hamburger menu open - light theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await navigateDemoMode(page, '/')
      await page.waitForTimeout(500)

      // Click hamburger to open menu
      await page.locator('.mobile-menu-toggle').click()
      await page.waitForTimeout(400) // Wait for animation

      // Verify mobile menu is open
      await expect(page.locator('.mobile-menu.open')).toBeVisible()
      await expect(page.locator('.mobile-menu-nav')).toBeVisible()

      await expect(page).toHaveScreenshot('mobile-navbar-open-light.png', {
        fullPage: true,
      })
    })

    test('navbar - hamburger menu open - dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await navigateDemoMode(page, '/')
      await page.waitForTimeout(500)

      // Click hamburger to open menu
      await page.locator('.mobile-menu-toggle').click()
      await page.waitForTimeout(400)

      await expect(page.locator('.mobile-menu.open')).toBeVisible()

      await expect(page).toHaveScreenshot('mobile-navbar-open-dark.png', {
        fullPage: true,
      })
    })
  })

  test.describe('Tablet viewport (768x1024)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await setupDemoModeLocal(page)
    })

    test('navbar - desktop layout visible on tablet', async ({ page }) => {
      await navigateDemoMode(page, '/')
      await page.waitForTimeout(500)

      // On tablet (768px), desktop nav should be visible
      await expect(page.locator('.app-nav')).toBeVisible()

      // Hamburger should be hidden
      await expect(page.locator('.mobile-menu-toggle')).not.toBeVisible()

      await expect(page).toHaveScreenshot('tablet-navbar-desktop-layout.png', {
        fullPage: true,
      })
    })
  })

  test.describe('Menu interactions', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await setupDemoModeLocal(page)
    })

    test('menu closes on overlay click', async ({ page }) => {
      await navigateDemoMode(page, '/')
      await page.waitForTimeout(500)

      // Open menu
      await page.locator('.mobile-menu-toggle').click()
      await page.waitForTimeout(400)

      await expect(page.locator('.mobile-menu.open')).toBeVisible()

      // Click overlay to close
      await page.locator('.mobile-menu-overlay').click({ force: true })
      await page.waitForTimeout(400)

      await expect(page.locator('.mobile-menu.open')).not.toBeVisible()
    })

    test('menu closes on escape key', async ({ page }) => {
      await navigateDemoMode(page, '/')
      await page.waitForTimeout(500)

      // Open menu
      await page.locator('.mobile-menu-toggle').click()
      await page.waitForTimeout(400)

      await expect(page.locator('.mobile-menu.open')).toBeVisible()

      // Press Escape
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)

      await expect(page.locator('.mobile-menu.open')).not.toBeVisible()
    })

    test('hamburger icon animates to X when open', async ({ page }) => {
      await navigateDemoMode(page, '/')
      await page.waitForTimeout(500)

      // Verify initial state
      await expect(page.locator('.mobile-menu-toggle')).not.toHaveClass(/open/)

      // Open menu
      await page.locator('.mobile-menu-toggle').click()
      await page.waitForTimeout(400)

      // Verify open state
      await expect(page.locator('.mobile-menu-toggle.open')).toBeVisible()

      await expect(page).toHaveScreenshot('mobile-hamburger-to-x.png')
    })
  })
})

test.describe('Daemon Disconnected Overlay Visual Tests @visual', () => {
  test.beforeEach(async ({ page }) => {
    // Block all gRPC requests to simulate disconnected daemon
    await page.route('http://localhost:50051/**', async route => {
      await route.abort('connectionfailed')
    })
  })

  test('daemon disconnected - desktop viewport', async ({ page }) => {
    await page.goto('/')

    // Wait for the overlay to appear (daemon check happens after mount)
    await expect(page.locator('.daemon-disconnected-overlay')).toBeVisible()

    // Wait for animations to settle
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('daemon-disconnected-desktop.png', {
      fullPage: true,
    })
  })

  test('daemon disconnected - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')

    // Wait for the overlay to appear
    await expect(page.locator('.daemon-disconnected-overlay')).toBeVisible()

    // Wait for animations to settle
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('daemon-disconnected-mobile.png', {
      fullPage: true,
    })
  })

  test('daemon disconnected - tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    await page.goto('/')

    // Wait for the overlay to appear
    await expect(page.locator('.daemon-disconnected-overlay')).toBeVisible()

    // Wait for animations to settle
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('daemon-disconnected-tablet.png', {
      fullPage: true,
    })
  })
})
