# Exercise Translations — Design

**Status:** Approved (brainstorm)
**Date:** 2026-05-03
**Branch:** `feat/exercise-translations` off `main`.

## Problem

Activity exercise cards in the Gain English app do not translate when a learner toggles to Vietnamese. The surrounding lesson chrome (headings, text blocks, callouts) translates because each block carries a `translations` field that the renderers consume via `useLocalizedContent`. Exercise cards have no equivalent translation channel: `McqExercise` and `FillBlankExercise` (`src/components/exercises/exercises.types.ts`) carry no translations, and the renderers (`MultipleChoice.tsx`, `FillBlank.tsx`) do not call `useTranslation` at all.

There are also five hardcoded English chrome strings inside the exercise renderers — `"Correct!"`, `"Incorrect"`, `"Try again"`, `"Check"`, and the `aria-label="Fill in the blank"` — that should be i18next keys (matching the project pattern in `VocabListBlock.tsx`).

We need to:

1. Extend `McqExercise` with an optional `questionTranslations` field.
2. Extend `FillBlankExercise` with optional `instruction` + `instructionTranslations` fields.
3. Update both renderers to pick up the localized text via `useLocalizedContent`.
4. Move the 5 chrome strings to i18next keys (en + vi).
5. Author Vietnamese translations on all 23 existing exercises (9 unit-1 + 14 unit-2).
6. Refactor `u2-activities-fb-3` to move its instruction prefix out of `beforeBlank` and into the new `instruction` field.

All in a single PR (Approach 1) so the toggle-to-Vietnamese experience lands consistently across both available units.

## Constraints

- Reuse the established `useLocalizedContent` helper and `LearnerLanguage` type from `src/features/lessons/utils/`. No new translation infrastructure.
- Reuse the project's i18next pattern for chrome strings (`useTranslation` + `t("lessons.exercises.*")`) — already in use in `VocabListBlock.tsx`.
- Option text on MCQ and `beforeBlank`/`afterBlank` on FillBlank are NOT translated — they are the answer space (options) or sentence scaffolding the learner must complete in English.
- Vietnamese-only authoring per the standing language focus. Thai (`th`) and Chinese (`zh-CN`) translations are deferred to a future PR.
- New translation fields are all optional; existing exercise data continues to type-check until translations are authored.
- Translating `correctAnswer` / `acceptableAnswers` is explicitly out of scope — those are matched against learner input which is in English.

## File-level changes

### Modified files

- `src/components/exercises/exercises.types.ts` — extend the two exercise types.
- `src/components/exercises/MultipleChoice.tsx` — `useLocalizedContent` for the question; `t(...)` for chrome strings.
- `src/components/exercises/FillBlank.tsx` — render an optional localized `instruction` paragraph above the inline blank; `t(...)` for chrome strings.
- `src/locales/en/lessons.json` — add the `exercises` namespace with 5 new keys.
- `src/locales/vi/lessons.json` — same keys with Vietnamese values.
- `src/features/lessons/data/exercises/unit-1.ts` — add `questionTranslations: { vi: ... }` to all 7 MCQ exercises (the 2 fill-blanks have no instruction text and stay scaffolding-only).
- `src/features/lessons/data/exercises/unit-2.ts` — add `questionTranslations` to 11 MCQ exercises; refactor `activitiesContractionShortenFb` (`u2-activities-fb-3`) to move the instruction text out of `beforeBlank` and into `instruction` + `instructionTranslations`.

### New files

- Test files for the renderers if not already present (e.g., `src/components/exercises/__tests__/MultipleChoice.test.tsx`, `src/components/exercises/__tests__/FillBlank.test.tsx`). The implementer follows whatever convention is already in place; if no exercise tests exist, create the files using the i18n mock pattern from `src/features/lessons/__tests__/SectionPage.test.tsx`.

## Schema changes

Replace the contents of `src/components/exercises/exercises.types.ts`:

