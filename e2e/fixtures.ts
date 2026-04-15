import type { Page } from '@playwright/test';

// Raw DB rows — must match the shapes in src/features/flashcards/types.ts mappers

const MOCK_SET_ROWS = [
  {
    id: 'set-1',
    title: 'Basic Greetings',
    description: 'Everyday greetings and farewells',
    is_public: true,
    created_by: null,
    created_at: '2024-01-01T00:00:00Z',
    flashcards: [{ count: 2 }],   // PostgREST aggregate format
  },
];

const MOCK_CARD_ROWS = [
  {
    id: 'card-1',
    set_id: 'set-1',
    english_text: 'Hello',
    part_of_speech: 'interjection',
    level: 'basic',
    category: null,
    example_sentence: 'Hello, how are you?',
    image_url: null,
    english_audio_url: null,
    notes: null,
    is_phrase: false,
    sort_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    flashcard_translations: [
      {
        native_text: 'สวัสดี',
        native_audio_url: null,
        language_code: 'th',
        is_reviewed: true,
      },
    ],
  },
  {
    id: 'card-2',
    set_id: 'set-1',
    english_text: 'Goodbye',
    part_of_speech: 'interjection',
    level: 'basic',
    category: null,
    example_sentence: null,
    image_url: null,
    english_audio_url: null,
    notes: null,
    is_phrase: false,
    sort_order: 2,
    created_at: '2024-01-01T00:00:00Z',
    flashcard_translations: [
      {
        native_text: 'ลาก่อน',
        native_audio_url: null,
        language_code: 'th',
        is_reviewed: true,
      },
    ],
  },
];

/**
 * Intercept all Supabase REST calls used by the flashcards page and return
 * controlled mock data so tests never require a running backend or database.
 *
 * Uses regex patterns (more reliable than globs for URLs with encoded chars).
 */
export async function mockFlashcardApi(page: Page) {
  // Flashcard sets
  await page.route(/supabase\.co\/rest\/v1\/flashcard_sets/, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SET_ROWS),
    });
  });

  // Flashcards (includes joined flashcard_translations)
  await page.route(/supabase\.co\/rest\/v1\/flashcards/, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CARD_ROWS),
    });
  });

  // Card progress — unauthenticated users have no saved progress
  await page.route(/supabase\.co\/rest\/v1\/user_card_progress/, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });
}

/**
 * Navigate to /flashcards, pick Thai, and open the "Basic Greetings" set so
 * the first card is visible. Requires mockFlashcardApi to be called first.
 */
export async function navigateToCardViewer(page: Page) {
  await page.goto('/flashcards');
  await page.getByRole('button', { name: 'Thai' }).click();
  await page.getByText('Basic Greetings').click();
  // Wait until the flip button for the first card is in the DOM
  await page.waitForSelector('[aria-label^="Flip card for"]');
}

/**
 * CSS-attribute locators for flip buttons.
 *
 * The front and back flip buttons move between aria-hidden=true/false as the
 * card flips. Playwright's getByRole() respects aria-hidden and won't find
 * elements inside aria-hidden=true ancestors. We use locator() with attribute
 * selectors instead — these search the full DOM regardless of aria state.
 */
export const FRONT_FLIP_BTN = 'button[aria-label^="Flip card for"]';
export const BACK_FLIP_BTN  = 'button[aria-label="Flip card back"]';

/**
 * Sign in as the shared test account through the real login form so the
 * Supabase session is established the same way a user would do it. The auth
 * flow dispatches onAuthStateChange → fetchProfile(), which is why we wait
 * for the URL to move away from /login rather than asserting on a specific
 * destination — where exactly the router lands varies with session state.
 *
 * Credentials come from environment variables so nothing sensitive lives in
 * the repo. Set them in your local .env (which Vite loads automatically) or
 * export them in the shell before running Playwright:
 *
 *   E2E_TESTER_EMAIL=...
 *   E2E_TESTER_PASSWORD=...
 *
 * Used by any e2e test that needs to exercise routes behind <RequireAuth>.
 */
export async function signInAsTester(page: Page) {
  const email = process.env.E2E_TESTER_EMAIL;
  const password = process.env.E2E_TESTER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing e2e test credentials: set E2E_TESTER_EMAIL and E2E_TESTER_PASSWORD ' +
      'in the environment (or .env) before running Playwright.',
    );
  }

  await page.goto('/login');
  // Use attribute/placeholder selectors rather than getByLabel — the form
  // renders its label via a sibling <label htmlFor=...> but react-hook-form's
  // register() spreads can race with label association in some Playwright
  // runs. The input type+name attributes are set synchronously by FormInput.
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /log in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 });
}
