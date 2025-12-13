import type { Page } from '@playwright/test'
import { GrpcMocker } from './mock-grpc'
import { addProjectHandlers } from '../mocks/handlers/project'
import { addIssueHandlers } from '../mocks/handlers/issues'
import { addDocHandlers } from '../mocks/handlers/docs'
import type { Issue } from '@/gen/centy_pb'
import type { Doc } from '@/gen/centy_pb'
import type { ProjectInfo } from '@/gen/centy_pb'

const TEST_PROJECT_PATH = '/test/project'

export interface SetupOptions {
  issues?: Issue[]
  docs?: Doc[]
  projects?: ProjectInfo[]
  isInitialized?: boolean
}

/**
 * Sets up a fully mocked GrpcMocker with all handlers configured.
 */
export async function setupMockedPage(
  page: Page,
  options: SetupOptions = {}
): Promise<GrpcMocker> {
  const mocker = new GrpcMocker(page)

  // Add handlers
  addProjectHandlers(mocker, {
    projects: options.projects,
    isInitialized: options.isInitialized ?? true,
  })
  addIssueHandlers(mocker, { issues: options.issues })
  addDocHandlers(mocker, { docs: options.docs })

  // Setup route interception
  await mocker.setup()

  // Set project path in localStorage before navigation
  await page.addInitScript((projectPath: string) => {
    localStorage.setItem('centy_project_path', projectPath)
  }, TEST_PROJECT_PATH)

  return mocker
}

/**
 * Waits for the app to be fully loaded and daemon connected.
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // Wait for any loading indicators to disappear
  await page.waitForLoadState('networkidle')

  // Wait for the main content to be visible
  await page
    .waitForSelector('[data-testid="app-content"], main', {
      timeout: 10000,
    })
    .catch(() => {
      // Fallback - just wait for body to be ready
    })
}

/**
 * Navigates to a page and waits for it to be ready.
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await waitForAppReady(page)
}

/**
 * Gets the test project path used in tests.
 */
export function getTestProjectPath(): string {
  return TEST_PROJECT_PATH
}
