import { defineConfig, devices } from '@playwright/test'

// Browser tests for the booking prototype.
//
// These run against a real production build served with VERCEL_ENV=preview,
// because that is the only environment where the booking journey exists at all:
// with VERCEL_ENV unset or set to production the route 404s by design. The
// server is started for the run and torn down after it.
//
// Two projects, desktop and mobile, both Chromium. Mobile is Chromium with a
// phone viewport and touch rather than WebKit, so the suite needs one browser
// download instead of two; the layout being checked is driven by Tailwind
// breakpoints, which do not care which engine renders them.
//
// Nothing here talks to a payment processor or to Aiosell. Every guest is
// fictional and every room is synthetic.

const PORT = 3210
const BASE_URL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './e2e',
  // One worker: the mock keeps quotes and drafts in the server's memory, and
  // parallel journeys through one server instance would interleave them.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        // iPhone 13 metrics, driven by Chromium.
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `${BASE_URL}/booking`,
    env: { VERCEL_ENV: 'preview' },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