```ts
import type { LearnerLanguage } from "@/features/lessons/utils/learnerLanguage";

export type McqOption = {
  id: string;
  text: string;
};

export type McqExercise = {
  id: string;
  question: string;
  questionTranslations?: Partial<Record<LearnerLanguage, string>>;
  options: McqOption[];
  correctOptionId: string;
};

export type FillBlankExercise = {
  id: string;
  instruction?: string;
  instructionTranslations?: Partial<Record<LearnerLanguage, string>>;
  beforeBlank: string;
  afterBlank: string;
  correctAnswer: string;
  acceptableAnswers?: string[];
};
```

Notes:

- `LearnerLanguage` is the same type used by `Section` / `VocabItem` / `DialogueLine` — re-using it keeps the language set aligned across the app.
- `instruction?` and `instructionTranslations?` are independently optional. A FillBlank with no instruction (most existing ones) stays valid; one with English-only instruction is also valid.
- The renderer treats the English `instruction` as the gate: if `instruction` is `undefined`, **no instruction paragraph is rendered regardless of `instructionTranslations`**. Authors who want the paragraph in any language must supply the English source first. The type allows the inverse purely for ergonomics; it has no runtime effect.

## Renderer changes

### `MultipleChoice.tsx`

Three changes inside the existing function:

1. Add imports:

```ts
import { useTranslation } from "react-i18next";
import { useLocalizedContent } from "@/features/lessons/utils/useLocalizedContent";
```

2. At the top of the function body, derive the localized question and `t`:

```ts
const { t } = useTranslation();
const localizedQuestion = useLocalizedContent(exercise.question, exercise.questionTranslations);
```

3. Swap the four hardcoded strings:

- `{exercise.question}` → `{localizedQuestion}`
- `Correct!` → `{t("lessons.exercises.correct")}`
- `Incorrect` → `{t("lessons.exercises.incorrect")}`
- `Try again` → `{t("lessons.exercises.tryAgain")}`

Option text (`option.text`) stays unmodified — it's the answer space.

### `FillBlank.tsx`

Same imports plus the new `instruction` rendering. Derive at the top of the function body:

```ts
const { t } = useTranslation();
const localizedInstruction = useLocalizedContent(
  exercise.instruction ?? "",
  exercise.instructionTranslations,
);
```

Render `localizedInstruction` as a `<p>` above the inline blank line, gated on the English `instruction` source being set:

```tsx
{exercise.instruction && (
  <p className="text-base font-medium text-semantic-text">
    {localizedInstruction}
  </p>
)}
<div className="flex flex-wrap items-center gap-2 text-base text-semantic-text">
  <span>{exercise.beforeBlank}</span>
  ...
```

Swap the chrome strings:

- `Check` → `{t("lessons.exercises.check")}`
- `Correct!` / `Incorrect` / `Try again` → `t(...)` per the keys below
- `aria-label="Fill in the blank"` → `aria-label={t("lessons.exercises.fillInTheBlank")}`

`beforeBlank` and `afterBlank` stay rendered as raw English — they are sentence scaffolding the learner must complete in English.

## i18next chrome keys

Add the following to `src/locales/en/lessons.json` under whatever existing nesting the file uses (merge into the `lessons` namespace):

```json
{
  "lessons": {
    "exercises": {
      "correct": "Correct!",
      "incorrect": "Incorrect",
      "tryAgain": "Try again",
      "check": "Check",
      "fillInTheBlank": "Fill in the blank"
    }
  }
}
```

And to `src/locales/vi/lessons.json`:

```json
{
  "lessons": {
    "exercises": {
      "correct": "Đúng rồi!",
      "incorrect": "Sai rồi",
      "tryAgain": "Thử lại",
      "check": "Kiểm tra",
      "fillInTheBlank": "Điền vào chỗ trống"
    }
  }
}
```

The implementer merges these into the existing files at whatever depth the project already uses. The keys themselves are stable.

## Content authoring

### Unit-1 — 7 MCQ questions get `questionTranslations: { vi: ... }`

