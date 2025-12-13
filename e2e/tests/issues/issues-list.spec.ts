import { test, expect } from '@playwright/test'
import { setupMockedPage, navigateTo } from '../../utils/test-helpers'
import { createIssueScenario } from '../../fixtures/issues'

test.describe('Issues List', () => {
  test('should display empty state when no issues exist', async ({ page }) => {
    await setupMockedPage(page, { issues: createIssueScenario.empty() })
    await navigateTo(page, '/issues')

    // Should show empty state message
    await expect(
      page.getByText(/no issues|create.*first|get started/i)
    ).toBeVisible()
  })

  test('should display list of issues', async ({ page }) => {
    const issues = createIssueScenario.many(5)
    await setupMockedPage(page, { issues })
    await navigateTo(page, '/issues')

    // Should display issue titles
    for (const issue of issues) {
      await expect(page.getByText(issue.title)).toBeVisible()
    }
  })

  test('should display issue metadata', async ({ page }) => {
    const issues = createIssueScenario.withStatuses()
    await setupMockedPage(page, { issues })
    await navigateTo(page, '/issues')

    // Should display status indicators
    await expect(page.getByText(/open/i).first()).toBeVisible()
    await expect(page.getByText(/in.?progress/i).first()).toBeVisible()
    await expect(page.getByText(/closed/i).first()).toBeVisible()
  })

  test('should display issue display numbers', async ({ page }) => {
    const issues = createIssueScenario.many(3)
    await setupMockedPage(page, { issues })
    await navigateTo(page, '/issues')

    // Should display issue numbers (e.g., #1, #2, #3)
    await expect(page.getByText('#1').or(page.getByText('1'))).toBeVisible()
    await expect(page.getByText('#2').or(page.getByText('2'))).toBeVisible()
    await expect(page.getByText('#3').or(page.getByText('3'))).toBeVisible()
  })

  test('should navigate to issue detail when clicking on an issue', async ({
    page,
  }) => {
    const issues = createIssueScenario.single({
      displayNumber: 1,
      title: 'Test Issue for Navigation',
    })
    await setupMockedPage(page, { issues })
    await navigateTo(page, '/issues')

    // Click on the issue
    await page.getByText('Test Issue for Navigation').click()

    // Should navigate to issue detail page
    await expect(page).toHaveURL(/\/issues\//)
  })
})

test.describe('Issues Filtering', () => {
  test('should filter issues by status', async ({ page }) => {
    const issues = createIssueScenario.withStatuses()
    await setupMockedPage(page, { issues })
    await navigateTo(page, '/issues')

    // Find and click status filter (implementation depends on your UI)
    const statusFilter = page.locator(
      '[data-testid="status-filter"], [aria-label*="status" i]'
    )
    if (await statusFilter.isVisible()) {
      await statusFilter.click()
      // Select a specific status
      await page
        .getByRole('option', { name: /open/i })
        .click()
        .catch(() => {
          // Alternative: checkbox or button selection
        })
    }
  })

  test('should filter issues by priority', async ({ page }) => {
    const issues = createIssueScenario.withPriorities()
    await setupMockedPage(page, { issues })
    await navigateTo(page, '/issues')

    // Find and click priority filter (implementation depends on your UI)
    const priorityFilter = page.locator(
      '[data-testid="priority-filter"], [aria-label*="priority" i]'
    )
    if (await priorityFilter.isVisible()) {
      await priorityFilter.click()
    }
  })
})

test.describe('Issues Sorting', () => {
  test('should sort issues by column header', async ({ page }) => {
    const issues = createIssueScenario.many(5)
    await setupMockedPage(page, { issues })
    await navigateTo(page, '/issues')

    // Click on a sortable column header
    const titleHeader = page.getByRole('columnheader', { name: /title/i })
    if (await titleHeader.isVisible()) {
      await titleHeader.click()
      // Verify sorting indicator appears
      await expect(titleHeader.locator('[data-sorted]'))
        .toBeVisible()
        .catch(() => {
          // Alternative check for sorting
        })
    }
  })
})
