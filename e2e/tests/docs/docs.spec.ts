import { test, expect } from '@playwright/test'
import { setupMockedPage, navigateTo } from '../../utils/test-helpers'
import { createDocScenario, createMockDoc } from '../../fixtures/docs'

test.describe('Docs List', () => {
  test('should display empty state when no docs exist', async ({ page }) => {
    await setupMockedPage(page, { docs: createDocScenario.empty() })
    await navigateTo(page, '/docs')

    // Should show empty state message
    await expect(
      page.getByText(/no docs|create.*first|get started|no documentation/i)
    ).toBeVisible()
  })

  test('should display list of docs', async ({ page }) => {
    const docs = createDocScenario.many(3)
    await setupMockedPage(page, { docs })
    await navigateTo(page, '/docs')

    // Should display doc titles
    for (const doc of docs) {
      await expect(page.getByText(doc.title)).toBeVisible()
    }
  })

  test('should navigate to doc detail when clicking on a doc', async ({
    page,
  }) => {
    const docs = createDocScenario.single({
      slug: 'test-doc',
      title: 'Test Documentation',
    })
    await setupMockedPage(page, { docs })
    await navigateTo(page, '/docs')

    // Click on the doc
    await page.getByText('Test Documentation').click()

    // Should navigate to doc detail page
    await expect(page).toHaveURL(/\/docs\/test-doc/)
  })
})

test.describe('Doc Detail', () => {
  const testDoc = createMockDoc({
    slug: 'getting-started',
    title: 'Getting Started',
    content:
      '# Getting Started\n\nWelcome to the project!\n\n## Installation\n\n```bash\nnpm install\n```',
  })

  test('should display doc title', async ({ page }) => {
    await setupMockedPage(page, { docs: [testDoc] })
    await navigateTo(page, `/docs/${testDoc.slug}`)

    await expect(page.getByText('Getting Started')).toBeVisible()
  })

  test('should display doc content', async ({ page }) => {
    await setupMockedPage(page, { docs: [testDoc] })
    await navigateTo(page, `/docs/${testDoc.slug}`)

    // Should display some of the content
    await expect(page.getByText(/welcome to the project/i)).toBeVisible()
  })

  test('should render markdown content', async ({ page }) => {
    await setupMockedPage(page, { docs: [testDoc] })
    await navigateTo(page, `/docs/${testDoc.slug}`)

    // Should render markdown (check for heading or formatted text)
    await expect(
      page
        .locator('h1, h2')
        .filter({ hasText: /getting started|installation/i })
    ).toBeVisible()
  })

  test('should display edit button', async ({ page }) => {
    await setupMockedPage(page, { docs: [testDoc] })
    await navigateTo(page, `/docs/${testDoc.slug}`)

    // Should have an edit button
    const editButton = page
      .getByRole('button', { name: /edit/i })
      .or(page.getByRole('link', { name: /edit/i }))
    await expect(editButton).toBeVisible()
  })
})

test.describe('Doc Not Found', () => {
  test('should handle non-existent doc', async ({ page }) => {
    await setupMockedPage(page, { docs: [] })
    await navigateTo(page, '/docs/non-existent-slug')

    // Should show error or redirect
    const errorMessage = page.getByText(/not found|error|doesn't exist/i)
    const redirected =
      page.url().includes('/docs') && !page.url().includes('non-existent-slug')

    const hasError = await errorMessage.isVisible().catch(() => false)
    const wasRedirected = redirected

    expect(hasError || wasRedirected).toBe(true)
  })
})