The two fill-blanks (`u1-activities-fb-1`, `u1-activities-fb-2`) have no instruction text and stay scaffolding-only. No changes to their data.

| ID | English question | Vietnamese |
|---|---|---|
| `u1-grammar-mcq-1` | *Choose the correct form: "She ___ a student."* | Chọn dạng đúng: "She ___ a student." |
| `u1-activities-mcq-1` | *Choose the correct response to: "What is your name?"* | Chọn câu trả lời đúng cho: "What is your name?" |
| `u1-activities-mcq-2` | *Choose the correct response to: "Thank you!"* | Chọn câu trả lời đúng cho: "Thank you!" |
| `u1-activities-mcq-3` | *Choose the correct response to: "What is her name?"* | Chọn câu trả lời đúng cho: "What is her name?" |
| `u1-activities-mcq-4` | *Choose the correct word: "___ are you from?"* | Chọn từ đúng: "___ are you from?" |
| `u1-activities-mcq-5` | *Choose the correct response to: "What is your first name?"* | Chọn câu trả lời đúng cho: "What is your first name?" |
| `u1-activities-mcq-6` | *Choose the correct response to: "What is your last name?"* | Chọn câu trả lời đúng cho: "What is your last name?" |

### Unit-2 — 11 MCQ questions get `questionTranslations: { vi: ... }`

| ID | English question | Vietnamese |
|---|---|---|
| `u2-grammar-mcq-1` | *What is the contraction for "She is"?* | Dạng rút gọn của "She is" là gì? |
| `u2-grammar-mcq-2` | *Choose the correct word: "___ are they?"* | Chọn từ đúng: "___ are they?" |
| `u2-activities-mcq-1` | *Which one do you write on?* | Bạn viết lên cái nào? |
| `u2-activities-mcq-2` | *Where do you cook food?* | Bạn nấu ăn ở đâu? |
| `u2-activities-mcq-3` | *Where do you borrow books?* | Bạn mượn sách ở đâu? |
| `u2-activities-mcq-4` | *Which one is in your home, not in your classroom?* | Cái nào ở trong nhà bạn, không ở trong lớp học? |
| `u2-activities-mcq-5` | *Choose the response to: "Where is Maria?"* | Chọn câu trả lời cho: "Where is Maria?" |
| `u2-activities-mcq-6` | *Choose the response to: "Where are the children?"* | Chọn câu trả lời cho: "Where are the children?" |
| `u2-activities-mcq-7` | *What is the contraction for "They are"?* | Dạng rút gọn của "They are" là gì? |
| `u2-activities-mcq-8` | *What is the contraction for "It is"?* | Dạng rút gọn của "It is" là gì? |
| `u2-activities-mcq-9` | *Which sentence is correct?* | Câu nào đúng? |

### Unit-2 fill-blank refactor — `u2-activities-fb-3`

```ts
// BEFORE
export const activitiesContractionShortenFb: FillBlankExercise = {
  id: "u2-activities-fb-3",
  beforeBlank: "Make this shorter (use a contraction): \"He is at home.\" →",
  afterBlank: "at home.",
  correctAnswer: "He's",
};

// AFTER
export const activitiesContractionShortenFb: FillBlankExercise = {
  id: "u2-activities-fb-3",
  instruction: "Make this shorter (use a contraction): \"He is at home.\" →",
  instructionTranslations: {
    vi: "Rút gọn câu này (dùng dạng rút gọn): \"He is at home.\" →",
  },
  beforeBlank: "",
  afterBlank: "at home.",
  correctAnswer: "He's",
};
```

The instruction text moves out of `beforeBlank` so the inline blank line becomes just `<blank> at home.`, with the instruction sentence rendered above it.

### Untouched exercises

- `u1-activities-fb-1`, `u1-activities-fb-2`, `u2-activities-fb-1`, `u2-activities-fb-2` — pure scaffolding (e.g., `Where ___ they?`). Translating their `beforeBlank`/`afterBlank` would change what the right answer looks like, so these stay English-only.

## Tests

### New tests

