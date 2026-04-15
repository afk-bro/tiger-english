import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

// Load variables from .env (and .env.local etc.) into process.env so the
// e2e tests see E2E_TESTER_EMAIL / E2E_TESTER_PASSWORD the same way the
// Vite dev server sees VITE_SUPABASE_URL. The empty-string prefix opts
// every variable in, not just the VITE_ ones.
Object.assign(process.env, loadEnv('', process.cwd(), ''));

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    // Runs e2e/auth.setup.ts first and stashes the authenticated session at
    // playwright/.auth/user.json. Keeps auth-requiring specs off the login
    // endpoint so they don't trip Supabase's parallel-login rate limit.
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
