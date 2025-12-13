import { test, expect } from '@playwright/test'
import { setupMockedPage, navigateTo } from '../../utils/test-helpers'
import { createIssueScenario } from '../../fixtures/issues'

test.describe('Layout Visual Tests @visual', () => {
  test('homepage - light theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await setupMockedPage(page, { issues: createIssueScenario.many(3) })
    await navigateTo(page, '/')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('homepage-light.png', {
      fullPage: true,
    })
  })

  test('homepage - dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await setupMockedPage(page, { issues: createIssueScenario.many(3) })
    await navigateTo(page, '/')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
    })
  })

  test('issues page - dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const issues = createIssueScenario.many(5)
    await setupMockedPage(page, { issues })
    await navigateTo(page, '/issues')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('issues-dark.png', {
      fullPage: true,
    })
  })
})

test.describe('Responsive Layout Visual Tests @visual', () => {
  test('issues page - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const issues = createIssueScenario.many(3)
    await setupMockedPage(page, { issues })
    await navigateTo(page, '/issues')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('issues-mobile.png', {
      fullPage: true,
    })
  })

  test('issues page - tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const issues = createIssueScenario.many(3)
    await setupMockedPage(page, { issues })
    await navigateTo(page, '/issues')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('issues-tablet.png', {
      fullPage: true,
    })
  })
})

test.describe('Docs Visual Tests @visual', () => {
  test('docs page - with content', async ({ page }) => {
    const docs = [
      {
        slug: 'getting-started',
        title: 'Getting Started',
        content: '# Getting Started\n\nWelcome!',
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          $typeName: 'centy.DocMetadata' as const,
        },
        $typeName: 'centy.Doc' as const,
      },
    ]
    await setupMockedPage(page, { docs })
    await navigateTo(page, '/docs')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('docs-list.png', {
      fullPage: true,
    })
  })
})
