import { test, expect } from '@playwright/test'
import { setupDemoMode, navigateToDemoProject } from '../../utils/test-helpers'

// Demo issue from lib/grpc/demo-data.ts
const DEMO_ISSUE = {
  id: 'demo-issue-1',
  displayNumber: 1,
  title: 'Implement dark mode toggle',
  status: 'open',
  priority: 'high',
}

test.describe('Issue Detail', () => {
  test('should display issue title', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, `/issues/${DEMO_ISSUE.id}`)

    await expect(page.getByText(DEMO_ISSUE.title)).toBeVisible({
      timeout: 10000,
    })
  })

  test('should display issue description', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, `/issues/${DEMO_ISSUE.id}`)

    // Demo issue has markdown content about dark mode
    await expect(page.getByText(/add a dark mode toggle/i)).toBeVisible({
      timeout: 10000,
    })
  })

  test('should display issue metadata', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, `/issues/${DEMO_ISSUE.id}`)

    // Should display status badge
    await expect(page.locator('.status-badge')).toBeVisible({ timeout: 10000 })

    // Should display issue number
    await expect(page.getByRole('button', { name: /#1/ })).toBeVisible({
      timeout: 10000,
    })
  })

  test('should display back navigation', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, `/issues/${DEMO_ISSUE.id}`)

    // Should have a back button or breadcrumb/link to issues
    const backNav = page
      .getByRole('link', { name: /back|issues/i })
      .or(page.getByRole('button', { name: /back/i }))
      .or(page.locator('a[href*="/issues"]'))
    await expect(backNav.first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Editor Selector', () => {
  test('should display editor selector button', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, `/issues/${DEMO_ISSUE.id}`)

    // Wait for demo mode to be fully initialized
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Editor selector should be visible
    await expect(page.locator('.editor-selector')).toBeVisible({
      timeout: 10000,
    })

    // Primary button should show "Open in VS Code" by default
    await expect(page.locator('.editor-primary-btn')).toContainText(
      /Open in VS Code/i
    )
  })

  test('should open dropdown when clicking dropdown button', async ({
    page,
  }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, `/issues/${DEMO_ISSUE.id}`)

    // Wait for demo mode to be fully initialized
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Wait for editor selector
    await expect(page.locator('.editor-selector')).toBeVisible({
      timeout: 10000,
    })

    // Click dropdown button
    await page.locator('.editor-dropdown-btn').click()

    // Dropdown should be visible
    await expect(page.locator('.editor-dropdown')).toBeVisible()

    // Should show both VS Code and Terminal options
    await expect(
      page.locator('.editor-option').filter({ hasText: 'VS Code' })
    ).toBeVisible()
    await expect(
      page.locator('.editor-option').filter({ hasText: 'Terminal' })
    ).toBeVisible()
  })

  test('should close dropdown when clicking outside', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, `/issues/${DEMO_ISSUE.id}`)

    // Wait for demo mode to be fully initialized
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Wait for editor selector and open dropdown
    await expect(page.locator('.editor-selector')).toBeVisible({
      timeout: 10000,
    })
    await page.locator('.editor-dropdown-btn').click()
    await expect(page.locator('.editor-dropdown')).toBeVisible()

    // Click outside the dropdown
    await page.locator('.issue-content').click()

    // Dropdown should be hidden
    await expect(page.locator('.editor-dropdown')).not.toBeVisible()
  })

  test('should show VS Code as selected by default', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, `/issues/${DEMO_ISSUE.id}`)

    // Wait for demo mode to be fully initialized
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Wait for editor selector and open dropdown
    await expect(page.locator('.editor-selector')).toBeVisible({
      timeout: 10000,
    })
    await page.locator('.editor-dropdown-btn').click()

    // VS Code option should be selected
    await expect(
      page.locator('.editor-option.selected').filter({ hasText: 'VS Code' })
    ).toBeVisible()
  })

  test('should show Terminal as selected when preference is set', async ({
    page,
  }) => {
    // Set Terminal as preferred editor before navigation
    await page.addInitScript(() => {
      localStorage.setItem('centy-preferred-editor', '2') // EditorType.TERMINAL = 2
    })

    await setupDemoMode(page)
    await navigateToDemoProject(page, `/issues/${DEMO_ISSUE.id}`)

    // Wait for demo mode to be fully initialized
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Wait for editor selector
    await expect(page.locator('.editor-selector')).toBeVisible({
      timeout: 10000,
    })

    // Primary button should show Terminal
    await expect(page.locator('.editor-primary-btn.terminal')).toBeVisible()
    await expect(page.locator('.editor-primary-btn')).toContainText(
      /Open in Terminal/i
    )

    // Open dropdown and verify Terminal is selected
    await page.locator('.editor-dropdown-btn').click()
    await expect(
      page.locator('.editor-option.selected').filter({ hasText: 'Terminal' })
    ).toBeVisible()
  })

  test('should have correct button styling for VS Code', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, `/issues/${DEMO_ISSUE.id}`)

    // Wait for demo mode to be fully initialized
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Wait for editor selector
    await expect(page.locator('.editor-selector')).toBeVisible({
      timeout: 10000,
    })

    // Verify VS Code styling (blue theme)
    await expect(page.locator('.editor-primary-btn.vscode')).toBeVisible()
    await expect(page.locator('.editor-dropdown-btn.vscode')).toBeVisible()
  })

  test('should have correct button styling for Terminal', async ({ page }) => {
    // Set Terminal as preferred editor
    await page.addInitScript(() => {
      localStorage.setItem('centy-preferred-editor', '2')
    })

    await setupDemoMode(page)
    await navigateToDemoProject(page, `/issues/${DEMO_ISSUE.id}`)

    // Wait for demo mode to be fully initialized
    await expect(page.locator('.demo-mode-indicator')).toBeVisible({
      timeout: 10000,
    })

    // Wait for editor selector
    await expect(page.locator('.editor-selector')).toBeVisible({
      timeout: 10000,
    })

    // Verify Terminal styling (green theme)
    await expect(page.locator('.editor-primary-btn.terminal')).toBeVisible()
    await expect(page.locator('.editor-dropdown-btn.terminal')).toBeVisible()
  })
})
