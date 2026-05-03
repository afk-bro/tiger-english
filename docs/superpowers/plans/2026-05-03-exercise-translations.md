# Exercise Translations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Translate exercise cards (MCQ + FillBlank) when learners toggle to Vietnamese — the question, an optional instruction (FillBlank only), and the chrome strings ("Correct!" / "Incorrect" / "Try again" / "Check" / "Fill in the blank") all become Vietnamese; option text and sentence-fragment scaffolding stay English.

**Architecture:** Extend `McqExercise` with optional `questionTranslations`, extend `FillBlankExercise` with optional `instruction` + `instructionTranslations`. Renderers consume the new fields via the existing `useLocalizedContent` helper. Chrome strings move to i18next keys under `lessons.exercises.*` so they reuse the project's existing fallback machinery (`fallbackLng: 'en'` in `src/lib/i18n.ts`). Author Vietnamese translations on all 23 existing unit-1 + unit-2 exercises in the same PR so no half-translated state ships.

**Tech Stack:** React 19 + TypeScript + Vite, i18next + react-i18next, Vitest + @testing-library/react. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-03-exercise-translations-design.md`.

**Branch:** `feat/exercise-translations` (already created off `main`; spec already committed).

---

## File structure

**Files modified:**
- `src/components/exercises/exercises.types.ts` — add `questionTranslations` to `McqExercise`; add `instruction` + `instructionTranslations` to `FillBlankExercise`. Type-only changes.
- `src/components/exercises/MultipleChoice.tsx` — render localized question via `useLocalizedContent`; replace 3 hardcoded chrome strings with `t(...)` calls.
- `src/components/exercises/FillBlank.tsx` — render optional localized `instruction` paragraph; replace 5 hardcoded chrome strings (incl. `aria-label`) with `t(...)` calls.
- `src/locales/en/en.json` — add `lessons.exercises` group with 5 keys.
- `src/locales/vi/vi.json` — same keys with Vietnamese values.
- `src/features/lessons/data/exercises/unit-1.ts` — add `questionTranslations: { vi: ... }` to all 7 MCQ exercises.
- `src/features/lessons/data/exercises/unit-2.ts` — add `questionTranslations` to 11 MCQ exercises; refactor `activitiesContractionShortenFb` (`u2-activities-fb-3`) to move instruction text out of `beforeBlank` into `instruction` + `instructionTranslations`.
- `src/__tests__/i18n.test.ts` — add the fallback-to-English test for the 5 new chrome keys against `th` and `zh-CN`.

**Files created:**
- `src/components/exercises/__tests__/MultipleChoice.test.tsx` — 3 tests (English default, Vietnamese, fallback).
- `src/components/exercises/__tests__/FillBlank.test.tsx` — 3 tests (instruction renders, no-instruction omits paragraph, vi instruction renders).

---

## Task 1: Extend the exercise types

**Files:**
- Modify: `src/components/exercises/exercises.types.ts`

The new fields are all optional, so existing exercise data continues to type-check until translations are authored in Tasks 5 + 6.

- [ ] **Step 1.1: Add the `LearnerLanguage` import**

In `src/components/exercises/exercises.types.ts`, **add this line at the very top of the file** (above the existing `export type McqOption = …` declarations):

```ts
import type { LearnerLanguage } from "@/features/lessons/utils/learnerLanguage";
```

- [ ] **Step 1.2: Add `questionTranslations` to `McqExercise`**

In the same file, locate the existing `McqExercise` declaration. Add the `questionTranslations` field directly after the existing `question: string;` line, so the type reads:

```ts
export type McqExercise = {
  id: string;
  question: string;
  questionTranslations?: Partial<Record<LearnerLanguage, string>>;
  options: McqOption[];
  correctOptionId: string;
};
```

Do NOT change the other fields, and do NOT touch `McqOption` or any other export in the file.

- [ ] **Step 1.3: Add `instruction` and `instructionTranslations` to `FillBlankExercise`**

In the same file, locate the existing `FillBlankExercise` declaration. Add two new fields directly above the existing `beforeBlank: string;` line, so the type reads:

```ts
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

- [ ] **Step 1.4: Verify the types compile**

Run: `npm run type-check`

Expected: PASS — no errors. The existing exercise data files (`unit-1.ts`, `unit-2.ts`) still satisfy the extended types because all new fields are optional.

