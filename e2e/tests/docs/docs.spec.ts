import { test, expect } from '@playwright/test'
import { setupDemoMode, navigateToDemoProject } from '../../utils/test-helpers'

test.describe('Docs List', () => {
  test('should display list of docs', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/docs')

    // Wait for the docs list to load by checking for the heading
    await expect(
      page.getByRole('heading', { name: /documentation/i })
    ).toBeVisible()

    // Should display demo doc titles (use heading role for specificity)
    await expect(
      page.getByRole('heading', { name: 'Getting Started', level: 3 })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'API Reference', level: 3 })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Contributing Guide', level: 3 })
    ).toBeVisible()
  })

  test('should navigate to doc detail when clicking on a doc', async ({
    page,
  }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/docs')

    // Wait for docs to load
    await expect(
      page.getByRole('heading', { name: 'Getting Started', level: 3 })
    ).toBeVisible()

    // Click on the first demo doc link
    await page.getByRole('link', { name: 'Getting Started' }).click()

    // Should navigate to doc detail page
    await expect(page).toHaveURL(/\/docs\/getting-started/)
  })
})

test.describe('Doc Detail', () => {
  test('should display doc title', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/docs/getting-started')

    // Doc title is in the .doc-title class
    await expect(page.locator('.doc-title')).toBeVisible()
    await expect(page.locator('.doc-title')).toHaveText('Getting Started')
  })

  test('should display doc content', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/docs/getting-started')

    // Should display some of the demo doc content
    await expect(page.getByText(/welcome to centy/i)).toBeVisible()
  })

  test('should render markdown content', async ({ page }) => {
    await setupDemoMode(page)
    await navigateToDemoProject(page, '/docs/getting-started')

    // Should render markdown (check for Installation heading in content)
    await expect(
      page.getByRole('heading', { name: 'Installation' })
    ).toBeVisible()
  })
})
