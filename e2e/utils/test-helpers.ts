import type { Page } from '@playwright/test'
import { GrpcMocker } from './mock-grpc'
import { addProjectHandlers } from '../mocks/handlers/project'
import { addIssueHandlers } from '../mocks/handlers/issues'
import { addDocHandlers } from '../mocks/handlers/docs'
import { addDaemonHandlers } from '../mocks/handlers/daemon'
import type { Issue } from '@/gen/centy_pb'
import type { Doc } from '@/gen/centy_pb'
import type { ProjectInfo } from '@/gen/centy_pb'

const TEST_PROJECT_PATH = '/test/project'

// Demo project constants for path-based routing
const DEMO_ORG_SLUG = 'demo-org'
const DEMO_PROJECT_NAME = 'centy-showcase'

export interface SetupOptions {
  issues?: Issue[]
  docs?: Doc[]
  projects?: ProjectInfo[]
  isInitialized?: boolean
  vscodeAvailable?: boolean
}

/**
 * Sets up demo mode for the page. Demo mode uses built-in mock handlers
 * and is more reliable than GrpcMocker for e2e tests.
 */
export async function setupDemoMode(page: Page): Promise<void> {
  // Set demo mode in sessionStorage before navigation
  await page.addInitScript(() => {
    sessionStorage.setItem('centy_demo_mode', 'true')
    localStorage.setItem('centy-selected-org', 'demo-org')
    localStorage.setItem('centy-project-path', '/demo/centy-showcase')
  })
}

/**
 * Sets up a fully mocked GrpcMocker with all handlers configured.
 * @deprecated Use setupDemoMode for more reliable e2e tests
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
  addDaemonHandlers(mocker, {
    vscodeAvailable: options.vscodeAvailable ?? true,
  })

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
  // Use domcontentloaded instead of networkidle to avoid timeout with gRPC streaming
  await page.waitForLoadState('domcontentloaded')

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
 * In demo mode, paths like /issues are converted to project-scoped paths.
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await waitForAppReady(page)
}

/**
 * Navigates to a project-scoped page in demo mode.
 * Use this for tests that need the project-scoped view.
 * E.g., navigateToDemoProject(page, '/issues') -> /demo-org/centy-showcase/issues
 */
export async function navigateToDemoProject(
  page: Page,
  path: string
): Promise<void> {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  const projectPath = `/${DEMO_ORG_SLUG}/${DEMO_PROJECT_NAME}/${normalizedPath}`
  await page.goto(projectPath)
  await waitForAppReady(page)
}

/**
 * Gets the test project path used in tests.
 */
export function getTestProjectPath(): string {
  return TEST_PROJECT_PATH
}
