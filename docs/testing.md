# Testing Strategy

Two layers, each with a distinct responsibility.

---

## Layer 1 — Vitest + React Testing Library (unit / component)

**Run:** `npm test`  
**Files:** `src/**/__tests__/*.test.{ts,tsx}`, `scripts/lib/__tests__/*.test.ts`  
**Environment:** JSDOM (no real browser, no network)  
**Current count:** 33 test files · 280 tests

### What it covers

| Area | Files |
|---|---|
| Auth forms (login, register) | `src/__tests__/Login`, `Register` |
| Auth logic (password rules, form hooks) | `src/features/auth/__tests__/` |
| Auth guards (RequireAuth, RequireGuest) | `src/features/auth/__tests__/` |
| Flashcard data layer (API, mappers, hooks) | `src/features/flashcards/__tests__/` |
| Flashcard UI (Flashcard, FlashcardViewer, CreateSetModal) | `src/features/flashcards/__tests__/`, `src/components/flashcards/__tests__/` |
| LanguageSwitcher (ARIA menu pattern, keyboard nav, html lang sync) | `src/components/__tests__/LanguageSwitcher` |
| Dashboard cards (ContinueStudying, RecommendedNext, etc.) | `src/components/home/authenticated/__tests__/` |
| App init / auth state (AppInitializer, useUserStore) | `src/components/__tests__/`, `src/stores/__tests__/` |
| UI components (UserMenu, GoogleAuthButton) | `src/components/ui/__tests__/` |
| i18n setup | `src/__tests__/i18n` |
| Sidebar state | `src/components/sidebar/__tests__/`, `src/stores/__tests__/` |
| Seed script utilities | `scripts/lib/__tests__/` |

### What it can't catch

JSDOM does not do CSS layout or rendering. These categories of bug are invisible to this layer:

- **Pointer events / z-index** — `fireEvent.click(button)` delivers the event directly; it never checks whether another element sits on top in the visual stack.
- **CSS 3D transforms / backface-visibility** — the card flip animation has no effect in JSDOM.
- **Focus blocked by `inert`** — `inert` attribute enforcement is not replicated by JSDOM.
- **`aria-hidden` + focused element warnings** — browser accessibility engine behaviour, not a DOM attribute check.
- **React Router same-path navigation** — `location.key` changes only in a real browser history.

---

## Layer 2 — Playwright (browser integration / e2e)

**Run:** `npm run test:e2e`  
**Run (interactive UI):** `npm run test:e2e:ui`  
**Files:** `e2e/*.spec.ts`  
**Browser:** Chromium (headless)  
**Current count:** 1 spec file · 9 tests

### What it covers

All nine tests map directly to bugs that slipped past the Vitest layer:

| Test | Bug it guards against |
|---|---|
| Clicking flip button → card flips | Pointer-event or z-index regression hiding the flip button |
| Clicking word text → card flips | Content overlay intercepting clicks before they reach the flip button |
| Show Example click does not flip | Inner button click propagating to the flip button |
| TTS click does not flip | Same as above |
| Mouse flip: outgoing button loses focus | `aria-hidden`-on-focused-element browser warning |
| Keyboard Enter/Space → focus moves to new face | Focus management regression in `handleFlip` |
| Navbar "Flashcards" link resets to set list | `location.key` same-path navigation reset |

### Infrastructure

- **API mocking** — All Supabase REST calls are intercepted by `page.route()` in `e2e/fixtures.ts` and served from local fixture data. Tests never require a running backend or database.
- **Shared selectors** — `FRONT_FLIP_BTN` and `BACK_FLIP_BTN` are exported from `fixtures.ts`. The flip buttons toggle between `aria-hidden=true/false` as the card flips; `page.locator()` (attribute selector) is used instead of `getByRole()` so elements are found regardless of their aria-hidden state.
- **Dev server** — Playwright starts `npm run dev` automatically; if a server is already running on port 5173 it reuses it.

### Scope guidelines

The e2e suite is intentionally narrow. Before adding a new Playwright test, ask: **"Would JSDOM miss this?"** If a unit test can cover it adequately, write a Vitest test instead. Playwright tests are slower, have higher maintenance cost, and should be reserved for browser-only behaviour.

### Commit conventions

Split e2e work into two commits:

1. **Infrastructure** (`feat(e2e): ...`) — changes to `playwright.config.ts`, `e2e/fixtures.ts`, `package.json` scripts, or shared helpers.
2. **Tests** (`test(e2e): ...`) — the spec file(s) themselves.

This keeps the "how we set up Playwright" context separate from "what we're testing and why", and makes individual test regressions easier to bisect.

---

## Rule of thumb

```
Browser rendering bug?  → Playwright
Everything else?        → Vitest
```