- [ ] **Step 1.5: Run the full test suite to confirm no regressions**

Run: `npm test`

Expected: 400/400 passing (no test changes yet; this just confirms the type-only edit didn't break anything).

- [ ] **Step 1.6: Commit**

```bash
git add src/components/exercises/exercises.types.ts
git commit -m "feat(exercises): add optional translation fields to exercise types"
```

---

## Task 2: i18next chrome keys + fallback test

**Files:**
- Modify: `src/locales/en/en.json`
- Modify: `src/locales/vi/vi.json`
- Modify: `src/__tests__/i18n.test.ts`

The fallback test goes first (TDD). It will FAIL initially because the keys don't exist in any locale — i18next will return the raw key string `"lessons.exercises.correct"`. Adding the English keys makes it pass (because `fallbackLng: 'en'` resolves missing th/zh-CN keys to English).

- [ ] **Step 2.1: Write the failing fallback test**

In `src/__tests__/i18n.test.ts`, add this `it(...)` block immediately after the existing `falls back to English for unknown language` test (insert after line 40, before the closing `});` of the `describe('i18n config', …)` block):

```ts
  it('falls back to English for the new exercise chrome keys when the language file lacks them', () => {
    for (const lang of ['th', 'zh-CN']) {
      i18n.changeLanguage(lang);
      expect(i18n.t('lessons.exercises.correct'), `${lang} fallback for correct`).toBe('Correct!');
      expect(i18n.t('lessons.exercises.incorrect'), `${lang} fallback for incorrect`).toBe('Incorrect');
      expect(i18n.t('lessons.exercises.tryAgain'), `${lang} fallback for tryAgain`).toBe('Try again');
      expect(i18n.t('lessons.exercises.check'), `${lang} fallback for check`).toBe('Check');
      expect(i18n.t('lessons.exercises.fillInTheBlank'), `${lang} fallback for fillInTheBlank`).toBe('Fill in the blank');
    }
  });
```

- [ ] **Step 2.2: Run the new test and confirm it fails**

Run: `npm test -- src/__tests__/i18n.test.ts -t "fallback to English for the new exercise chrome keys"`

Expected: FAIL — `i18n.t('lessons.exercises.correct')` returns the raw key string `"lessons.exercises.correct"` (because the key doesn't exist in any locale yet).

- [ ] **Step 2.3: Add the English keys**

In `src/locales/en/en.json`, locate the existing top-level `lessons` object and add an `exercises` group inside it (alongside the existing keys like `vocab`, `card`, `detail`, etc.). The block to add:

```json
    "exercises": {
      "correct": "Correct!",
      "incorrect": "Incorrect",
      "tryAgain": "Try again",
      "check": "Check",
      "fillInTheBlank": "Fill in the blank"
    },
```

Make sure the trailing comma matches whatever sibling key follows it in the file (or omit the comma if `exercises` ends up as the last key in the `lessons` object). Preserve the existing JSON shape and indentation; do NOT reorder other keys.

- [ ] **Step 2.4: Add the Vietnamese keys**

In `src/locales/vi/vi.json`, locate the existing top-level `lessons` object and add the same shape with Vietnamese values:

```json
    "exercises": {
      "correct": "Đúng rồi!",
      "incorrect": "Sai rồi",
      "tryAgain": "Thử lại",
      "check": "Kiểm tra",
      "fillInTheBlank": "Điền vào chỗ trống"
    },
```

Same comma rules as Step 2.3.

- [ ] **Step 2.5: Run the fallback test and confirm it passes**

Run: `npm test -- src/__tests__/i18n.test.ts -t "fallback to English for the new exercise chrome keys"`

Expected: PASS — th/zh-CN both resolve to the English values via `fallbackLng: 'en'`.

- [ ] **Step 2.6: Run the full i18n test file to confirm no regressions**

Run: `npm test -- src/__tests__/i18n.test.ts`

Expected: all tests in the file pass (the existing `vi locale has all top-level keys that en locale has` test is still satisfied because we added `exercises` to BOTH `en.json` and `vi.json`).

- [ ] **Step 2.7: Commit**

```bash
git add src/locales/en/en.json src/locales/vi/vi.json src/__tests__/i18n.test.ts
git commit -m "feat(i18n): add lessons.exercises chrome strings + fallback test"
```

---

## Task 3: MultipleChoice renderer + tests

**Files:**
- Create: `src/components/exercises/__tests__/MultipleChoice.test.tsx`
- Modify: `src/components/exercises/MultipleChoice.tsx`

Three tests, then the renderer changes. The test mock pattern mirrors `src/features/lessons/utils/__tests__/useLocalizedContent.test.ts`: mock `react-i18next` so `useTranslation` returns the i18n key for `t(...)` calls (we don't need real chrome strings for these tests) and a configurable `mockI18n.language`.

- [ ] **Step 3.1: Write the failing tests**

Create `src/components/exercises/__tests__/MultipleChoice.test.tsx` with:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import MultipleChoice from "../MultipleChoice";
import type { McqExercise } from "../exercises.types";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}));

