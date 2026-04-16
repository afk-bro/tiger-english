# Full Content Localization Design Spec

## Overview

Extend localization to the remaining hardcoded English content: unit metadata (title, topic, grammarFocus), section names, and block content (headings, text, callouts). This completes the content localization work started in the previous spec.

## What's Already Localized

- VocabItem: `translations` map (th/vi/zh-CN)
- ExampleItem: `translations` map (th, vi/zh-CN incremental)
- DialogueLine: `translations` map (th/vi/zh-CN)
- UI strings: i18n locale files (en/th/vi/zh-CN)

## What This Spec Covers

- Unit metadata: `title`, `topic`, `grammarFocus`
- Section names: how they render in the UI
- Block content: `heading`, `text`, `callout` block `content` fields

## Type Changes

### Unit — add grouped translations object

```ts
type Unit = {
  slug: string;
  number: number;
  title: string;
  topic: string;
  grammarFocus: string;
  estimatedMinutes: number;
  status: UnitStatus;
  sections: SectionMeta[];
  translations: Partial<Record<LearnerLanguage, {
    title: string;
    topic: string;
    grammarFocus: string;
  }>>;
};
```

`title`, `topic`, `grammarFocus` remain as English defaults. The `translations` object provides localized versions per learner language.

### SectionMeta — no type change

`SectionMeta.title` stays as a human-readable identifier. The UI renders section names from i18n keys using `t("lessons.detail.sections.${section.key}")`. These keys already exist in all 4 locale files.

### SectionBlock — optional translations on content blocks

```ts
| { id: string; type: "heading"; content: string; translations?: Partial<Record<LearnerLanguage, string>> }
| { id: string; type: "text"; content: string; translations?: Partial<Record<LearnerLanguage, string>> }
| { id: string; type: "callout"; variant: "tip" | "note" | "warning"; content: string; translations?: Partial<Record<LearnerLanguage, string>> }
```

`translations` is optional — blocks without translations render English `content`. Examples, vocab-list, dialogue, and exercise blocks are unchanged (already localized or English-only by design).

## Fallback Behavior

Same pattern everywhere:
- Learner language supported + translation exists → show translation
- Learner language supported + translation missing → show English `content`
- No learner language (English/unsupported) → show English `content`

No visual degradation indicator needed for block content — unlike vocab cards where missing translations are a clear gap, block content in English is the default learning material and doesn't need to look "broken."

## Component Changes

### UnitCard

Reads `getLearnerLanguage(i18n.language)`, looks up `unit.translations[lang]?.title`, `unit.translations[lang]?.topic`, `unit.translations[lang]?.grammarFocus`. Falls back to `unit.title`/`unit.topic`/`unit.grammarFocus`.

### UnitHub

Same pattern for the unit header display (title, topic, grammarFocus).

### SectionCard

Renders `t("lessons.detail.sections.${section.key}")` instead of `section.title`. No learner language lookup — this is a UI label handled by i18n.

### SectionPage

Sticky header uses `t("lessons.detail.sections.${section.key}")` for the section title instead of `section.title`.

### TextBlock

Reads learner language, shows `translations?.[lang]` if available, falls back to `content`.

### HeadingBlock

Same pattern as TextBlock.

### CalloutBlock

Same pattern as TextBlock.

### ExamplesBlock, VocabListBlock, DialogueBlock, ExerciseBlock

No changes. Already localized or English-only by design.

## Content Data Changes

### units.ts

All 4 units get `translations` populated for th/vi/zh-CN. Example:

```ts
{
  slug: "unit-1",
  title: "To Be: Introduction",
  topic: "Personal information & meeting people",
  grammarFocus: "Present tense of 'to be' (am / is / are)",
  translations: {
    th: {
      title: "To Be: บทนำ",
      topic: "ข้อมูลส่วนตัวและการพบปะผู้คน",
      grammarFocus: "กาลปัจจุบันของ 'to be' (am / is / are)",
    },
    vi: {
      title: "To Be: Giới thiệu",
      topic: "Thông tin cá nhân và gặp gỡ mọi người",
      grammarFocus: "Thì hiện tại của 'to be' (am / is / are)",
    },
    "zh-CN": {
      title: "To Be: 介绍",
      topic: "个人信息和认识新朋友",
      grammarFocus: "'to be' 的现在时 (am / is / are)",
    },
  },
  // ...
}
```

### Unit 1 section files (overview, grammar, vocabulary, dialogues, activities)

Add `translations` to heading, text, and callout blocks. Thai fully populated. Vietnamese and zh-CN populated where feasible, English fallback where not.

### Units 2-4

Still "coming-soon" with no section data, but `translations` for title/topic/grammarFocus populated so the lessons index renders localized cards.

## Existing Code Impact

| File | Change |
|---|---|
| `src/features/lessons/lesson.types.ts` | Add `translations` to Unit, optional `translations` to heading/text/callout SectionBlock variants |
| `src/features/lessons/data/units.ts` | Add translations for all 4 units |
| `src/features/lessons/data/sections/unit-1/*.ts` | Add translations to heading/text/callout blocks |
| `src/features/lessons/components/UnitCard.tsx` | Learner language lookup for title/topic/grammarFocus |
| `src/features/lessons/pages/UnitHub.tsx` | Learner language lookup for unit header |
| `src/features/lessons/components/SectionCard.tsx` | Switch from `section.title` to i18n key |
| `src/features/lessons/pages/SectionPage.tsx` | Switch sticky header from `section.title` to i18n key |
| `src/features/lessons/components/blocks/TextBlock.tsx` | Learner language lookup with fallback |
| `src/features/lessons/components/blocks/HeadingBlock.tsx` | Learner language lookup with fallback |
| `src/features/lessons/components/blocks/CalloutBlock.tsx` | Learner language lookup with fallback |

## Testing Strategy

- Unit tests for UnitCard/UnitHub rendering with translations
- Unit tests for TextBlock/HeadingBlock/CalloutBlock translation lookup and fallback
- Existing e2e tests should still pass (English mode unchanged)

## Definition of Done

- [ ] Thai/Vietnamese/Chinese learners see localized unit titles, topics, grammar focus on the lessons index
- [ ] Section names (Overview, Grammar, etc.) change with app language via i18n keys
- [ ] Heading, text, and callout blocks show learner-language translations where available
- [ ] Missing block translations fall back to English content cleanly
- [ ] English/unsupported language users see English throughout — no regressions
- [ ] All tests pass: typecheck, unit tests, e2e
