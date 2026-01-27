import { test, expect } from '@playwright/test'
import { setupDemoMode, navigateToDemoProject } from '../../utils/test-helpers'

test.describe('Issues List', () => {
  test('should display list of issues', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Should display at least the first few demo issue titles
    await expect(page.getByText('Implement dark mode toggle')).toBeVisible()
    await expect(page.getByText('Fix login timeout issue')).toBeVisible()
  })

  test('should display issue metadata', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Should display status indicators (demo issues have various statuses)
    await expect(page.getByText(/open/i).first()).toBeVisible()
  })

  test('should display issue display numbers', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Should display issue numbers (use button role which wraps the issue number)
    await expect(page.getByRole('button', { name: '#1' })).toBeVisible()
    await expect(page.getByRole('button', { name: '#2' })).toBeVisible()
  })

  test('should navigate to issue detail when clicking on an issue', async ({
    page,
  }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/issues')

    // Click on the first demo issue
    await page.getByText('Implement dark mode toggle').click()

    // Should navigate to issue detail page
    await expect(page).toHaveURL(/\/issues\//)
  })
})