const baseExercise: McqExercise = {
  id: "test-mcq",
  question: "What is the answer?",
  options: [
    { id: "a", text: "Option A" },
    { id: "b", text: "Option B" },
  ],
  correctOptionId: "a",
};

describe("MultipleChoice", () => {
  beforeEach(() => {
    mockI18n.language = "en";
  });

  it("renders the English question by default", () => {
    render(<MultipleChoice exercise={baseExercise} />);
    expect(screen.getByText("What is the answer?")).toBeInTheDocument();
  });

  it("renders the Vietnamese question when language is vi and a vi translation exists", () => {
    mockI18n.language = "vi";
    render(
      <MultipleChoice
        exercise={{
          ...baseExercise,
          questionTranslations: { vi: "Câu trả lời là gì?" },
        }}
      />,
    );
    expect(screen.getByText("Câu trả lời là gì?")).toBeInTheDocument();
  });

  it("falls back to the English question when language is vi but no vi translation exists", () => {
    mockI18n.language = "vi";
    render(<MultipleChoice exercise={baseExercise} />);
    expect(screen.getByText("What is the answer?")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3.2: Run the tests and confirm they fail**

Run: `npm test -- src/components/exercises/__tests__/MultipleChoice.test.tsx`

Expected: tests RUN but the second test (Vietnamese question) FAILS because the renderer currently emits `exercise.question` raw and ignores `questionTranslations`. Tests #1 and #3 may pass coincidentally (both expect the English string).

- [ ] **Step 3.3: Update the renderer**

In `src/components/exercises/MultipleChoice.tsx`:

1. Add two new imports at the top of the file (after the existing `import { clsx } …` line):

```ts
import { useTranslation } from "react-i18next";
import { useLocalizedContent } from "@/features/lessons/utils/useLocalizedContent";
```

2. Inside the `MultipleChoice` function, immediately after the `const isCorrect = …` line, add:

```ts
  const { t } = useTranslation();
  const localizedQuestion = useLocalizedContent(exercise.question, exercise.questionTranslations);
```

3. Change the question render. The current line:

```tsx
        {exercise.question}
```

becomes:

```tsx
        {localizedQuestion}
```

4. Replace the three hardcoded chrome strings:

- `Correct!` → `{t("lessons.exercises.correct")}`
- `Incorrect` → `{t("lessons.exercises.incorrect")}`
- `Try again` → `{t("lessons.exercises.tryAgain")}`

For reference, the post-change snippet of the answered-state block looks like:

```tsx
            {isCorrect ? (
              <>
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
                {t("lessons.exercises.correct")}
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" aria-hidden="true" />
                {t("lessons.exercises.incorrect")}
              </>
            )}
          </div>
          {!isCorrect && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              {t("lessons.exercises.tryAgain")}
            </button>
          )}
```

- [ ] **Step 3.4: Run the tests and confirm they pass**

Run: `npm test -- src/components/exercises/__tests__/MultipleChoice.test.tsx`

Expected: 3/3 PASS.

- [ ] **Step 3.5: Run the full suite to confirm no regressions**

Run: `npm test`

Expected: all tests pass. Particular attention: any `BlockRenderer` or `SectionRenderer` test that renders an exercise block. The renderer change is additive (still renders question + options + chrome) so existing assertions should hold.

- [ ] **Step 3.6: Commit**

```bash
git add src/components/exercises/__tests__/MultipleChoice.test.tsx src/components/exercises/MultipleChoice.tsx
git commit -m "feat(exercises): localize MultipleChoice question and chrome strings"
```

---

## Task 4: FillBlank renderer + tests

**Files:**
- Create: `src/components/exercises/__tests__/FillBlank.test.tsx`
- Modify: `src/components/exercises/FillBlank.tsx`

Same TDD pattern as Task 3, plus the new `instruction` paragraph rendering.

- [ ] **Step 4.1: Write the failing tests**

Create `src/components/exercises/__tests__/FillBlank.test.tsx` with:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import FillBlank from "../FillBlank";
import type { FillBlankExercise } from "../exercises.types";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}));

const scaffoldingOnly: FillBlankExercise = {
  id: "test-fb-scaffolding",
  beforeBlank: "Where",
  afterBlank: "they?",
  correctAnswer: "are",
};

const withInstruction: FillBlankExercise = {
  id: "test-fb-instruction",
  instruction: "Make this shorter:",
  instructionTranslations: { vi: "Rút gọn câu này:" },
  beforeBlank: "",
  afterBlank: "at home.",
  correctAnswer: "He's",
};

describe("FillBlank", () => {
  beforeEach(() => {
    mockI18n.language = "en";
  });

  it("renders the English instruction paragraph when instruction is set", () => {
    render(<FillBlank exercise={withInstruction} />);
    expect(screen.getByText("Make this shorter:")).toBeInTheDocument();
  });

  it("does not render an instruction paragraph when instruction is undefined", () => {
    const { container } = render(<FillBlank exercise={scaffoldingOnly} />);
    // Sanity: the scaffolding still renders.
    expect(screen.getByText("Where")).toBeInTheDocument();
    // No <p> tags should appear pre-submit (the only <p> in this component
    // is the instruction paragraph; the post-submit feedback uses a <div>).
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("renders the Vietnamese instruction when language is vi and a vi translation exists", () => {
    mockI18n.language = "vi";
    render(<FillBlank exercise={withInstruction} />);
    expect(screen.getByText("Rút gọn câu này:")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4.2: Run the tests and confirm they fail**

Run: `npm test -- src/components/exercises/__tests__/FillBlank.test.tsx`

Expected: tests RUN. Test #1 (English instruction renders) FAILS because the current renderer doesn't render `instruction` at all. Test #3 also FAILS for the same reason. Test #2 may pass coincidentally (no instruction means no `<p>` already).

- [ ] **Step 4.3: Update the renderer**

In `src/components/exercises/FillBlank.tsx`:

1. Add two new imports at the top of the file (after the existing `import { clsx } …` line):

```ts
import { useTranslation } from "react-i18next";
import { useLocalizedContent } from "@/features/lessons/utils/useLocalizedContent";
```

2. Inside the `FillBlank` function, immediately after the `const isCorrect = …` line, add:

```ts
  const { t } = useTranslation();
  const localizedInstruction = useLocalizedContent(
    exercise.instruction ?? "",
    exercise.instructionTranslations,
  );
```

3. Render the instruction paragraph above the inline blank. Inside the existing top-level `<div className="space-y-4">`, immediately after the opening `<div>` and BEFORE the existing inline-blank `<div className="flex flex-wrap …">`, add:

```tsx
      {exercise.instruction && (
        <p className="text-base font-medium text-semantic-text">
          {localizedInstruction}
        </p>
      )}
```

The gate is on `exercise.instruction` (the English source). If the English source is `undefined`, no paragraph renders even if `instructionTranslations` is set — this is by design (see spec, Schema notes).

4. Replace the four hardcoded chrome strings:

- `Check` → `{t("lessons.exercises.check")}`
- `Correct!` → `{t("lessons.exercises.correct")}`
- `Incorrect` → `{t("lessons.exercises.incorrect")}`
- `Try again` → `{t("lessons.exercises.tryAgain")}`

5. Replace the hardcoded `aria-label`:

```tsx
          aria-label="Fill in the blank"
```

becomes:

```tsx
          aria-label={t("lessons.exercises.fillInTheBlank")}
```

- [ ] **Step 4.4: Run the tests and confirm they pass**

Run: `npm test -- src/components/exercises/__tests__/FillBlank.test.tsx`

Expected: 3/3 PASS.

- [ ] **Step 4.5: Run the full suite to confirm no regressions**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 4.6: Commit**

```bash
git add src/components/exercises/__tests__/FillBlank.test.tsx src/components/exercises/FillBlank.tsx
git commit -m "feat(exercises): localize FillBlank, add optional instruction paragraph"
```

---

## Task 5: Author Vietnamese translations on unit-1 MCQ exercises

**Files:**
- Modify: `src/features/lessons/data/exercises/unit-1.ts`

7 MCQ exercises get a `questionTranslations: { vi: ... }` field. The 2 fill-blanks (`activitiesAddressFillBlank`, `activitiesPhoneFillBlank`) are pure scaffolding and stay unchanged.

- [ ] **Step 5.1: Add `questionTranslations` to all 7 MCQ exercises**

In `src/features/lessons/data/exercises/unit-1.ts`, add a `questionTranslations` field directly after the `question:` line in each of the following exports. The values:

| Export name | Vietnamese question |
|---|---|
| `grammarMcq1` | `Chọn dạng đúng: "She ___ a student."` |
| `activitiesNameMcq` | `Chọn câu trả lời đúng cho: "What is your name?"` |
| `activitiesThanksMcq` | `Chọn câu trả lời đúng cho: "Thank you!"` |
| `activitiesThirdPersonMcq` | `Chọn câu trả lời đúng cho: "What is her name?"` |
| `activitiesWhereMcq` | `Chọn từ đúng: "___ are you from?"` |
| `activitiesFirstNameMcq` | `Chọn câu trả lời đúng cho: "What is your first name?"` |
| `activitiesLastNameMcq` | `Chọn câu trả lời đúng cho: "What is your last name?"` |

Example shape for one entry — apply this pattern to all 7:

```ts
export const grammarMcq1: McqExercise = {
  id: "u1-grammar-mcq-1",
  question: "Choose the correct form: 'She ___ a student.'",
  questionTranslations: { vi: "Chọn dạng đúng: \"She ___ a student.\"" },
  options: [
    { id: "a", text: "am" },
    { id: "b", text: "is" },
    { id: "c", text: "are" },
  ],
  correctOptionId: "b",
};
```

Note the use of escaped double quotes (`\"…\"`) inside the Vietnamese string for items where the textbook citation appears in quotes. Single quotes (`'`) in the English source can render as either `'` or `"` in the Vietnamese — be consistent within each item.

The 2 fill-blank exports (`activitiesAddressFillBlank`, `activitiesPhoneFillBlank`) are NOT modified.

- [ ] **Step 5.2: Run type-check**

Run: `npm run type-check`

Expected: PASS.

- [ ] **Step 5.3: Run tests to confirm no regressions**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 5.4: Commit**

```bash
git add src/features/lessons/data/exercises/unit-1.ts
git commit -m "feat(lessons): add Vietnamese translations to unit-1 MCQ exercises"
```

---

## Task 6: Author Vietnamese translations on unit-2 MCQs + refactor `u2-activities-fb-3`

**Files:**
- Modify: `src/features/lessons/data/exercises/unit-2.ts`

11 MCQ exercises get `questionTranslations: { vi: ... }`. One fill-blank (`activitiesContractionShortenFb`) is refactored: the instruction text moves from `beforeBlank` into a new `instruction` field with `instructionTranslations`. The other 2 unit-2 fill-blanks stay scaffolding-only.

- [ ] **Step 6.1: Add `questionTranslations` to all 11 MCQ exercises**

In `src/features/lessons/data/exercises/unit-2.ts`, add a `questionTranslations` field directly after the `question:` line in each of the following exports.

| Export name | Vietnamese question |
|---|---|
| `grammarMcqContractions` | `Dạng rút gọn của "She is" là gì?` |
| `grammarMcqWhereWord` | `Chọn từ đúng: "___ are they?"` |
| `activitiesVocabClassroomMcq` | `Bạn viết lên cái nào?` |
| `activitiesVocabHomeMcq` | `Bạn nấu ăn ở đâu?` |
| `activitiesVocabTownMcq` | `Bạn mượn sách ở đâu?` |
| `activitiesVocabMixedMcq` | `Cái nào ở trong nhà bạn, không ở trong lớp học?` |
| `activitiesWhereResponseMariaMcq` | `Chọn câu trả lời cho: "Where is Maria?"` |
| `activitiesWhereResponseChildrenMcq` | `Chọn câu trả lời cho: "Where are the children?"` |
| `activitiesContractionTheyMcq` | `Dạng rút gọn của "They are" là gì?` |
| `activitiesContractionItMcq` | `Dạng rút gọn của "It is" là gì?` |
| `activitiesContractionCorrectMcq` | `Câu nào đúng?` |

Example shape — apply this pattern to all 11:

```ts
export const grammarMcqContractions: McqExercise = {
  id: "u2-grammar-mcq-1",
  question: "What is the contraction for \"She is\"?",
  questionTranslations: { vi: "Dạng rút gọn của \"She is\" là gì?" },
  options: [
    { id: "a", text: "She'r" },
    { id: "b", text: "She's" },
    { id: "c", text: "She'is" },
  ],
  correctOptionId: "b",
};
```

- [ ] **Step 6.2: Refactor `activitiesContractionShortenFb`**

In the same file, locate the existing `activitiesContractionShortenFb` export and replace it with this updated shape. The instruction prefix moves out of `beforeBlank` into the new `instruction` field:

```ts
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

The other two unit-2 fill-blanks (`activitiesWhereAreFb`, `activitiesWhereDictionaryFb`) are NOT modified — they're pure scaffolding.

- [ ] **Step 6.3: Run type-check**

Run: `npm run type-check`

Expected: PASS.

- [ ] **Step 6.4: Run tests to confirm no regressions**

Run: `npm test`

Expected: all tests pass. The `data.test.ts` "all 14 expected exercise objects with correct IDs" test still passes because we only added optional fields and refactored one fill-blank's internal shape (its `id` is unchanged).

- [ ] **Step 6.5: Commit**

```bash
git add src/features/lessons/data/exercises/unit-2.ts
git commit -m "feat(lessons): add Vietnamese to unit-2 MCQs + refactor fb-3 instruction"
```

---

## Task 7: Final verification + open PR

**Files:** None modified.

This task confirms the work meets the spec's acceptance criteria, then pushes the branch and opens a PR.

- [ ] **Step 7.1: Run the full test suite**

Run: `npm test`

Expected: ALL tests PASS — 400 prior + 6 new renderer tests + 1 i18n fallback test = **407 / 407**.

- [ ] **Step 7.2: Run TypeScript check**

Run: `npm run type-check`

Expected: clean, no errors.

- [ ] **Step 7.3: Run lint**

Run: `npm run lint`

Expected: no new lint errors.

- [ ] **Step 7.4: Run the production build**

Run: `npm run build`

Expected: build succeeds. Note any new chunk-size warnings (none expected — the change is small).

- [ ] **Step 7.5: Manual walkthrough in dev**

Start the dev server: `npm run dev` (in the background; capture the chosen port).

Then in a browser:

1. Navigate to `/lessons/unit-2/activities`. Verify the cards render in English (look identical to current main).
2. Toggle the language to **Vietnamese** in the language switcher.
3. Confirm:
   - Each MCQ question text appears in Vietnamese.
   - Each MCQ's option text stays in English (e.g., `She's`, `kitchen`, `library`).
   - The `u2-activities-fb-3` exercise shows a Vietnamese instruction paragraph above the blank (`Rút gọn câu này (dùng dạng rút gọn): "He is at home." →`), and the inline blank line still reads `<input> at home.`
   - Other fill-blanks (`u2-activities-fb-1`, `u2-activities-fb-2`) still show their scaffolding in English.
   - Click an option (correct or incorrect) — the chrome below the card shows `Đúng rồi!` / `Sai rồi`, and the reset link reads `Thử lại`.
   - The fill-blank submit button reads `Kiểm tra`.
4. Toggle to **Thai**. Confirm:
   - Question text falls back to English (no `th` translations exist).
   - Chrome strings fall back to English (no `th` keys in `th.json`).
   - UI is not broken — no raw `lessons.exercises.correct` strings appear.
5. Toggle to **Chinese (zh-CN)**. Same expectations as Thai.
6. Repeat steps 1-5 on `/lessons/unit-1/activities` to confirm the unit-1 backfill works equally well.

Stop the dev server (Ctrl+C / kill the background process).

- [ ] **Step 7.6: Cross-check acceptance criteria against the spec**

Re-read the "Acceptance criteria" section of `docs/superpowers/specs/2026-05-03-exercise-translations-design.md`. Verify each item:

- [ ] `McqExercise.questionTranslations` and `FillBlankExercise.instruction` / `instructionTranslations` typed and optional.
- [ ] `MultipleChoice.tsx` and `FillBlank.tsx` render the localized text via `useLocalizedContent`.
- [ ] All 5 chrome strings rendered via `t(...)` with `lessons.exercises.*` keys.
- [ ] `lessons.json` for `en` and `vi` updated with the 5 new keys (actually `en.json` / `vi.json` per spec correction).
- [ ] All 7 unit-1 MCQ + 11 unit-2 MCQ have `vi` `questionTranslations`.
- [ ] `u2-activities-fb-3` refactored: instruction text moved to new field, with `vi`.
- [ ] All 6 renderer tests + the i18n fallback test pass; existing exercise / block / section / i18n tests stay green.
- [ ] `npm test` + `npm run build` clean.
- [ ] Manual toggle test on both unit-1 and unit-2 activities passes.

- [ ] **Step 7.7: Push the branch and open the PR**

Run:

```bash
git push -u origin feat/exercise-translations
gh pr create --title "feat(exercises): translate exercise cards (question + instruction + chrome) to Vietnamese" --body "$(cat <<'EOF'
## Summary
- Extends `McqExercise` with optional `questionTranslations` and `FillBlankExercise` with optional `instruction` + `instructionTranslations`.
- Updates `MultipleChoice.tsx` and `FillBlank.tsx` to consume the new fields via the existing `useLocalizedContent` helper.
- Moves 5 hardcoded chrome strings (`Correct!`, `Incorrect`, `Try again`, `Check`, `Fill in the blank`) to i18next keys under `lessons.exercises.*`, in `en.json` and `vi.json`.
- Authors Vietnamese translations on all 7 unit-1 MCQs and 11 unit-2 MCQs.
- Refactors `u2-activities-fb-3` so its "Make this shorter…" prefix lives in the new `instruction` field (translatable) and the scaffolding stays English-only.
- Adds 6 renderer tests + 1 i18n fallback regression test (asserts `th`/`zh-CN` chrome keys fall back to English, not raw key strings).

Spec: `docs/superpowers/specs/2026-05-03-exercise-translations-design.md`
Plan: `docs/superpowers/plans/2026-05-03-exercise-translations.md`

## Test plan
- [ ] `npm test` green
- [ ] `npm run type-check` clean
- [ ] `npm run lint` clean
- [ ] `npm run build` succeeds
- [ ] Toggle to Vietnamese on `/lessons/unit-1/activities` and `/lessons/unit-2/activities`: questions + chrome strings render in Vietnamese; option text and sentence-fragment scaffolding stay English; the `u2-activities-fb-3` instruction paragraph renders above the blank.
- [ ] Toggle to Thai or Chinese: question text + chrome strings fall back to English; UI is not broken.

## Out of scope (follow-ups)
- Thai (`th`) and Chinese (`zh-CN`) translations on exercises.
- Polishing distractor quality on the contraction MCQs (flagged in unit-2 PR review).
- Building the `match` exercise type (still stubbed).
EOF
)"
```

Expected: PR opened against `main`. Capture the URL and report back.

---

## Self-review notes

**Spec coverage:** Each spec section maps to a task — schema (Task 1), i18next chrome keys + fallback test (Task 2), renderer changes for MCQ (Task 3) and FillBlank (Task 4), content authoring for unit-1 (Task 5) and unit-2 + fb-3 refactor (Task 6), final verification + PR (Task 7). All acceptance criteria covered.

**Type consistency:** Field names match across all tasks — `questionTranslations`, `instruction`, `instructionTranslations` are spelled identically in the type declaration (Task 1), the renderers (Tasks 3-4), and the data files (Tasks 5-6). Vietnamese strings in the table-form Tasks 5/6 are the same as in the spec's content-authoring section.

**TDD discipline:** Tasks 2, 3, 4 follow strict failing-test-then-implementation. Tasks 1, 5, 6 are type/data-only and rely on `npm run type-check` + `npm test` as the verification gate (no behavior to test directly). Task 7 is verification-only.

**Commit cadence:** 6 implementation commits + 1 verification step = 7 logical units, each commits independently. Each task's commit message uses `feat(exercises):` or `feat(lessons):` or `feat(i18n):` prefix as appropriate, matching project commit style observed in recent log.
