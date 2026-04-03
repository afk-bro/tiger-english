# Flashcard Browser Language Auto-Detection

**Date:** 2026-03-30
**Status:** Approved

## Problem

Unauthenticated users who land on the flashcards page see an empty state ("no cards in set") because `languageCode` is `null` until they manually pick a language. The page should auto-detect a sensible default from the browser so cards are immediately visible.

## Solution Overview

Resolve the flashcard language from a priority chain that prevents browser detection from overriding an intentional user choice. Track the resolution *source* so the UI can show the right contextual affordance.

---

## 1. Language Resolution

### Priority Chain (highest → lowest)

1. `profile?.native_language` — signed-in user's saved preference (source: `'profile'`)
2. `localStorage.getItem('flashcard_language')` — explicit prior manual choice (source: `'saved'`)
3. `detectBrowserLanguage()` — base code from `navigator.languages[0]`, only if it matches `SUPPORTED_LANGUAGES` (source: `'browser'`)
4. `null` (source: `null`)

### Helpers (all in `FlashcardsPage.tsx`)

```ts
isSupportedFlashcardLanguage(code: string): boolean
// Returns true if code is in SUPPORTED_LANGUAGES

detectBrowserLanguage(): string | null
// Reads navigator.languages[0] (falls back to navigator.language)
// Strips locale suffix: 'zh-TW' → 'zh', 'th-TH' → 'th'
// Returns base code only if isSupportedFlashcardLanguage(base) is true

getInitialFlashcardLanguage(profileLang?: string): {
  language: string | null
  source: 'profile' | 'saved' | 'browser' | null
}
// Runs the priority chain and returns both the resolved language and its source
```

### localStorage Key

`'flashcard_language'` — written whenever the user explicitly selects a language.

---

## 2. State

```ts
const [languageState, setLanguageState] = useState<{
  language: string | null
  source: 'profile' | 'saved' | 'browser' | null
}>(() => getInitialFlashcardLanguage(profile?.native_language))

const [isChangingLanguage, setIsChangingLanguage] = useState(false)
```

A `useEffect` watches `profile?.native_language`. If it arrives after mount and the current source is `'browser'` or `null`, the resolution re-runs so the profile preference wins. It does not override `'saved'`.

`handleLanguageSelect(code: string)`:
1. Saves `code` to `localStorage('flashcard_language')`
2. Sets `languageState` to `{ language: code, source: 'saved' }`
3. Resets `isChangingLanguage` to `false`

---

## 3. UI Branching

All three states render in the same slot above `FlashcardSetList`.

### `source === 'browser'` (and `!isChangingLanguage`)

Small auto-match notice:
> "Showing [Language] cards based on your browser · **Change**"

Clicking **Change** sets `isChangingLanguage = true`, which switches the slot to the full inline selector (same buttons as the null state, no note required since a language is already active).

### `source === 'profile'` or `'saved'`

Compact language switcher: current language name + change affordance (button or small selector). No explanatory text.

### `source === null`

Full selector with note:
> "Please select one of the supported languages to view flashcards."
> [Thai] [Chinese] [Vietnamese]

Cards do not render until a language is selected.

---

## 4. i18n

New keys (add to both `en.json` and `th.json`):

| Key | English value |
|-----|--------------|
| `flashcards.browser_language_notice` | `"Showing {{language}} cards based on your browser"` |
| `flashcards.change_language` | `"Change"` |
| `flashcards.unsupported_language_note` | `"Please select one of the supported languages to view flashcards."` |

Remove the existing `flashcards.choose_native_language` key from both locale files.

---

## 5. Testing

### Unit tests (new file: `src/features/flashcards/__tests__/languageDetection.test.ts`)

- `isSupportedFlashcardLanguage`: supported codes (`th`, `zh`, `vi`), unsupported codes (`en`, `fr`), locale variants (`zh-TW`, `th-TH`)
- `detectBrowserLanguage`: mock `navigator.languages` — supported base code, unsupported code, locale stripping, empty array fallback
- `getInitialFlashcardLanguage`: all four priority chain outcomes (profile wins over localStorage, localStorage wins over browser, browser wins over null, null when nothing matches)

### Component tests (update `src/features/flashcards/__tests__/FlashcardViewer.test.tsx` or page-level test)

- `source === 'browser'` renders auto-match notice with "Change" button
- `source === 'saved'` renders compact switcher
- `source === null` renders full selector with note
- Clicking a language button calls `handleLanguageSelect` and saves to localStorage

Remove any existing tests that assert the old `choose_native_language` selector behaviour.

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/FlashcardsPage.tsx` | Add helpers, new state shape, updated UI branching |
| `src/locales/en/en.json` | Add 3 keys, remove 1 |
| `src/locales/th/th.json` | Add 3 keys, remove 1 |
| `src/features/flashcards/__tests__/languageDetection.test.ts` | New — unit tests for helpers |
| `src/features/flashcards/__tests__/useFlashcardSets.test.ts` | Update if it references old language selector |
| `src/features/flashcards/__tests__/FlashcardViewer.test.tsx` | Update UI branch assertions |
