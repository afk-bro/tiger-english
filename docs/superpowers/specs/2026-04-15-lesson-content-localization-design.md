# Lesson Content Localization Design Spec

## Overview

Localize lesson content so learners see vocabulary, examples, and dialogues in their native language. Add Simplified Chinese (zh-CN) as a supported language. Redesign vocab cards to show native-language front → English back.

This builds on the Lessons Phase 1 foundation (types, data layer, block components, pages) and addresses the gap where all lesson content was hardcoded with Thai-only translations.

## Design Principles

- **App language** (i18n) controls nav labels, buttons, UI text
- **Learner language** controls which translation to show in vocab cards, examples, dialogues
- In Phase 1 both are derived from the same i18n language selection, but modeled separately in the architecture
- Missing translations fall back to English-only behavior, never to another learner language
- Vocab cards are minimal: word + phonetic only, no example sentences

## Content Model Changes

All types in `src/features/lessons/lesson.types.ts`.

### New types

```ts
type LearnerLanguage = "th" | "vi" | "zh-CN";

const SUPPORTED_LEARNER_LANGUAGES: LearnerLanguage[] = ["th", "vi", "zh-CN"];
```

### Updated types

```ts
// VocabItem — adds id, removes example, replaces translation with translations map,
// phonetic now describes English pronunciation (for back of card)
type VocabItem = {
  id: string;
  word: string;              // English word
  phonetic?: string;         // English phonetic guidance
  translations: Partial<Record<LearnerLanguage, string>>;
  audioUrl?: string;
};

// ExampleItem — adds id, replaces translation with translations map
type ExampleItem = {
  id: string;
  english: string;
  translations: Partial<Record<LearnerLanguage, string>>;
  note?: string;
};

// DialogueLine — adds id, replaces translation with translations map
type DialogueLine = {
  id: string;
  speaker: string;
  text: string;              // English dialogue text
  translations: Partial<Record<LearnerLanguage, string>>;
  audioUrl?: string;
};
```

### Fallback rules

- If `getLearnerLanguage()` returns `null` (English or unsupported language): render English-only mode, no translations shown
- If learner language is supported but a specific item's `translations[lang]` is missing: apply per-component fallback (see Block Component Changes below)
- Never substitute one learner language's translation for another

## getLearnerLanguage() Helper

Location: `src/features/lessons/utils/learnerLanguage.ts`

```ts
function getLearnerLanguage(appLanguage: string): LearnerLanguage | null {
  if (appLanguage === "th") return "th";
  if (appLanguage === "vi") return "vi";
  if (appLanguage === "zh-CN" || appLanguage === "zh") return "zh-CN";
  return null;
}
```

Returns `null` for English and any unsupported language. Components use this to decide whether to show translations and which translation to look up.

## zh-CN Locale + Language Switcher

### New locale file

Create `src/locales/zh-CN/zh-CN.json` with the same key structure as en/th/vi, translated to Simplified Chinese. This covers all UI strings (nav, buttons, lesson section labels, progress states, etc.).

### i18n config changes

Register zh-CN in the i18n config (`src/lib/i18n.ts`). Add it to the supported languages list.

### Language switcher changes

Add zh-CN to the language switcher options in `src/components/LanguageSwitcher.tsx`:
- Desktop display: "中文"
- Mobile display: "ZH"

## Vocab Card Redesign

### Card direction

Flipped from current behavior. Native language front → English back.

### Front of card

- Native language word from `item.translations[learnerLang]`
- "Reveal answer" prompt beneath (localized via i18n key)
- If learner language is `null` (English/unsupported): show English word, no translation context
- If learner language is valid but translation missing: show English word in muted style as degraded state

### Back of card

- English word (`item.word`)
- English phonetic underneath if present (`item.phonetic`)
- No example sentence — `example` field removed from `VocabItem`
- No prompt text — keep the back quiet and clean

### Accessibility

- Front button label: "Flip card to reveal English for {native text}" (or "Flip card to reveal answer" if no native text)
- Back button label: "Flip card back to translation"

### React key

Use `item.id` instead of composite string keys.

## Block Component Changes

### VocabListBlock

- Reads learner language via `getLearnerLanguage(i18n.language)`
- Front shows `translations[lang]`, back shows `word` + `phonetic`
- Fallback: English word in muted style on front when translation missing
- Key: `item.id`

### ExamplesBlock

- Reads learner language
- Shows `translations[lang]` as the translation line beneath the English text
- Fallback: omit the translation line entirely when missing — do not show another language
- Key: `item.id`