In `src/components/exercises/__tests__/` (create if absent), using the `react-i18next` mock pattern from `src/features/lessons/__tests__/SectionPage.test.tsx:6-16`:

1. **`MultipleChoice` renders English question by default** — given a basic `McqExercise` with no `questionTranslations`, the question text appears verbatim.
2. **`MultipleChoice` renders the `vi` translation when language is vi** — render with `i18n.language = "vi"` and a `questionTranslations: { vi: "..." }`; assert the Vietnamese text appears.
3. **`MultipleChoice` falls back to English when language is vi but no `vi` translation exists** — same setup, no `questionTranslations`; English appears.
4. **`FillBlank` renders the `instruction` paragraph when set** — given an exercise with `instruction: "..."`, assert a paragraph with that text appears above the blank.
5. **`FillBlank` does not render an instruction paragraph when `instruction` is undefined** — given a scaffolding-only exercise, no extra paragraph appears.
6. **`FillBlank` renders the localized `instruction` when language is vi** — same i18n setup as the MCQ test, exercise has `instructionTranslations: { vi: "..." }`.

### Regression checks

- `BlockRenderer` / `SectionRenderer` tests use exercise blocks indirectly. Verify they still pass after the renderer changes (the new fields are optional, so this should be a non-event but worth confirming).
- Any existing `MultipleChoice` / `FillBlank` test files (grep before starting): update them if they assert on the now-translated chrome strings (they'd need to find strings via `t(...)` keys, which the existing test mock returns verbatim).

### Pre-PR spot-checks

1. `npm run type-check` — confirms all 9 + 14 = 23 exercise objects still satisfy the extended types.
2. `npm run lint` — no new violations.
3. `npm test` — full suite green, including the 6 new exercise tests. Especially important since this changes shared types touched by both unit-1 and unit-2 data.
4. `npm run build` — production bundle succeeds.
5. `npm run dev` — open `/lessons/unit-2/activities` and `/lessons/unit-1/activities` in the browser:
   - In English: cards look identical to today.
   - Toggle to Vietnamese: question text + `u2-activities-fb-3` instruction translate to `vi`; options + `beforeBlank`/`afterBlank` stay English; "Correct!" / "Incorrect" / "Try again" / "Check" all appear in Vietnamese.
   - Toggle to Thai or Chinese: question + instruction fall back to English; options stay English; chrome strings stay English (no `th` / `zh-CN` keys exist in `lessons.json`); UI is not broken.
   - Repeat the toggle test on `/lessons/unit-1/activities` to confirm the backfilled translations work.

## Acceptance criteria

- [ ] `McqExercise.questionTranslations` and `FillBlankExercise.instruction` / `instructionTranslations` typed and optional.
- [ ] `MultipleChoice.tsx` and `FillBlank.tsx` render the localized text via `useLocalizedContent`.
- [ ] All 5 chrome strings rendered via `t(...)` with `lessons.exercises.*` keys.
- [ ] `lessons.json` for `en` and `vi` updated with the 5 new keys.
- [ ] All 7 unit-1 MCQ + 11 unit-2 MCQ have `vi` `questionTranslations`.
- [ ] `u2-activities-fb-3` refactored: instruction text moved to new field, with `vi`.
- [ ] All 6 new tests pass; existing exercise / block / section tests stay green.
- [ ] `npm test` + `npm run build` clean.
- [ ] Manual toggle test on both unit-1 and unit-2 activities passes.

## Out of scope (follow-ups)

- Thai (`th`) and Chinese (`zh-CN`) translations on exercises — match the standing language focus on Vietnamese; revisit when other language focus picks up.
- Polishing distractor quality on the contraction MCQs (`She'r`, `She'is`, `They's`, etc. flagged in the unit-2 PR review). Pedagogical content polish, separate concern.
- Building the `match` exercise type (still stubbed in `ExerciseBlock.tsx`).
- Translating sentence-fragment scaffolding (`beforeBlank`/`afterBlank`) — explicitly forbidden per the design; the answer space must stay in English.
