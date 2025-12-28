import { defineConfig, devices } from '@playwright/test'

// Visual test snapshot configuration
// Screenshots are stored next to the pages they test in app/**/screenshot/
const visualTestConfig = {
  testDir: './e2e/tests/visual',
  testMatch: '**/*.visual.spec.ts',
  snapshotDir: './app',
  snapshotPathTemplate: '{snapshotDir}/{testFileDir}/{arg}-{projectName}{ext}',
}

// Regular e2e test configuration
const regularTestConfig = {
  testDir: './e2e/tests',
  testIgnore: '**/visual/**',
}

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  timeout: 30000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      // Allow 3% pixel difference for cross-platform font rendering variations
      // (macOS Core Text vs Linux FreeType produce slightly different anti-aliasing)
      maxDiffPixelRatio: 0.03,
      // Per-pixel color threshold (0-1 scale, 0.2 = 20% color tolerance)
      threshold: 0.2,
    },
  },

  use: {
    baseURL: 'http://localhost:5180',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Visual tests require consistent environment (Linux).
  // CI is authoritative for screenshots. Local devs should use Docker via `pnpm e2e:visual:docker`
  projects: process.env.CI
    ? [
        // CI: Run regular e2e tests (Chromium)
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
          ...regularTestConfig,
        },
        // CI: Run visual tests (Linux is authoritative for screenshots)
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
          ...visualTestConfig,
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
          ...visualTestConfig,
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
          ...visualTestConfig,
        },
        {
          name: 'mobile-chrome',
          use: { ...devices['Pixel 5'] },
          ...visualTestConfig,
        },
      ]
    : [
        // Local: Regular e2e tests - all browsers
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
          ...regularTestConfig,
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
          ...regularTestConfig,
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
          ...regularTestConfig,
        },
        // Local: Visual tests only when PLAYWRIGHT_VISUAL=1
        // Use `pnpm e2e:visual:docker` for consistent results matching CI
        ...(process.env.PLAYWRIGHT_VISUAL
          ? [
              {
                name: 'chromium',
                use: { ...devices['Desktop Chrome'] },
                ...visualTestConfig,
              },
              {
                name: 'firefox',
                use: { ...devices['Desktop Firefox'] },
                ...visualTestConfig,
              },
              {
                name: 'webkit',
                use: { ...devices['Desktop Safari'] },
                ...visualTestConfig,
              },
              {
                name: 'mobile-chrome',
                use: { ...devices['Pixel 5'] },
                ...visualTestConfig,
              },
            ]
          : []),
      ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5180',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
