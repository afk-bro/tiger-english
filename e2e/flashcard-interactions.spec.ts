/**
 * e2e/flashcard-interactions.spec.ts
 *
 * Integration tests for the flashcard page. These run in a real Chromium
 * browser and catch CSS-level bugs — pointer events, z-index stacking, focus
 * management — that JSDOM unit tests cannot detect.
 *
 * All Supabase API calls are intercepted and served from local fixtures so
 * the tests never require a running backend or database.
 *
 * Note on locator strategy: the front and back flip buttons live inside face
 * wrappers that toggle aria-hidden when the card flips. Playwright's
 * getByRole() respects aria-hidden and cannot find elements inside a hidden
 * ancestor. CSS-attribute locators (page.locator()) search the full DOM and
 * are used for any button that moves between visible/hidden states.
 */
import { test, expect } from '@playwright/test';
import {
  mockFlashcardApi,
  navigateToCardViewer,
  FRONT_FLIP_BTN,
  BACK_FLIP_BTN,
} from './fixtures';

// ── Card flip ─────────────────────────────────────────────────────────────────

test.describe('Flashcard — click to flip', () => {
  test.beforeEach(async ({ page }) => {
    await mockFlashcardApi(page);
    await navigateToCardViewer(page);
  });

  test('clicking the flip button on the front flips to the back', async ({ page }) => {
    const frontBtn = page.locator(FRONT_FLIP_BTN);
    const backBtn  = page.locator(BACK_FLIP_BTN);

    await expect(frontBtn).toHaveAttribute('tabindex', '0');

    await frontBtn.click();

    await expect(backBtn).toHaveAttribute('tabindex', '0');
    await expect(frontBtn).toHaveAttribute('tabindex', '-1');
  });

  test('clicking the flip button on the back flips back to the front', async ({ page }) => {
    const frontBtn = page.locator(FRONT_FLIP_BTN);
    const backBtn  = page.locator(BACK_FLIP_BTN);

    await frontBtn.click();
    await backBtn.click();

    await expect(frontBtn).toHaveAttribute('tabindex', '0');
    await expect(backBtn).toHaveAttribute('tabindex', '-1');
  });

  test('clicking the native word text flips the card (z-10 flip button captures the click)', async ({ page }) => {
    // The flip button sits at z-10, above the word text. Clicking anywhere on
    // the card face — including directly on the text — routes to the flip button.
    const nativeWord = page.locator('p').filter({ hasText: 'สวัสดี' });
    await nativeWord.click({ force: true }); // force bypasses Playwright's interception check

    await expect(page.locator(BACK_FLIP_BTN)).toHaveAttribute('tabindex', '0');
  });
});

// ── Inner buttons do not flip ─────────────────────────────────────────────────

test.describe('Flashcard — inner buttons do not flip the card', () => {
  test.beforeEach(async ({ page }) => {
    await mockFlashcardApi(page);
    await navigateToCardViewer(page);
    // Start on the back face
    await page.locator(FRONT_FLIP_BTN).click();
    await expect(page.locator(BACK_FLIP_BTN)).toHaveAttribute('tabindex', '0');
  });

  test('clicking Show Example does not flip the card', async ({ page }) => {
    await page.getByRole('button', { name: 'Show Example' }).click();

    // Card should still be on the back face
    await expect(page.locator(BACK_FLIP_BTN)).toHaveAttribute('tabindex', '0');
    // Example sentence should now be visible
    await expect(page.getByText('Hello, how are you?')).toBeVisible();
  });

  test('clicking TTS speaker button does not flip the card', async ({ page }) => {
    await page.getByRole('button', { name: /Hear pronunciation of/i }).click();

    // Card should still be on the back face
    await expect(page.locator(BACK_FLIP_BTN)).toHaveAttribute('tabindex', '0');
    await expect(page.locator(FRONT_FLIP_BTN)).toHaveAttribute('tabindex', '-1');
  });
});

// ── Focus management ──────────────────────────────────────────────────────────

test.describe('Flashcard — focus management on flip', () => {
  test.beforeEach(async ({ page }) => {
    await mockFlashcardApi(page);
    await navigateToCardViewer(page);
  });

  test('mouse click: front flip button does not retain focus after flip (prevents aria-hidden warning)', async ({ page }) => {
    const frontBtn = page.locator(FRONT_FLIP_BTN);
    await frontBtn.focus();
    await frontBtn.click();

    // handleFlip blurs the active flip button before aria-hidden is applied
    await expect(frontBtn).not.toBeFocused();
  });

  test('keyboard Enter: focus moves to the back flip button', async ({ page }) => {
    await page.locator(FRONT_FLIP_BTN).focus();
    await page.keyboard.press('Enter');

    await expect(page.locator(BACK_FLIP_BTN)).toBeFocused();
  });

  test('keyboard Enter on back face: focus returns to the front flip button', async ({ page }) => {
    // Flip to back via keyboard
    await page.locator(FRONT_FLIP_BTN).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator(BACK_FLIP_BTN)).toBeFocused();

    // Flip back to front via keyboard
    await page.keyboard.press('Enter');
    await expect(page.locator(FRONT_FLIP_BTN)).toBeFocused();
  });
});

// ── Navbar navigation reset ───────────────────────────────────────────────────

test.describe('Flashcard — navbar link resets to set list', () => {
  test('clicking Flashcards in navbar while viewing a card returns to the set list', async ({ page }) => {
    await mockFlashcardApi(page);
    await navigateToCardViewer(page);

    // Confirm we're in the card viewer
    await expect(page.locator(FRONT_FLIP_BTN)).toBeVisible();

    // Click the Flashcards nav link
    await page.getByRole('link', { name: 'Flashcards' }).click();

    // Should be back on the set list, not the card viewer
    await expect(page.getByText('Basic Greetings')).toBeVisible();
    await expect(page.locator(FRONT_FLIP_BTN)).not.toBeVisible();
  });
});