### DialogueBlock

- Reads learner language
- Shows `translations[lang]` as the translation line beneath each dialogue line
- Fallback: omit the translation line when missing
- Key: `item.id`

### Unaffected blocks

- `TextBlock`, `HeadingBlock`, `CalloutBlock` render `content: string` from hardcoded Section data — these are English-only authored content and are NOT localized in this iteration
- `ExerciseBlock` — exercise content (questions, options, answers) is English-only learning material, no changes

## Content Data Changes

### Unit 1 vocabulary (`data/sections/unit-1/vocabulary.ts`)

- Add `id` field to every item
- Remove `example` field from every item
- Change `phonetic` to describe English pronunciation (not Thai)
- Replace `translation: string` with `translations: { th, vi, "zh-CN" }` — fully populated for all three languages

### Unit 1 examples (overview, grammar sections)

- Add `id` field to every item
- Replace `translation: string` with `translations` map
- Thai fully populated (migrated from existing data)
- Vietnamese and zh-CN populated where available, with graceful omission where not

### Unit 1 dialogues

- Add `id` field to every line
- Replace `translation: string` with `translations` map
- Same population strategy as examples

### Unit 1 exercises

- No changes. Exercise content is English-only.

## Existing Code Impact

| File | Change |
|---|---|
| `src/features/lessons/lesson.types.ts` | Add `LearnerLanguage`, `SUPPORTED_LEARNER_LANGUAGES`, update `VocabItem`/`ExampleItem`/`DialogueLine` |
| `src/features/lessons/utils/learnerLanguage.ts` | New — `getLearnerLanguage()` helper |
| `src/features/lessons/components/blocks/VocabListBlock.tsx` | Redesign — flipped direction, learner language lookup, remove example |
| `src/features/lessons/components/blocks/ExamplesBlock.tsx` | Learner language lookup, fallback behavior |
| `src/features/lessons/components/blocks/DialogueBlock.tsx` | Learner language lookup, fallback behavior |
| `src/features/lessons/data/sections/unit-1/*.ts` | All 5 section files updated with new content shape |
| `src/locales/zh-CN/zh-CN.json` | New — full UI translations |
| `src/lib/i18n.ts` | Register zh-CN |
| `src/components/LanguageSwitcher.tsx` | Add zh-CN option |
| `e2e/lessons.spec.ts` | Update selectors affected by vocab card changes |
| Existing unit tests | Update for new type shapes |

## Known Limitations

- **Text/heading/callout block content is English-only.** These blocks render hardcoded `content: string` from Section data, not i18n keys. Localizing this authored content is a follow-up step.
- **App language and learner language are coupled.** Both derive from `i18n.language`. A separate learner language preference toggle is not built in this iteration.
- **`profile.native_language` is not wired.** The user store has this field but it's not connected to the learner language logic yet.

## Testing Strategy

- **Unit tests**: `getLearnerLanguage()` mapping for all cases (th, vi, zh-CN, zh, en, unsupported)
- **Unit tests**: vocab card front/back rendering per language (th, vi, zh-CN, English-only mode)
- **Unit tests**: degraded fallback rendering when translation is missing
- **Unit tests**: ExamplesBlock/DialogueBlock translation display and omission
- **E2E tests**: update existing lesson tests for new vocab card selectors
- **E2E or manual**: zh-CN switcher selection + content rendering

## Definition of Done

- [ ] All Unit 1 VocabItem, ExampleItem, and DialogueLine entries have stable `id` fields
- [ ] Thai learner sees Thai vocab words on front, English + phonetic on back
- [ ] Vietnamese learner sees Vietnamese vocab words on front, English + phonetic on back
- [ ] zh-CN learner sees Chinese vocab words on front, English + phonetic on back
- [ ] English or unsupported-language users see English-only mode
- [ ] Missing translations fall back to English-only behavior, never to another learner language
- [ ] Language switcher includes zh-CN option ("中文" / "ZH")
- [ ] ExamplesBlock shows learner-language translation when available, omits when missing
- [ ] DialogueBlock shows learner-language translation when available, omits when missing
- [ ] No example sentences on vocab cards
- [ ] Unit tests for `getLearnerLanguage()` mapping behavior
- [ ] Unit tests for vocab card front/back rendering by language
- [ ] Unit tests for degraded fallback rendering (missing translation)
- [ ] Unit tests for examples/dialogue translation omission when missing
- [ ] zh-CN switcher and rendering sanity
- [ ] All tests pass: typecheck, unit tests, e2e
