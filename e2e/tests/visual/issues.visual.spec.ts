import { test, expect } from '@playwright/test'
import { setupMockedPage, navigateTo } from '../../utils/test-helpers'
import { createIssueScenario } from '../../fixtures/issues'

test.describe('Issues Visual Tests @visual', () => {
  test('issues list - empty state', async ({ page }) => {
    await setupMockedPage(page, { issues: createIssueScenario.empty() })
    await navigateTo(page, '/issues')

    // Wait for content to stabilize
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500) // Allow animations to complete

    await expect(page).toHaveScreenshot('issues-empty-state.png', {
      fullPage: true,
    })
  })

  test('issues list - with data', async ({ page }) => {
    const issues = createIssueScenario.many(5)
    await setupMockedPage(page, { issues })
    await navigateTo(page, '/issues')

    // Wait for content to stabilize
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('issues-list-with-data.png', {
      fullPage: true,
    })
  })

  test('issues list - with different statuses', async ({ page }) => {
    const issues = createIssueScenario.withStatuses()
    await setupMockedPage(page, { issues })
    await navigateTo(page, '/issues')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('issues-list-with-statuses.png', {
      fullPage: true,
    })
  })

  test('issues list - with different priorities', async ({ page }) => {
    const issues = createIssueScenario.withPriorities()
    await setupMockedPage(page, { issues })
    await navigateTo(page, '/issues')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('issues-list-with-priorities.png', {
      fullPage: true,
    })
  })
})

test.describe('Issue Detail Visual Tests @visual', () => {
  test('issue detail page', async ({ page }) => {
    const issues = createIssueScenario.single({
      id: 'visual-test-issue',
      displayNumber: 1,
      title: 'Visual Test Issue',
      description:
        'This is a test issue for visual regression testing.\n\nIt has multiple paragraphs of content.',
    })
    await setupMockedPage(page, { issues })
    await navigateTo(page, `/issues/${issues[0].id}`)

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('issue-detail.png', {
      fullPage: true,
    })
  })
})
