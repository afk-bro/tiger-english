/**
 * e2e/auth.setup.ts
 *
 * Playwright setup project that signs in once as the shared tester account
 * and saves the browser storage state to disk. Other e2e projects depend on
 * this one and load the saved state via `use.storageState` in the playwright
 * config — so each test starts already authenticated without hammering
 * Supabase's auth endpoint (which rate-limits parallel logins).
 *
 * The saved state file is gitignored under `playwright/.auth/`.
 */
import { test as setup } from '@playwright/test';
import { signInAsTester } from './fixtures';

export const STORAGE_STATE = 'playwright/.auth/user.json';

setup('authenticate as tester', async ({ page }) => {
  await signInAsTester(page);
  await page.context().storageState({ path: STORAGE_STATE });
});
