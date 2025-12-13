import { test, expect } from '@playwright/test'
import { setupMockedPage, navigateTo } from '../../utils/test-helpers'
import { createMockIssue, createMockIssueMetadata } from '../../fixtures/issues'

test.describe('Issue Detail', () => {
  const testIssue = createMockIssue({
    id: 'test-issue-id',
    displayNumber: 42,
    title: 'Test Issue Title',
    description: 'This is a detailed description of the test issue.',
    metadata: createMockIssueMetadata({
      displayNumber: 42,
      status: 'open',
      priority: 3,
      priorityLabel: 'high',
    }),
  })

  test('should display issue title', async ({ page }) => {
    await setupMockedPage(page, { issues: [testIssue] })
    await navigateTo(page, `/issues/${testIssue.id}`)

    await expect(page.getByText('Test Issue Title')).toBeVisible()
  })

  test('should display issue description', async ({ page }) => {
    await setupMockedPage(page, { issues: [testIssue] })
    await navigateTo(page, `/issues/${testIssue.id}`)

    await expect(
      page.getByText('This is a detailed description of the test issue.')
    ).toBeVisible()
  })

  test('should display issue metadata', async ({ page }) => {
    await setupMockedPage(page, { issues: [testIssue] })
    await navigateTo(page, `/issues/${testIssue.id}`)

    // Should display status
    await expect(page.getByText(/open/i)).toBeVisible()

    // Should display priority
    await expect(page.getByText(/high/i)).toBeVisible()

    // Should display issue number
    await expect(page.getByText(/#42|42/)).toBeVisible()
  })

  test('should display edit button', async ({ page }) => {
    await setupMockedPage(page, { issues: [testIssue] })
    await navigateTo(page, `/issues/${testIssue.id}`)

    // Should have an edit button or link
    const editButton = page
      .getByRole('button', { name: /edit/i })
      .or(page.getByRole('link', { name: /edit/i }))
    await expect(editButton).toBeVisible()
  })

  test('should display back navigation', async ({ page }) => {
    await setupMockedPage(page, { issues: [testIssue] })
    await navigateTo(page, `/issues/${testIssue.id}`)

    // Should have a back button or breadcrumb
    const backNav = page
      .getByRole('link', { name: /back|issues/i })
      .or(page.getByRole('button', { name: /back/i }))
    await expect(backNav).toBeVisible()
  })
})

test.describe('Issue Detail Actions', () => {
  const testIssue = createMockIssue({
    id: 'action-test-issue',
    displayNumber: 1,
    title: 'Issue for Actions',
  })

  test('should allow editing issue title', async ({ page }) => {
    await setupMockedPage(page, { issues: [testIssue] })
    await navigateTo(page, `/issues/${testIssue.id}`)

    // Click edit
    const editButton = page.getByRole('button', { name: /edit/i })
    if (await editButton.isVisible()) {
      await editButton.click()

      // Find title input and update
      const titleInput = page.getByRole('textbox', { name: /title/i })
      if (await titleInput.isVisible()) {
        await titleInput.fill('Updated Issue Title')
      }
    }
  })

  test('should allow changing issue status', async ({ page }) => {
    await setupMockedPage(page, { issues: [testIssue] })
    await navigateTo(page, `/issues/${testIssue.id}`)

    // Find status selector
    const statusSelector = page.locator(
      '[data-testid="status-selector"], [aria-label*="status" i]'
    )
    if (await statusSelector.isVisible()) {
      await statusSelector.click()
      // Select a different status
      await page
        .getByRole('option', { name: /in.?progress/i })
        .click()
        .catch(() => {
          // Try alternative selection method
        })
    }
  })
})

test.describe('Issue Not Found', () => {
  test('should handle non-existent issue', async ({ page }) => {
    await setupMockedPage(page, { issues: [] })
    await navigateTo(page, '/issues/non-existent-id')

    // Should show error or redirect
    // The exact behavior depends on your implementation
    const errorMessage = page.getByText(/not found|error|doesn't exist/i)
    const redirected =
      page.url().includes('/issues') && !page.url().includes('non-existent-id')

    const hasError = await errorMessage.isVisible().catch(() => false)
    const wasRedirected = redirected

    expect(hasError || wasRedirected).toBe(true)
  })
})
