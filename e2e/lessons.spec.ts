/**
 * e2e/lessons.spec.ts
 *
 * Integration tests for the Lessons area — the structured-lessons entry
 * point behind <RequireAuth>. These exercise sidebar navigation, the unit
 * list rendering, the three LessonDetail branches (available / coming-soon
 * / not-found), and confirm that coming-soon cards are disabled divs, not
 * navigable links. Catches routing, styling, and i18n wiring issues that
 * the unit tests can't see.
 *
 * Real Supabase auth is used (not mocked) — we sign in as the tester
 * account via the actual login form so the session flows through
 * onAuthStateChange the same way a user's would. See signInAsTester in
 * fixtures.ts for the helper.
 */
import { test, expect } from '@playwright/test';

test.describe('Lessons area', () => {
  // Auth comes from the setup project's stored storageState (see
  // playwright.config.ts and e2e/auth.setup.ts). Every test starts already
  // logged in as the shared tester account.

  // ── Navigation + list rendering ──────────────────────────────────────────

  test('sidebar link navigates to /lessons and shows the list page', async ({ page }) => {
    // Start on an authenticated page so the sidebar is rendered. /home is
    // the post-login landing page and carries the AuthLayout shell.
    await page.goto('/home');

    // The sidebar is rendered in both the desktop panel and the always-mounted
    // mobile drawer, so the "Lessons" link appears twice in the DOM. Click the
    // first (desktop) one.
    await page.getByRole('link', { name: 'Lessons' }).first().click();

    await expect(page).toHaveURL('/lessons');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Lessons' })
    ).toBeVisible();
    await expect(
      page.getByText('Structured English lessons, one unit at a time')
    ).toBeVisible();
  });

  test('renders 4 unit cards with Unit 1 available and Units 2–4 coming soon', async ({ page }) => {
    await page.goto('/lessons');

    // Unit 1 — the only available unit — is an actual <a> link
    await expect(
      page.getByRole('link', { name: /To Be: Introduction/ })
    ).toBeVisible();

    // Unit titles for 2–4 appear as headings inside disabled cards
    await expect(
      page.getByRole('heading', { level: 2, name: /To Be: Yes\/No Questions/ })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: /Present Continuous Tense/ })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: /Possessive Adjectives/ })
    ).toBeVisible();

    // Exactly one Available badge and three Coming soon badges
    await expect(page.getByText('Available')).toHaveCount(1);
    await expect(page.getByText('Coming soon')).toHaveCount(3);
  });

  test('coming-soon cards render as disabled divs, not navigable links', async ({ page }) => {
    await page.goto('/lessons');

    // The "To Be: Yes/No Questions" card is coming-soon and must NOT be a link
    await expect(
      page.getByRole('link', { name: /To Be: Yes\/No Questions/ })
    ).toHaveCount(0);

    // Instead, it renders inside a div with aria-disabled=true
    const unit2Card = page.locator('[aria-disabled="true"]').filter({
      hasText: 'To Be: Yes/No Questions',
    });
    await expect(unit2Card).toBeVisible();
  });

  // ── LessonDetail — available branch ──────────────────────────────────────

  test('Unit 1 detail shows in-development banner + full outline', async ({ page }) => {
    await page.goto('/lessons/unit-1');

    // In-development banner — both lines
    await expect(page.getByText('This unit is being built.')).toBeVisible();
    await expect(
      page.getByText('The structure below shows what will be here soon.')
    ).toBeVisible();

    // Unit header includes the number and title
    await expect(
      page.getByRole('heading', { level: 1, name: /Unit 1.*To Be: Introduction/ })
    ).toBeVisible();

    // Topic and grammar-focus sub-lines
    await expect(
      page.getByText('Personal information & meeting people')
    ).toBeVisible();
    await expect(
      page.getByText("Present tense of 'to be' (am / is / are)")
    ).toBeVisible();

    // Outline card heading and all 5 section rows
    await expect(page.getByText('Coming in this unit')).toBeVisible();
    for (const section of [
      'Overview',
      'Grammar',
      'Vocabulary',
      'Dialogues',
      'Practice activities',
    ]) {
      await expect(
        page.getByRole('listitem').filter({ hasText: new RegExp(`^${section}$`) })
      ).toBeVisible();
    }

    // Back link is present
    await expect(
      page.getByRole('link', { name: /Back to lessons/ })
    ).toBeVisible();
  });

  // ── LessonDetail — coming-soon branch ────────────────────────────────────

  test('coming-soon unit detail shows placeholder message, no in-dev banner', async ({ page }) => {
    await page.goto('/lessons/unit-2');

    // The coming-soon placeholder message is present
    await expect(
      page.getByText(/This unit isn.?t ready yet\.?\s*Check back soon\.?/)
    ).toBeVisible();

    // The in-development banner from the available branch must NOT appear
    await expect(page.getByText('This unit is being built.')).toHaveCount(0);

    // Unit header still renders with the number + title
    await expect(
      page.getByRole('heading', { level: 1, name: /Unit 2.*To Be: Yes\/No Questions/ })
    ).toBeVisible();
  });

  // ── LessonDetail — not-found branch ──────────────────────────────────────

  test('unknown unit slug shows "Unit not found" with back link', async ({ page }) => {
    await page.goto('/lessons/unit-99');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Unit not found' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Back to lessons/ })
    ).toBeVisible();

    // Sanity check: neither the in-dev banner nor the coming-soon copy should
    // leak through when the slug doesn't match any unit.
    await expect(page.getByText('This unit is being built.')).toHaveCount(0);
    await expect(page.getByText(/This unit isn.?t ready yet/)).toHaveCount(0);
  });
});
