# Vietnamese Support & Full i18n Migration

**Date:** 2026-04-04
**Scope:** `src/lib/i18n.ts`, `src/locales/`, ~29 component and page files

## Problem

Vietnamese users see the app in English. The root cause is `supportedLngs: ['en', 'th']` in `i18n.ts` — `vi` / `vi-VN` is not listed, so i18next falls back to English. Beyond Vietnamese support, ~150 user-visible strings across the app are hardcoded in English rather than going through `t()`, so they never translate regardless of language.

## Goal

1. Add Vietnamese as a fully supported language so `vi`/`vi-VN` browser detection serves Vietnamese text.
2. Migrate all hardcoded user-visible strings to `t()` calls, with translations for `en`, `th`, and `vi`.

## Approach

**Single translation file per language** — extend the existing `en.json` / `th.json` pattern. All keys live in one JSON object per locale. Each top-level key is a domain prefix (`flashcards`, `auth`, `dashboard`, etc.), with sub-keys nested below. This makes future extraction into i18next namespaces a config-only change (no key renames).

Existing keys (`hero`, `features`, `cta`, `header`, `register`, `login`, `logout`, `flashcards`, `settings`) are preserved as-is — no renames. New keys follow the same domain-at-root convention.

## Key Naming Convention

Top-level domain, then semantic sub-keys:

```
flashcards.flip.front_with_word      → "Flip card for {{word}}"
flashcards.flip.front_no_word        → "Flip card to see translation"
flashcards.flip.back                 → "Flip card back"
flashcards.tts.speak_label           → "Hear pronunciation of {{word}}"
flashcards.example.show              → "Show Example"
flashcards.example.hide              → "Hide Example"
dashboard.stats.xp                   → "XP"
auth.errors.invalid_credentials      → "Invalid email or password"
common.loading                       → "Loading..."
common.errors.not_found_title        → "Page Not Found"
```

Dynamic values use i18next interpolation `{{variable}}`. No plural forms are needed for current strings.

## i18n.ts Changes

```ts
supportedLngs: ['en', 'th', 'vi'],
nonExplicitSupportedLngs: true,   // matches vi-VN → vi
resources: {
  en: { translation: en },
  th: { translation: th },
  vi: { translation: vi },        // new import
},
```

`nonExplicitSupportedLngs: true` ensures region-suffixed codes (`vi-VN`, `th-TH`) match their base language without listing every variant.

## New Top-Level Domains

| Domain | Covers |
|--------|--------|
| `flashcards` | Extend existing — flip labels, TTS aria-label, example toggle |
| `dashboard` | Dashboard page headings and stats labels only |
| `profile` | Profile page labels and values |
| `about` | About page content |
| `contact` | Contact page form labels, success/error messages |
| `common` | Loading states, 404, generic error messages, shared button labels, nav/layout strings shared across authenticated and public areas |
| `auth` | Extend existing — form validation errors, username availability messages |

Existing top-level keys (`hero`, `features`, `cta`, `header`, `register`, `login`, `logout`, `settings`) are untouched.

Nav/layout strings that appear in shared components (navbar, sidebar, breadcrumbs) go under `header.*` or `common.*`, not `dashboard.*`, even if those components are primarily rendered in the authenticated area.

## Component Migration Pattern

Before finalising the key list, do a grep pass for missed literals across all JSX — pay particular attention to button text, toast messages, empty states, validation error strings, and `aria-label` / `placeholder` attributes. These are the categories most likely to be overlooked in a bulk migration.

Each component that has hardcoded strings adds `useTranslation()` if not already present and replaces literals:

```tsx
// Before
<p>Page Not Found</p>

// After
const { t } = useTranslation();
<p>{t('common.errors.not_found_title')}</p>
```

Dynamic strings use the second argument:
```tsx
// Before
aria-label={`Hear pronunciation of ${englishText}`}

// After
aria-label={t('flashcards.tts.speak_label', { word: englishText })}
```

`aria-label` and `placeholder` attributes are treated the same as visible text — all must go through `t()`.

## Locale Files

Three files are modified/created:

| File | Change |
|------|--------|
| `src/locales/en/en.json` | Add ~150 new keys across new domains |
| `src/locales/th/th.json` | Add Thai translations for all new keys |
| `src/locales/vi/vi.json` | Create — full key set (existing keys translated + all new keys) |

All translations for Thai and Vietnamese are generated. The Vietnamese translations for the existing keys were reviewed and approved in the design session.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/i18n.ts` | Add `vi`, `nonExplicitSupportedLngs: true`, import vi locale |
| `src/locales/en/en.json` | Extend with new keys |
| `src/locales/th/th.json` | Extend with Thai translations |
| `src/locales/vi/vi.json` | Create with full key set |
| `src/components/flashcards/Flashcard.tsx` | Wrap flip labels, TTS aria-label, example toggle |
| `src/components/flashcards/FlashcardDeck.tsx` | Deck UI strings |
| `src/pages/` (all page files) | Wrap page-level headings, CTAs, labels |
| `src/components/layout/` (navbar, footer) | Any remaining hardcoded nav/layout strings |
| `src/components/ui/` (shared components) | Loading, error, empty-state text |
| Protected route pages (`/u/:username/*`) | Dashboard, profile, settings content |

## Key Stability

Existing keys are preserved exactly as-is. This migration does not rename, restructure, or consolidate any key that already exists in `en.json` or `th.json`. Opportunistic cleanup of existing keys is out of scope — it would widen the diff and increase regression risk with no user-facing benefit.

## Out of Scope

- No changes to URL structure, routing, or language switcher UI (detection only).
- No right-to-left layout support.
- No changes to backend — language is a frontend concern.
- No changes to Supabase data (flashcard content is stored as-is; `nativeText` field is the per-card translation).
