import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'npx next start -p 3000',
        url: 'http://127.0.0.1:3000',
        stdout: 'pipe',
        stderr: 'pipe',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        cwd: __dirname,
      },
  projects: [
    {
      name: 'chromium',
      testIgnore: /user-stories\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'pc-stories',
      testMatch: /user-stories\.spec\.ts/,
      grep: /PC user stories/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-stories',
      testMatch: /user-stories\.spec\.ts/,
      grep: /Mobile user stories/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      },
    },
  ],
});
