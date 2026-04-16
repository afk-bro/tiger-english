# Lessons Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the lessons area framework — types, data layer, progress store, shared exercise components, block renderers, three route pages (LessonsIndex, UnitHub, SectionPage), and Unit 1 content — replacing the existing scaffold.

**Architecture:** Feature-folder (`src/features/lessons/`) with a thin data API, block-based content renderer, Zustand progress store, and shared exercise components in `src/components/exercises/`. Pages are lazy-loaded via `App.tsx` routes behind `RequireAuth` + `AuthLayout`.

**Tech Stack:** React 19, TypeScript, Vite, React Router DOM v7, Zustand, Tailwind CSS, Vitest, Playwright, i18next, Lucide icons

**Spec:** `docs/superpowers/specs/2026-04-15-lessons-phase-1-design.md`

---

## File Map

### New files — `src/features/lessons/`

| File | Responsibility |
|------|---------------|
| `lesson.types.ts` | All lesson type definitions + `SECTION_ORDER` constant |
| `useLessonProgressStore.ts` | Zustand store for visited/completed/lastVisited state |
| `data/units.ts` | Unit catalog with `sections` field (replaces `src/data/units.ts`) |
| `data/sectionRegistry.ts` | Maps `unitSlug:sectionKey` → `Section` |
| `data/getUnit.ts` | Thin API: lookup unit by slug |
| `data/getSection.ts` | Thin API: lookup section by unitSlug + sectionKey |
| `data/sections/unit-1/overview.ts` | Real content: Overview section |
| `data/sections/unit-1/vocabulary.ts` | Real content: Vocabulary section |
| `data/sections/unit-1/grammar.ts` | Placeholder content with 1 MCQ exercise |
| `data/sections/unit-1/dialogues.ts` | Placeholder content |
| `data/sections/unit-1/activities.ts` | Placeholder content with 1 fill-blank exercise |
| `data/exercises/unit-1.ts` | Exercise definitions (MCQ + fill-blank) |
| `components/UnitCard.tsx` | Unit card for LessonsIndex grid |
| `components/SectionCard.tsx` | Section card for UnitHub list |
| `components/SectionRenderer.tsx` | Maps `Section.blocks` → block components |
| `components/SectionNav.tsx` | Bottom prev/next + mark complete navigation |
| `components/blocks/TextBlock.tsx` | Renders `text` block |
| `components/blocks/HeadingBlock.tsx` | Renders `heading` block |
| `components/blocks/ExamplesBlock.tsx` | Renders `examples` block |
| `components/blocks/VocabListBlock.tsx` | Renders `vocab-list` block (flip cards) |
| `components/blocks/DialogueBlock.tsx` | Renders `dialogue` block |
| `components/blocks/CalloutBlock.tsx` | Renders `callout` block |
| `components/blocks/ExerciseBlock.tsx` | Delegates to shared exercise components |
| `pages/LessonsIndex.tsx` | `/lessons` route page |
| `pages/UnitHub.tsx` | `/lessons/:unitSlug` route page |
| `pages/SectionPage.tsx` | `/lessons/:unitSlug/:sectionKey` route page |

### New files — `src/components/exercises/`

| File | Responsibility |
|------|---------------|
| `exercises.types.ts` | Shared exercise interfaces (question, option, result) |
| `MultipleChoice.tsx` | MCQ component — question + options, shows correct/incorrect |
| `FillBlank.tsx` | Fill-in-the-blank — sentence with blank, text input, checks answer |

### Modified files

| File | Change |
|------|--------|
| `src/App.tsx` | Replace 2 lesson routes with 3 new lazy imports |
| `src/locales/en/en.json` | Extend `lessons.*` with section/exercise/progress keys |
| `src/locales/th/th.json` | Same keys as en.json with Thai translations |
| `src/locales/vi/vi.json` | Same keys as en.json with Vietnamese translations |
| `e2e/lessons.spec.ts` | Rewrite for new routes, UnitHub, SectionPage navigation |

### Removed files

| File | Reason |
|------|--------|
| `src/pages/Lessons.tsx` | Replaced by `features/lessons/pages/LessonsIndex.tsx` |
| `src/pages/LessonDetail.tsx` | Replaced by `features/lessons/pages/UnitHub.tsx` |
| `src/data/units.ts` | Moved to `features/lessons/data/units.ts` |

---

## Task 1: Types + Constants

**Files:**
- Create: `src/features/lessons/lesson.types.ts`
- Test: `src/features/lessons/__tests__/lesson.types.test.ts`

- [ ] **Step 1: Create lesson.types.ts**

```ts
// src/features/lessons/lesson.types.ts

export type UnitStatus = "available" | "coming-soon" | "locked";

export type SectionKey =
  | "overview"
  | "grammar"
  | "vocabulary"
  | "dialogues"
  | "activities";

export const SECTION_ORDER: SectionKey[] = [
  "overview",
  "grammar",
  "vocabulary",
  "dialogues",
  "activities",
];

export type Unit = {
  slug: string;
  number: number;
  title: string;
  topic: string;
  grammarFocus: string;
  estimatedMinutes: number;
  status: UnitStatus;
  sections: SectionMeta[];
};

export type SectionMeta = {
  key: SectionKey;
  title: string;
  estimatedMinutes: number;
};

export type Section = {
  id: string;
  unitSlug: string;
  key: SectionKey;
  title: string;
  blocks: SectionBlock[];
};

export type SectionBlock =
  | { id: string; type: "heading"; content: string }
  | { id: string; type: "text"; content: string }
  | { id: string; type: "examples"; items: ExampleItem[] }
  | { id: string; type: "vocab-list"; items: VocabItem[] }
  | { id: string; type: "dialogue"; lines: DialogueLine[] }
  | { id: string; type: "exercise"; exerciseType: ExerciseType; exerciseId: string }
  | { id: string; type: "callout"; variant: "tip" | "note" | "warning"; content: string };

export type ExampleItem = {
  english: string;
  translation: string;
  note?: string;
};

export type VocabItem = {
  word: string;
  translation: string;
  phonetic?: string;
  audioUrl?: string;
  example?: string;
};

export type DialogueLine = {
  speaker: string;
  text: string;
  translation: string;
  audioUrl?: string;
};

export type ExerciseType = "multiple-choice" | "fill-blank" | "match";
```

- [ ] **Step 2: Write test for SECTION_ORDER**

```ts
// src/features/lessons/__tests__/lesson.types.test.ts
import { describe, it, expect } from "vitest";
import { SECTION_ORDER } from "../lesson.types";

describe("SECTION_ORDER", () => {
  it("contains exactly 5 sections in the canonical order", () => {
    expect(SECTION_ORDER).toEqual([
      "overview",
      "grammar",
      "vocabulary",
      "dialogues",
      "activities",
    ]);
  });

  it("has no duplicates", () => {
    const unique = new Set(SECTION_ORDER);
    expect(unique.size).toBe(SECTION_ORDER.length);
  });
});
```

- [ ] **Step 3: Run test**

Run: `npx vitest run src/features/lessons/__tests__/lesson.types.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 4: Run typecheck**

Run: `npm run type-check`
Expected: PASS — no type errors

- [ ] **Step 5: Commit**

```bash
git add src/features/lessons/lesson.types.ts src/features/lessons/__tests__/lesson.types.test.ts
git commit -m "feat(lessons): add content model types and SECTION_ORDER constant"
```

---

## Task 2: Shared Exercise Types + Components

**Files:**
- Create: `src/components/exercises/exercises.types.ts`
- Create: `src/components/exercises/MultipleChoice.tsx`
- Create: `src/components/exercises/FillBlank.tsx`
- Test: `src/components/exercises/__tests__/MultipleChoice.test.tsx`
- Test: `src/components/exercises/__tests__/FillBlank.test.tsx`

- [ ] **Step 1: Create exercises.types.ts**

```ts
// src/components/exercises/exercises.types.ts

export type McqOption = {
  id: string;
  text: string;
};

export type McqExercise = {
  id: string;
  question: string;
  options: McqOption[];
  correctOptionId: string;
};

export type FillBlankExercise = {
  id: string;
  beforeBlank: string;
  afterBlank: string;
  correctAnswer: string;
  acceptableAnswers?: string[];
};
```

- [ ] **Step 2: Write MultipleChoice test**

```tsx
// src/components/exercises/__tests__/MultipleChoice.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MultipleChoice from "../MultipleChoice";
import type { McqExercise } from "../exercises.types";

const exercise: McqExercise = {
  id: "mcq-1",
  question: "What does 'hello' mean?",
  options: [
    { id: "a", text: "Goodbye" },
    { id: "b", text: "A greeting" },
    { id: "c", text: "Thank you" },
  ],
  correctOptionId: "b",
};

describe("MultipleChoice", () => {
  it("renders the question and all options", () => {
    render(<MultipleChoice exercise={exercise} />);
    expect(screen.getByText("What does 'hello' mean?")).toBeInTheDocument();
    expect(screen.getByText("Goodbye")).toBeInTheDocument();
    expect(screen.getByText("A greeting")).toBeInTheDocument();
    expect(screen.getByText("Thank you")).toBeInTheDocument();
  });

  it("shows correct feedback when correct option is selected", async () => {
    const user = userEvent.setup();
    render(<MultipleChoice exercise={exercise} />);
    await user.click(screen.getByText("A greeting"));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("shows incorrect feedback when wrong option is selected", async () => {
    const user = userEvent.setup();
    render(<MultipleChoice exercise={exercise} />);
    await user.click(screen.getByText("Goodbye"));
    expect(screen.getByText("Incorrect")).toBeInTheDocument();
  });

  it("disables options after an answer is selected", async () => {
    const user = userEvent.setup();
    render(<MultipleChoice exercise={exercise} />);
    await user.click(screen.getByText("Goodbye"));
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/exercises/__tests__/MultipleChoice.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 4: Implement MultipleChoice**

```tsx
// src/components/exercises/MultipleChoice.tsx
import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { clsx } from "clsx";
import type { McqExercise } from "./exercises.types";

type Props = {
  exercise: McqExercise;
};

export default function MultipleChoice({ exercise }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const answered = selectedId !== null;
  const isCorrect = selectedId === exercise.correctOptionId;

  return (
    <div className="space-y-4">
      <p className="text-base font-medium text-semantic-text">
        {exercise.question}
      </p>
      <div className="space-y-2">
        {exercise.options.map((option) => {
          const isSelected = option.id === selectedId;
          const isCorrectOption = option.id === exercise.correctOptionId;

          return (
            <button
              key={option.id}
              type="button"
              disabled={answered}
              onClick={() => setSelectedId(option.id)}
              className={clsx(
                "w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors",
                !answered && "border-semantic-border bg-semantic-surface hover:bg-semantic-surface-2 text-semantic-text",
                answered && isSelected && isCorrect && "border-semantic-success bg-semantic-success/10 text-semantic-success",
                answered && isSelected && !isCorrect && "border-red-400 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-400",
                answered && !isSelected && isCorrectOption && "border-semantic-success/50 bg-semantic-success/5 text-semantic-text",
                answered && !isSelected && !isCorrectOption && "border-semantic-border bg-semantic-surface text-semantic-text-muted opacity-60",
              )}
            >
              {option.text}
            </button>
          );
        })}
      </div>
      {answered && (
        <div
          className={clsx(
            "flex items-center gap-2 text-sm font-medium",
            isCorrect ? "text-semantic-success" : "text-red-600 dark:text-red-400",
          )}
        >
          {isCorrect ? (
            <>
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
              Correct!
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" aria-hidden="true" />
              Incorrect
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run MultipleChoice test**

Run: `npx vitest run src/components/exercises/__tests__/MultipleChoice.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 6: Write FillBlank test**

```tsx
// src/components/exercises/__tests__/FillBlank.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FillBlank from "../FillBlank";
import type { FillBlankExercise } from "../exercises.types";

const exercise: FillBlankExercise = {
  id: "fb-1",
  beforeBlank: "She",
  afterBlank: "a teacher.",
  correctAnswer: "is",
  acceptableAnswers: ["is"],
};

describe("FillBlank", () => {
  it("renders the sentence parts and an input", () => {
    render(<FillBlank exercise={exercise} />);
    expect(screen.getByText("She")).toBeInTheDocument();
    expect(screen.getByText("a teacher.")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("shows correct feedback for the right answer", async () => {
    const user = userEvent.setup();
    render(<FillBlank exercise={exercise} />);
    await user.type(screen.getByRole("textbox"), "is");
    await user.click(screen.getByRole("button", { name: /check/i }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("shows incorrect feedback for a wrong answer", async () => {
    const user = userEvent.setup();
    render(<FillBlank exercise={exercise} />);
    await user.type(screen.getByRole("textbox"), "are");
    await user.click(screen.getByRole("button", { name: /check/i }));
    expect(screen.getByText("Incorrect")).toBeInTheDocument();
  });

  it("is case-insensitive", async () => {
    const user = userEvent.setup();
    render(<FillBlank exercise={exercise} />);
    await user.type(screen.getByRole("textbox"), "Is");
    await user.click(screen.getByRole("button", { name: /check/i }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run src/components/exercises/__tests__/FillBlank.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 8: Implement FillBlank**

```tsx
// src/components/exercises/FillBlank.tsx
import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { clsx } from "clsx";
import type { FillBlankExercise } from "./exercises.types";

type Props = {
  exercise: FillBlankExercise;
};

export default function FillBlank({ exercise }: Props) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const allAcceptable = [
    exercise.correctAnswer,
    ...(exercise.acceptableAnswers ?? []),
  ];
  const isCorrect = allAcceptable.some(
    (a) => a.toLowerCase().trim() === value.toLowerCase().trim(),
  );

  function handleSubmit() {
    if (value.trim() === "") return;
    setSubmitted(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-base text-semantic-text">
        <span>{exercise.beforeBlank}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={submitted}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          className={clsx(
            "w-32 px-3 py-1.5 rounded-lg border text-center text-sm font-medium",
            !submitted && "border-semantic-border bg-semantic-surface text-semantic-text focus:border-primary-500 focus:ring-1 focus:ring-primary-500",
            submitted && isCorrect && "border-semantic-success bg-semantic-success/10 text-semantic-success",
            submitted && !isCorrect && "border-red-400 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-400",
          )}
          placeholder="..."
        />
        <span>{exercise.afterBlank}</span>
      </div>
      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={value.trim() === ""}
          className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Check
        </button>
      )}
      {submitted && (
        <div
          className={clsx(
            "flex items-center gap-2 text-sm font-medium",
            isCorrect ? "text-semantic-success" : "text-red-600 dark:text-red-400",
          )}
        >
          {isCorrect ? (
            <>
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
              Correct!
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" aria-hidden="true" />
              Incorrect
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 9: Run FillBlank test**

Run: `npx vitest run src/components/exercises/__tests__/FillBlank.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 10: Run typecheck**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add src/components/exercises/
git commit -m "feat(exercises): add shared MultipleChoice and FillBlank components"
```

---

## Task 3: Progress Store

**Files:**
- Create: `src/features/lessons/useLessonProgressStore.ts`
- Test: `src/features/lessons/__tests__/useLessonProgressStore.test.ts`

- [ ] **Step 1: Write progress store tests**

```ts
// src/features/lessons/__tests__/useLessonProgressStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useLessonProgressStore } from "../useLessonProgressStore";

describe("useLessonProgressStore", () => {
  beforeEach(() => {
    useLessonProgressStore.setState({
      progress: {},
      lastVisitedSectionKey: {},
    });
  });

  it("returns default progress for unknown keys", () => {
    const result = useLessonProgressStore
      .getState()
      .getSectionProgress("unit-1", "overview");
    expect(result).toEqual({ visited: false, completed: false });
  });

  it("marks a section as visited", () => {
    useLessonProgressStore.getState().markVisited("unit-1", "overview");
    const result = useLessonProgressStore
      .getState()
      .getSectionProgress("unit-1", "overview");
    expect(result.visited).toBe(true);
    expect(result.completed).toBe(false);
  });

  it("toggles completion on and off", () => {
    const store = useLessonProgressStore.getState();
    store.toggleCompleted("unit-1", "grammar");
    expect(
      useLessonProgressStore.getState().getSectionProgress("unit-1", "grammar")
        .completed,
    ).toBe(true);

    useLessonProgressStore.getState().toggleCompleted("unit-1", "grammar");
    expect(
      useLessonProgressStore.getState().getSectionProgress("unit-1", "grammar")
        .completed,
    ).toBe(false);
  });

  it("sets and retrieves lastVisitedSectionKey", () => {
    useLessonProgressStore.getState().setLastVisited("unit-1", "vocabulary");
    expect(
      useLessonProgressStore.getState().lastVisitedSectionKey["unit-1"],
    ).toBe("vocabulary");
  });

  it("overwrites lastVisitedSectionKey on subsequent visits", () => {
    const store = useLessonProgressStore.getState();
    store.setLastVisited("unit-1", "overview");
    useLessonProgressStore.getState().setLastVisited("unit-1", "grammar");
    expect(
      useLessonProgressStore.getState().lastVisitedSectionKey["unit-1"],
    ).toBe("grammar");
  });

  it("calculates unit completion percent", () => {
    const sections = [
      { key: "overview" as const, title: "Overview", estimatedMinutes: 3 },
      { key: "grammar" as const, title: "Grammar", estimatedMinutes: 8 },
      { key: "vocabulary" as const, title: "Vocabulary", estimatedMinutes: 5 },
      { key: "dialogues" as const, title: "Dialogues", estimatedMinutes: 6 },
      { key: "activities" as const, title: "Activities", estimatedMinutes: 8 },
    ];

    // 0 of 5 completed
    expect(
      useLessonProgressStore
        .getState()
        .getUnitCompletionPercent("unit-1", sections),
    ).toBe(0);

    // 2 of 5 completed = 40%
    useLessonProgressStore.getState().toggleCompleted("unit-1", "overview");
    useLessonProgressStore.getState().toggleCompleted("unit-1", "grammar");
    expect(
      useLessonProgressStore
        .getState()
        .getUnitCompletionPercent("unit-1", sections),
    ).toBe(40);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/lessons/__tests__/useLessonProgressStore.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement progress store**

```ts
// src/features/lessons/useLessonProgressStore.ts
import { create } from "zustand";
import type { SectionKey, SectionMeta } from "./lesson.types";

export type SectionProgress = {
  visited: boolean;
  completed: boolean;
};

type LessonProgressState = {
  progress: Record<string, SectionProgress>;
  lastVisitedSectionKey: Record<string, SectionKey>;

  markVisited: (unitSlug: string, sectionKey: SectionKey) => void;
  toggleCompleted: (unitSlug: string, sectionKey: SectionKey) => void;
  setLastVisited: (unitSlug: string, sectionKey: SectionKey) => void;
  getSectionProgress: (
    unitSlug: string,
    sectionKey: SectionKey,
  ) => SectionProgress;
  getUnitCompletionPercent: (
    unitSlug: string,
    sections: SectionMeta[],
  ) => number;
};

const DEFAULT_PROGRESS: SectionProgress = {
  visited: false,
  completed: false,
};

function makeKey(unitSlug: string, sectionKey: SectionKey): string {
  return `${unitSlug}:${sectionKey}`;
}

export const useLessonProgressStore = create<LessonProgressState>(
  (set, get) => ({
    progress: {},
    lastVisitedSectionKey: {},

    markVisited: (unitSlug, sectionKey) => {
      const key = makeKey(unitSlug, sectionKey);
      set((state) => ({
        progress: {
          ...state.progress,
          [key]: { ...DEFAULT_PROGRESS, ...state.progress[key], visited: true },
        },
      }));
    },

    toggleCompleted: (unitSlug, sectionKey) => {
      const key = makeKey(unitSlug, sectionKey);
      set((state) => {
        const current = state.progress[key] ?? DEFAULT_PROGRESS;
        return {
          progress: {
            ...state.progress,
            [key]: { ...current, completed: !current.completed },
          },
        };
      });
    },

    setLastVisited: (unitSlug, sectionKey) => {
      set((state) => ({
        lastVisitedSectionKey: {
          ...state.lastVisitedSectionKey,
          [unitSlug]: sectionKey,
        },
      }));
    },

    getSectionProgress: (unitSlug, sectionKey) => {
      const key = makeKey(unitSlug, sectionKey);
      return get().progress[key] ?? DEFAULT_PROGRESS;
    },

    getUnitCompletionPercent: (unitSlug, sections) => {
      if (sections.length === 0) return 0;
      const completed = sections.filter(
        (s) => get().getSectionProgress(unitSlug, s.key).completed,
      ).length;
      return Math.round((completed / sections.length) * 100);
    },
  }),
);
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/features/lessons/__tests__/useLessonProgressStore.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Run typecheck**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/lessons/useLessonProgressStore.ts src/features/lessons/__tests__/useLessonProgressStore.test.ts
git commit -m "feat(lessons): add Zustand progress store with visited/completed tracking"
```

---

## Task 4: Data Layer — Units + Section Registry

**Files:**
- Create: `src/features/lessons/data/units.ts`
- Create: `src/features/lessons/data/sectionRegistry.ts`
- Create: `src/features/lessons/data/getUnit.ts`
- Create: `src/features/lessons/data/getSection.ts`
- Test: `src/features/lessons/__tests__/data.test.ts`

- [ ] **Step 1: Create units.ts (moved + extended)**

```ts
// src/features/lessons/data/units.ts
import type { Unit } from "../lesson.types";

export const units: Unit[] = [
  {
    slug: "unit-1",
    number: 1,
    title: "To Be: Introduction",
    topic: "Personal information & meeting people",
    grammarFocus: "Present tense of 'to be' (am / is / are)",
    estimatedMinutes: 30,
    status: "available",
    sections: [
      { key: "overview", title: "Overview", estimatedMinutes: 3 },
      { key: "grammar", title: "Grammar", estimatedMinutes: 8 },
      { key: "vocabulary", title: "Vocabulary", estimatedMinutes: 5 },
      { key: "dialogues", title: "Dialogues", estimatedMinutes: 6 },
      { key: "activities", title: "Activities", estimatedMinutes: 8 },
    ],
  },
  {
    slug: "unit-2",
    number: 2,
    title: "To Be: Yes/No Questions",
    topic: "Classroom, countries, nationalities",
    grammarFocus: "Subject pronouns & singular/plural 'to be'",
    estimatedMinutes: 45,
    status: "coming-soon",
    sections: [],
  },
  {
    slug: "unit-3",
    number: 3,
    title: "Present Continuous Tense",
    topic: "Everyday activities",
    grammarFocus: "Present continuous (am/is/are + -ing)",
    estimatedMinutes: 45,
    status: "coming-soon",
    sections: [],
  },
  {
    slug: "unit-4",
    number: 4,
    title: "To Be: Short Answers & Possessive Adjectives",
    topic: "Family members & descriptions",
    grammarFocus: "Possessive adjectives (my, your, his, her…)",
    estimatedMinutes: 45,
    status: "coming-soon",
    sections: [],
  },
];
```

- [ ] **Step 2: Create sectionRegistry.ts (empty for now — populated in Task 5)**

```ts
// src/features/lessons/data/sectionRegistry.ts
import type { Section } from "../lesson.types";

const registry: Record<string, Section> = {};

export function registerSection(section: Section): void {
  const key = `${section.unitSlug}:${section.key}`;
  registry[key] = section;
}

export function lookupSection(
  unitSlug: string,
  sectionKey: string,
): Section | undefined {
  return registry[`${unitSlug}:${sectionKey}`];
}
```

- [ ] **Step 3: Create getUnit.ts**

```ts
// src/features/lessons/data/getUnit.ts
import type { Unit } from "../lesson.types";
import { units } from "./units";

export function getUnit(slug: string): Unit | undefined {
  return units.find((u) => u.slug === slug);
}
```

- [ ] **Step 4: Create getSection.ts**

```ts
// src/features/lessons/data/getSection.ts
import type { Section, SectionKey } from "../lesson.types";
import { lookupSection } from "./sectionRegistry";

export function getSection(
  unitSlug: string,
  sectionKey: SectionKey,
): Section | undefined {
  return lookupSection(unitSlug, sectionKey);
}
```

- [ ] **Step 5: Write data layer tests**

```ts
// src/features/lessons/__tests__/data.test.ts
import { describe, it, expect } from "vitest";
import { getUnit } from "../data/getUnit";
import { getSection } from "../data/getSection";
import { registerSection } from "../data/sectionRegistry";
import type { Section } from "../lesson.types";

describe("getUnit", () => {
  it("returns unit-1 by slug", () => {
    const unit = getUnit("unit-1");
    expect(unit).toBeDefined();
    expect(unit!.slug).toBe("unit-1");
    expect(unit!.sections).toHaveLength(5);
  });

  it("returns undefined for unknown slug", () => {
    expect(getUnit("unit-99")).toBeUndefined();
  });

  it("returns coming-soon units", () => {
    const unit = getUnit("unit-2");
    expect(unit).toBeDefined();
    expect(unit!.status).toBe("coming-soon");
    expect(unit!.sections).toHaveLength(0);
  });
});

describe("getSection + sectionRegistry", () => {
  const mockSection: Section = {
    id: "test-section",
    unitSlug: "unit-1",
    key: "overview",
    title: "Overview",
    blocks: [],
  };

  it("returns undefined before registration", () => {
    expect(getSection("unit-1", "grammar")).toBeUndefined();
  });

  it("returns section after registration", () => {
    registerSection(mockSection);
    const result = getSection("unit-1", "overview");
    expect(result).toBeDefined();
    expect(result!.id).toBe("test-section");
  });
});
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/features/lessons/__tests__/data.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 7: Run typecheck**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/features/lessons/data/
git commit -m "feat(lessons): add data layer with units, section registry, and accessors"
```

---

## Task 5: Unit 1 Content + Exercise Data

**Files:**
- Create: `src/features/lessons/data/sections/unit-1/overview.ts`
- Create: `src/features/lessons/data/sections/unit-1/vocabulary.ts`
- Create: `src/features/lessons/data/sections/unit-1/grammar.ts`
- Create: `src/features/lessons/data/sections/unit-1/dialogues.ts`
- Create: `src/features/lessons/data/sections/unit-1/activities.ts`
- Create: `src/features/lessons/data/exercises/unit-1.ts`
- Modify: `src/features/lessons/data/sectionRegistry.ts`

- [ ] **Step 1: Create exercises/unit-1.ts**

```ts
// src/features/lessons/data/exercises/unit-1.ts
import type { McqExercise, FillBlankExercise } from "@/components/exercises/exercises.types";

export const grammarMcq1: McqExercise = {
  id: "u1-grammar-mcq-1",
  question: "Choose the correct form: 'She ___ a student.'",
  options: [
    { id: "a", text: "am" },
    { id: "b", text: "is" },
    { id: "c", text: "are" },
  ],
  correctOptionId: "b",
};

export const activitiesFillBlank1: FillBlankExercise = {
  id: "u1-activities-fb-1",
  beforeBlank: "They",
  afterBlank: "from Thailand.",
  correctAnswer: "are",
  acceptableAnswers: ["are", "'re"],
};
```

- [ ] **Step 2: Create sections/unit-1/overview.ts (real content)**

```ts
// src/features/lessons/data/sections/unit-1/overview.ts
import type { Section } from "../../lesson.types";
import { registerSection } from "../sectionRegistry";

const overview: Section = {
  id: "u1-overview",
  unitSlug: "unit-1",
  key: "overview",
  title: "Overview",
  blocks: [
    {
      id: "u1-ov-1",
      type: "heading",
      content: "What you'll learn",
    },
    {
      id: "u1-ov-2",
      type: "text",
      content:
        "In this unit, you'll learn how to introduce yourself, greet people, and share basic personal information using the present tense of 'to be' (am, is, are).",
    },
    {
      id: "u1-ov-3",
      type: "callout",
      variant: "tip",
      content:
        "These are some of the most common phrases in English. You'll use them every day!",
    },
    {
      id: "u1-ov-4",
      type: "heading",
      content: "Real-world context",
    },
    {
      id: "u1-ov-5",
      type: "text",
      content:
        "Meeting new people at work, introducing yourself at school, filling out a simple form, or starting a conversation with a stranger — all of these situations use the patterns you'll practice here.",
    },
    {
      id: "u1-ov-6",
      type: "heading",
      content: "Key phrases",
    },
    {
      id: "u1-ov-7",
      type: "examples",
      items: [
        { english: "Hello, my name is Somchai.", translation: "สวัสดีครับ ผมชื่อสมชาย" },
        { english: "I am from Thailand.", translation: "ผมมาจากประเทศไทย" },
        { english: "She is a teacher.", translation: "เธอเป็นครู" },
        { english: "We are students.", translation: "พวกเราเป็นนักเรียน" },
        { english: "Nice to meet you.", translation: "ยินดีที่ได้รู้จัก" },
      ],
    },
  ],
};

registerSection(overview);

export default overview;
```

- [ ] **Step 3: Create sections/unit-1/vocabulary.ts (real content)**

```ts
// src/features/lessons/data/sections/unit-1/vocabulary.ts
import type { Section } from "../../lesson.types";
import { registerSection } from "../sectionRegistry";

const vocabulary: Section = {
  id: "u1-vocabulary",
  unitSlug: "unit-1",
  key: "vocabulary",
  title: "Vocabulary",
  blocks: [
    {
      id: "u1-vocab-1",
      type: "heading",
      content: "Key words for introductions",
    },
    {
      id: "u1-vocab-2",
      type: "text",
      content: "Learn these common words and phrases used when meeting people for the first time.",
    },
    {
      id: "u1-vocab-3",
      type: "vocab-list",
      items: [
        { word: "hello", translation: "สวัสดี", phonetic: "sa-wat-dee", example: "Hello, how are you?" },
        { word: "name", translation: "ชื่อ", phonetic: "cheu", example: "My name is Lin." },
        { word: "teacher", translation: "ครู", phonetic: "kroo", example: "She is a teacher." },
        { word: "student", translation: "นักเรียน", phonetic: "nak-rian", example: "I am a student." },
        { word: "friend", translation: "เพื่อน", phonetic: "pheuan", example: "He is my friend." },
        { word: "country", translation: "ประเทศ", phonetic: "pra-thet", example: "What country are you from?" },
        { word: "from", translation: "จาก", phonetic: "jaak", example: "I am from Bangkok." },
        { word: "nice", translation: "ดี", phonetic: "dee", example: "Nice to meet you." },
        { word: "thank you", translation: "ขอบคุณ", phonetic: "khop-khun", example: "Thank you very much." },
        { word: "yes", translation: "ใช่", phonetic: "chai", example: "Yes, I am a student." },
      ],
    },
  ],
};

registerSection(vocabulary);

export default vocabulary;
```

- [ ] **Step 4: Create sections/unit-1/grammar.ts (placeholder + 1 MCQ)**

```ts
// src/features/lessons/data/sections/unit-1/grammar.ts
import type { Section } from "../../lesson.types";
import { registerSection } from "../sectionRegistry";

const grammar: Section = {
  id: "u1-grammar",
  unitSlug: "unit-1",
  key: "grammar",
  title: "Grammar",
  blocks: [
    {
      id: "u1-gr-1",
      type: "heading",
      content: "Present tense of 'to be'",
    },
    {
      id: "u1-gr-2",
      type: "text",
      content:
        "The verb 'to be' is one of the most important verbs in English. It changes form depending on the subject: I am, you are, he/she/it is, we are, they are.",
    },
    {
      id: "u1-gr-3",
      type: "examples",
      items: [
        { english: "I am happy.", translation: "ฉันมีความสุข" },
        { english: "You are tall.", translation: "คุณสูง" },
        { english: "He is from Japan.", translation: "เขามาจากญี่ปุ่น" },
      ],
    },
    {
      id: "u1-gr-4",
      type: "callout",
      variant: "note",
      content:
        "In casual speech, English speakers often use contractions: I'm, you're, he's, she's, we're, they're.",
    },
    {
      id: "u1-gr-5",
      type: "heading",
      content: "Quick check",
    },
    {
      id: "u1-gr-6",
      type: "exercise",
      exerciseType: "multiple-choice",
      exerciseId: "u1-grammar-mcq-1",
    },
  ],
};

registerSection(grammar);

export default grammar;
```

- [ ] **Step 5: Create sections/unit-1/dialogues.ts (placeholder)**

```ts
// src/features/lessons/data/sections/unit-1/dialogues.ts
import type { Section } from "../../lesson.types";
import { registerSection } from "../sectionRegistry";

const dialogues: Section = {
  id: "u1-dialogues",
  unitSlug: "unit-1",
  key: "dialogues",
  title: "Dialogues",
  blocks: [
    {
      id: "u1-dl-1",
      type: "heading",
      content: "Meeting someone new",
    },
    {
      id: "u1-dl-2",
      type: "text",
      content: "Read through this conversation between two people meeting for the first time.",
    },
    {
      id: "u1-dl-3",
      type: "dialogue",
      lines: [
        { speaker: "Anna", text: "Hello! My name is Anna.", translation: "สวัสดี! ฉันชื่ออันนา" },
        { speaker: "Somchai", text: "Hi Anna. I am Somchai.", translation: "สวัสดีอันนา ผมชื่อสมชาย" },
        { speaker: "Anna", text: "Nice to meet you. Are you a student?", translation: "ยินดีที่ได้รู้จัก คุณเป็นนักเรียนหรือ?" },
        { speaker: "Somchai", text: "Yes, I am. I am from Thailand.", translation: "ใช่ครับ ผมมาจากประเทศไทย" },
        { speaker: "Anna", text: "That is great! I am from Germany.", translation: "ดีมาก! ฉันมาจากเยอรมนี" },
      ],
    },
  ],
};

registerSection(dialogues);

export default dialogues;
```

- [ ] **Step 6: Create sections/unit-1/activities.ts (placeholder + 1 fill-blank)**

```ts
// src/features/lessons/data/sections/unit-1/activities.ts
import type { Section } from "../../lesson.types";
import { registerSection } from "../sectionRegistry";

const activities: Section = {
  id: "u1-activities",
  unitSlug: "unit-1",
  key: "activities",
  title: "Activities",
  blocks: [
    {
      id: "u1-act-1",
      type: "heading",
      content: "Practice what you've learned",
    },
    {
      id: "u1-act-2",
      type: "text",
      content: "Complete the exercises below to reinforce what you learned in this unit.",
    },
    {
      id: "u1-act-3",
      type: "callout",
      variant: "tip",
      content: "Try to answer from memory before looking back at the grammar section.",
    },
    {
      id: "u1-act-4",
      type: "exercise",
      exerciseType: "fill-blank",
      exerciseId: "u1-activities-fb-1",
    },
  ],
};

registerSection(activities);

export default activities;
```

- [ ] **Step 7: Update sectionRegistry.ts to import all sections**

```ts
// src/features/lessons/data/sectionRegistry.ts
import type { Section } from "../lesson.types";

const registry: Record<string, Section> = {};

export function registerSection(section: Section): void {
  const key = `${section.unitSlug}:${section.key}`;
  registry[key] = section;
}

export function lookupSection(
  unitSlug: string,
  sectionKey: string,
): Section | undefined {
  return registry[`${unitSlug}:${sectionKey}`];
}

// Import all section files — each calls registerSection() on load
import "./sections/unit-1/overview";
import "./sections/unit-1/grammar";
import "./sections/unit-1/vocabulary";
import "./sections/unit-1/dialogues";
import "./sections/unit-1/activities";
```

- [ ] **Step 8: Run typecheck**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 9: Run existing data tests to confirm registry works**

Run: `npx vitest run src/features/lessons/__tests__/data.test.ts`
Expected: PASS — the `registerSection` test still passes, and now real sections are also registered

- [ ] **Step 10: Commit**

```bash
git add src/features/lessons/data/
git commit -m "feat(lessons): add Unit 1 content, exercises, and section registry"
```

---

## Task 6: Block Components

**Files:**
- Create: `src/features/lessons/components/blocks/TextBlock.tsx`
- Create: `src/features/lessons/components/blocks/HeadingBlock.tsx`
- Create: `src/features/lessons/components/blocks/ExamplesBlock.tsx`
- Create: `src/features/lessons/components/blocks/VocabListBlock.tsx`
- Create: `src/features/lessons/components/blocks/DialogueBlock.tsx`
- Create: `src/features/lessons/components/blocks/CalloutBlock.tsx`
- Create: `src/features/lessons/components/blocks/ExerciseBlock.tsx`
- Create: `src/features/lessons/components/SectionRenderer.tsx`
- Test: `src/features/lessons/__tests__/SectionRenderer.test.tsx`

- [ ] **Step 1: Create TextBlock.tsx**

```tsx
// src/features/lessons/components/blocks/TextBlock.tsx

type Props = { content: string };

export default function TextBlock({ content }: Props) {
  return (
    <p className="text-base leading-relaxed text-semantic-text">{content}</p>
  );
}
```

- [ ] **Step 2: Create HeadingBlock.tsx**

```tsx
// src/features/lessons/components/blocks/HeadingBlock.tsx

type Props = { content: string };

export default function HeadingBlock({ content }: Props) {
  return (
    <h2 className="text-xl font-semibold text-semantic-text mt-2">
      {content}
    </h2>
  );
}
```

- [ ] **Step 3: Create ExamplesBlock.tsx**

```tsx
// src/features/lessons/components/blocks/ExamplesBlock.tsx
import type { ExampleItem } from "../../lesson.types";

type Props = { items: ExampleItem[] };

export default function ExamplesBlock({ items }: Props) {
  return (
    <div className="rounded-lg bg-semantic-surface-2 p-4 space-y-3">
      {items.map((item, i) => (
        <div key={i} className="space-y-0.5">
          <p className="text-base text-semantic-text">{item.english}</p>
          <p className="text-sm text-semantic-text-muted">{item.translation}</p>
          {item.note && (
            <p className="text-xs text-semantic-subtle italic">{item.note}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create VocabListBlock.tsx**

```tsx
// src/features/lessons/components/blocks/VocabListBlock.tsx
import { useState } from "react";
import { clsx } from "clsx";
import type { VocabItem } from "../../lesson.types";

function VocabCard({ item }: { item: VocabItem }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setFlipped(!flipped)}
      className="w-full text-left card card-interactive p-4 min-h-[100px] flex flex-col justify-center"
    >
      {!flipped ? (
        <>
          <p className="text-lg font-semibold text-semantic-text">
            {item.word}
          </p>
          {item.phonetic && (
            <p className="text-xs text-semantic-subtle mt-1">
              /{item.phonetic}/
            </p>
          )}
          <p className="text-xs text-semantic-text-muted mt-2">
            Tap to reveal
          </p>
        </>
      ) : (
        <>
          <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
            {item.translation}
          </p>
          {item.example && (
            <p className="text-sm text-semantic-text-muted mt-2 italic">
              "{item.example}"
            </p>
          )}
        </>
      )}
    </button>
  );
}

type Props = { items: VocabItem[] };

export default function VocabListBlock({ items }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <VocabCard key={i} item={item} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create DialogueBlock.tsx**

```tsx
// src/features/lessons/components/blocks/DialogueBlock.tsx
import { clsx } from "clsx";
import type { DialogueLine } from "../../lesson.types";

type Props = { lines: DialogueLine[] };

export default function DialogueBlock({ lines }: Props) {
  return (
    <div className="space-y-3">
      {lines.map((line, i) => (
        <div
          key={i}
          className={clsx(
            "max-w-[85%] rounded-lg p-3",
            i % 2 === 0
              ? "bg-primary-500/10 mr-auto"
              : "bg-semantic-surface-2 ml-auto",
          )}
        >
          <p className="text-xs font-semibold text-semantic-text-muted mb-1">
            {line.speaker}
          </p>
          <p className="text-base text-semantic-text">{line.text}</p>
          <p className="text-sm text-semantic-text-muted mt-1">
            {line.translation}
          </p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create CalloutBlock.tsx**

```tsx
// src/features/lessons/components/blocks/CalloutBlock.tsx
import { Lightbulb, Info, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

type Props = { variant: "tip" | "note" | "warning"; content: string };

const VARIANT_STYLES = {
  tip: {
    border: "border-primary-400 dark:border-primary-500",
    bg: "bg-primary-50 dark:bg-primary-900/20",
    text: "text-primary-800 dark:text-primary-300",
    icon: Lightbulb,
  },
  note: {
    border: "border-accent-400 dark:border-accent-500",
    bg: "bg-accent-50 dark:bg-accent-900/20",
    text: "text-accent-800 dark:text-accent-300",
    icon: Info,
  },
  warning: {
    border: "border-amber-400 dark:border-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-800 dark:text-amber-300",
    icon: AlertTriangle,
  },
};

export default function CalloutBlock({ variant, content }: Props) {
  const style = VARIANT_STYLES[variant];
  const Icon = style.icon;

  return (
    <div
      className={clsx(
        "flex items-start gap-3 rounded-lg border-l-4 p-4",
        style.border,
        style.bg,
      )}
    >
      <Icon
        className={clsx("w-5 h-5 flex-shrink-0 mt-0.5", style.text)}
        aria-hidden="true"
      />
      <p className={clsx("text-sm", style.text)}>{content}</p>
    </div>
  );
}
```

- [ ] **Step 7: Create ExerciseBlock.tsx**

```tsx
// src/features/lessons/components/blocks/ExerciseBlock.tsx
import MultipleChoice from "@/components/exercises/MultipleChoice";
import FillBlank from "@/components/exercises/FillBlank";
import type { ExerciseType } from "../../lesson.types";
import * as unit1Exercises from "../../data/exercises/unit-1";
import type { McqExercise, FillBlankExercise } from "@/components/exercises/exercises.types";

type Props = {
  exerciseType: ExerciseType;
  exerciseId: string;
};

const exerciseMap: Record<string, McqExercise | FillBlankExercise> = {
  "u1-grammar-mcq-1": unit1Exercises.grammarMcq1,
  "u1-activities-fb-1": unit1Exercises.activitiesFillBlank1,
};

export default function ExerciseBlock({ exerciseType, exerciseId }: Props) {
  const exercise = exerciseMap[exerciseId];

  if (!exercise) {
    return (
      <div className="card p-4 opacity-60">
        <p className="text-sm text-semantic-text-muted">
          Exercise not found.
        </p>
      </div>
    );
  }

  if (exerciseType === "match") {
    return (
      <div className="card p-6 opacity-60 text-center">
        <p className="text-sm font-medium text-semantic-text-muted">
          Coming soon
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6 shadow-sm border border-semantic-border">
      {exerciseType === "multiple-choice" && (
        <MultipleChoice exercise={exercise as McqExercise} />
      )}
      {exerciseType === "fill-blank" && (
        <FillBlank exercise={exercise as FillBlankExercise} />
      )}
    </div>
  );
}
```

- [ ] **Step 8: Create SectionRenderer.tsx**

```tsx
// src/features/lessons/components/SectionRenderer.tsx
import type { Section, SectionBlock } from "../lesson.types";
import TextBlock from "./blocks/TextBlock";
import HeadingBlock from "./blocks/HeadingBlock";
import ExamplesBlock from "./blocks/ExamplesBlock";
import VocabListBlock from "./blocks/VocabListBlock";
import DialogueBlock from "./blocks/DialogueBlock";
import CalloutBlock from "./blocks/CalloutBlock";
import ExerciseBlock from "./blocks/ExerciseBlock";

function renderBlock(block: SectionBlock) {
  switch (block.type) {
    case "text":
      return <TextBlock content={block.content} />;
    case "heading":
      return <HeadingBlock content={block.content} />;
    case "examples":
      return <ExamplesBlock items={block.items} />;
    case "vocab-list":
      return <VocabListBlock items={block.items} />;
    case "dialogue":
      return <DialogueBlock lines={block.lines} />;
    case "callout":
      return <CalloutBlock variant={block.variant} content={block.content} />;
    case "exercise":
      return (
        <ExerciseBlock
          exerciseType={block.exerciseType}
          exerciseId={block.exerciseId}
        />
      );
    default:
      return null;
  }
}

type Props = {
  section: Section;
};

export default function SectionRenderer({ section }: Props) {
  return (
    <div className="space-y-6">
      {section.blocks.map((block) => (
        <div key={block.id}>{renderBlock(block)}</div>
      ))}
    </div>
  );
}
```

- [ ] **Step 9: Write SectionRenderer test**

```tsx
// src/features/lessons/__tests__/SectionRenderer.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SectionRenderer from "../components/SectionRenderer";
import type { Section } from "../lesson.types";

const testSection: Section = {
  id: "test",
  unitSlug: "unit-1",
  key: "overview",
  title: "Test Section",
  blocks: [
    { id: "b1", type: "heading", content: "Test Heading" },
    { id: "b2", type: "text", content: "Some paragraph text." },
    {
      id: "b3",
      type: "examples",
      items: [{ english: "Hello", translation: "สวัสดี" }],
    },
    { id: "b4", type: "callout", variant: "tip", content: "A helpful tip." },
  ],
};

describe("SectionRenderer", () => {
  it("renders heading blocks", () => {
    render(<SectionRenderer section={testSection} />);
    expect(screen.getByText("Test Heading")).toBeInTheDocument();
  });

  it("renders text blocks", () => {
    render(<SectionRenderer section={testSection} />);
    expect(screen.getByText("Some paragraph text.")).toBeInTheDocument();
  });

  it("renders example items", () => {
    render(<SectionRenderer section={testSection} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("สวัสดี")).toBeInTheDocument();
  });

  it("renders callout blocks", () => {
    render(<SectionRenderer section={testSection} />);
    expect(screen.getByText("A helpful tip.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Run SectionRenderer test**

Run: `npx vitest run src/features/lessons/__tests__/SectionRenderer.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 11: Run typecheck**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 12: Commit**

```bash
git add src/features/lessons/components/
git commit -m "feat(lessons): add block components and SectionRenderer"
```

---

## Task 7: i18n Keys

**Files:**
- Modify: `src/locales/en/en.json`
- Modify: `src/locales/th/th.json`
- Modify: `src/locales/vi/vi.json`

- [ ] **Step 1: Extend English locale**

Add/update the `lessons` key in `src/locales/en/en.json`. Keep all existing keys and add new ones:

```json
{
  "lessons": {
    "title": "Lessons",
    "subtitle": "Structured English lessons, one unit at a time",
    "unitShort": "Unit {{number}}",
    "status": {
      "available": "Available",
      "comingSoon": "Coming soon",
      "locked": "Locked"
    },
    "card": {
      "estMinutes": "~{{count}} min"
    },
    "notFound": "Unit not found",
    "sectionNotFound": "Section not found",
    "comingSoonMessage": "This unit isn't ready yet. Check back soon.",
    "backToLessons": "Back to lessons",
    "backToUnit": "Back to unit",
    "hub": {
      "startUnit": "Start Unit",
      "continue": "Continue",
      "reviewUnit": "Review Unit"
    },
    "section": {
      "markComplete": "Mark as Complete",
      "completed": "Completed",
      "next": "Next",
      "previous": "Previous",
      "backToUnit": "Back to Unit"
    },
    "progress": {
      "notStarted": "Not started",
      "inProgress": "In progress",
      "completed": "Completed"
    },
    "detail": {
      "building_title": "This unit is being built.",
      "building_subtitle": "The structure below shows what will be here soon.",
      "outline_heading": "Coming in this unit",
      "sections": {
        "overview": "Overview",
        "grammar": "Grammar",
        "vocabulary": "Vocabulary",
        "dialogues": "Dialogues",
        "activities": "Practice activities"
      }
    }
  }
}
```

- [ ] **Step 2: Extend Thai locale**

Add the same keys to `src/locales/th/th.json` with Thai translations:

```json
{
  "lessons": {
    "title": "บทเรียน",
    "subtitle": "บทเรียนภาษาอังกฤษแบบมีโครงสร้าง ทีละบท",
    "unitShort": "บทที่ {{number}}",
    "status": {
      "available": "พร้อมใช้งาน",
      "comingSoon": "เร็วๆ นี้",
      "locked": "ล็อค"
    },
    "card": {
      "estMinutes": "~{{count}} นาที"
    },
    "notFound": "ไม่พบบทเรียน",
    "sectionNotFound": "ไม่พบหัวข้อ",
    "comingSoonMessage": "บทเรียนนี้ยังไม่พร้อม กรุณากลับมาใหม่เร็วๆ นี้",
    "backToLessons": "กลับไปที่บทเรียน",
    "backToUnit": "กลับไปที่บท",
    "hub": {
      "startUnit": "เริ่มบทเรียน",
      "continue": "ดำเนินต่อ",
      "reviewUnit": "ทบทวนบทเรียน"
    },
    "section": {
      "markComplete": "ทำเครื่องหมายว่าเสร็จ",
      "completed": "เสร็จแล้ว",
      "next": "ถัดไป",
      "previous": "ก่อนหน้า",
      "backToUnit": "กลับไปที่บท"
    },
    "progress": {
      "notStarted": "ยังไม่เริ่ม",
      "inProgress": "กำลังดำเนินการ",
      "completed": "เสร็จแล้ว"
    },
    "detail": {
      "building_title": "กำลังสร้างบทเรียนนี้",
      "building_subtitle": "โครงสร้างด้านล่างแสดงสิ่งที่จะมีเร็วๆ นี้",
      "outline_heading": "สิ่งที่จะมีในบทนี้",
      "sections": {
        "overview": "ภาพรวม",
        "grammar": "ไวยากรณ์",
        "vocabulary": "คำศัพท์",
        "dialogues": "บทสนทนา",
        "activities": "แบบฝึกหัด"
      }
    }
  }
}
```

- [ ] **Step 3: Extend Vietnamese locale**

Add the same keys to `src/locales/vi/vi.json` with Vietnamese translations:

```json
{
  "lessons": {
    "title": "Bài học",
    "subtitle": "Bài học tiếng Anh có cấu trúc, từng bài một",
    "unitShort": "Bài {{number}}",
    "status": {
      "available": "Có sẵn",
      "comingSoon": "Sắp ra mắt",
      "locked": "Đã khóa"
    },
    "card": {
      "estMinutes": "~{{count}} phút"
    },
    "notFound": "Không tìm thấy bài học",
    "sectionNotFound": "Không tìm thấy phần",
    "comingSoonMessage": "Bài học này chưa sẵn sàng. Hãy quay lại sau.",
    "backToLessons": "Quay lại bài học",
    "backToUnit": "Quay lại bài",
    "hub": {
      "startUnit": "Bắt đầu bài",
      "continue": "Tiếp tục",
      "reviewUnit": "Xem lại bài"
    },
    "section": {
      "markComplete": "Đánh dấu hoàn thành",
      "completed": "Đã hoàn thành",
      "next": "Tiếp theo",
      "previous": "Trước đó",
      "backToUnit": "Quay lại bài"
    },
    "progress": {
      "notStarted": "Chưa bắt đầu",
      "inProgress": "Đang thực hiện",
      "completed": "Đã hoàn thành"
    },
    "detail": {
      "building_title": "Bài học này đang được xây dựng.",
      "building_subtitle": "Cấu trúc bên dưới cho thấy nội dung sắp có.",
      "outline_heading": "Nội dung trong bài này",
      "sections": {
        "overview": "Tổng quan",
        "grammar": "Ngữ pháp",
        "vocabulary": "Từ vựng",
        "dialogues": "Hội thoại",
        "activities": "Bài tập"
      }
    }
  }
}
```

- [ ] **Step 4: Run typecheck**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/locales/
git commit -m "feat(i18n): add lesson section, progress, and navigation keys for en/th/vi"
```

---

## Task 8: Page Components — LessonsIndex + UnitHub + SectionPage

**Files:**
- Create: `src/features/lessons/components/UnitCard.tsx`
- Create: `src/features/lessons/components/SectionCard.tsx`
- Create: `src/features/lessons/components/SectionNav.tsx`
- Create: `src/features/lessons/pages/LessonsIndex.tsx`
- Create: `src/features/lessons/pages/UnitHub.tsx`
- Create: `src/features/lessons/pages/SectionPage.tsx`

- [ ] **Step 1: Create UnitCard.tsx**

```tsx
// src/features/lessons/components/UnitCard.tsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, Lock } from "lucide-react";
import type { Unit } from "../lesson.types";

type Props = { unit: Unit };

export default function UnitCard({ unit }: Props) {
  const { t } = useTranslation();
  const isAvailable = unit.status === "available";
  const isLocked = unit.status === "locked";

  const className = `block ${
    isAvailable
      ? "card card-interactive"
      : "card opacity-60 cursor-not-allowed"
  }`;

  const statusBadge = (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
        isAvailable
          ? "bg-semantic-success/10 text-semantic-success"
          : "bg-semantic-surface-2 text-semantic-text-muted"
      }`}
    >
      {(isLocked || !isAvailable) && (
        <Lock className="w-3 h-3" aria-hidden="true" />
      )}
      {isAvailable
        ? t("lessons.status.available")
        : isLocked
          ? t("lessons.status.locked")
          : t("lessons.status.comingSoon")}
    </span>
  );

  const content = (
    <>
      <div className="flex items-start justify-between mb-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold">
          {unit.number}
        </span>
        {statusBadge}
      </div>
      <h2 className="text-lg font-semibold text-semantic-text mb-1">
        {unit.title}
      </h2>
      <p className="text-sm text-semantic-text-muted mb-2">{unit.topic}</p>
      <p className="text-xs text-semantic-subtle mb-4">{unit.grammarFocus}</p>
      <div className="flex items-center gap-1 text-xs text-semantic-subtle">
        <Clock className="w-3 h-3" aria-hidden="true" />
        {t("lessons.card.estMinutes", { count: unit.estimatedMinutes })}
      </div>
    </>
  );

  if (isAvailable) {
    return (
      <Link to={`/lessons/${unit.slug}`} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <div className={className} aria-disabled="true">
      {content}
    </div>
  );
}
```

- [ ] **Step 2: Create SectionCard.tsx**

```tsx
// src/features/lessons/components/SectionCard.tsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Circle, CircleDot, CheckCircle, Clock } from "lucide-react";
import { clsx } from "clsx";
import type { SectionMeta } from "../lesson.types";
import type { SectionProgress } from "../useLessonProgressStore";

type Props = {
  section: SectionMeta;
  unitSlug: string;
  progress: SectionProgress;
};

export default function SectionCard({ section, unitSlug, progress }: Props) {
  const { t } = useTranslation();

  const StatusIcon = progress.completed
    ? CheckCircle
    : progress.visited
      ? CircleDot
      : Circle;

  const statusColor = progress.completed
    ? "text-accent-500"
    : progress.visited
      ? "text-semantic-text-muted"
      : "text-semantic-subtle";

  return (
    <Link
      to={`/lessons/${unitSlug}/${section.key}`}
      className="card card-interactive flex items-center gap-4 p-4"
    >
      <StatusIcon
        className={clsx("w-5 h-5 flex-shrink-0", statusColor)}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-semantic-text">
          {section.title}
        </p>
      </div>
      <div className="flex items-center gap-1 text-xs text-semantic-subtle flex-shrink-0">
        <Clock className="w-3 h-3" aria-hidden="true" />
        {t("lessons.card.estMinutes", { count: section.estimatedMinutes })}
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Create SectionNav.tsx**

```tsx
// src/features/lessons/components/SectionNav.tsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { clsx } from "clsx";
import { SECTION_ORDER, type SectionKey } from "../lesson.types";

type Props = {
  unitSlug: string;
  currentSection: SectionKey;
  completed: boolean;
  onToggleComplete: () => void;
};

export default function SectionNav({
  unitSlug,
  currentSection,
  completed,
  onToggleComplete,
}: Props) {
  const { t } = useTranslation();
  const currentIndex = SECTION_ORDER.indexOf(currentSection);
  const prevSection = currentIndex > 0 ? SECTION_ORDER[currentIndex - 1] : null;
  const nextSection =
    currentIndex < SECTION_ORDER.length - 1
      ? SECTION_ORDER[currentIndex + 1]
      : null;

  return (
    <div className="mt-12 pt-6 border-t border-semantic-border space-y-4">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onToggleComplete}
          className={clsx(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
            completed
              ? "bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400"
              : "bg-semantic-surface-2 text-semantic-text hover:bg-semantic-surface-2/80",
          )}
        >
          {completed && <Check className="w-4 h-4" aria-hidden="true" />}
          {completed
            ? t("lessons.section.completed")
            : t("lessons.section.markComplete")}
        </button>
      </div>
      <div className="flex items-center justify-between">
        {prevSection ? (
          <Link
            to={`/lessons/${unitSlug}/${prevSection}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t("lessons.section.previous")}
          </Link>
        ) : (
          <div />
        )}
        {nextSection ? (
          <Link
            to={`/lessons/${unitSlug}/${nextSection}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            {t("lessons.section.next")}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        ) : (
          <Link
            to={`/lessons/${unitSlug}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            {t("lessons.section.backToUnit")}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create LessonsIndex.tsx**

```tsx
// src/features/lessons/pages/LessonsIndex.tsx
import { useTranslation } from "react-i18next";
import { GraduationCap } from "lucide-react";
import { units } from "../data/units";
import UnitCard from "../components/UnitCard";

export default function LessonsIndex() {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-2">
        <GraduationCap
          className="w-7 h-7 text-primary-600 dark:text-primary-400"
          aria-hidden="true"
        />
        <h1 className="text-2xl font-bold text-semantic-text">
          {t("lessons.title")}
        </h1>
      </div>
      <p className="text-semantic-text-muted mb-8">
        {t("lessons.subtitle")}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((unit) => (
          <UnitCard key={unit.slug} unit={unit} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create UnitHub.tsx**

```tsx
// src/features/lessons/pages/UnitHub.tsx
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { getUnit } from "../data/getUnit";
import SectionCard from "../components/SectionCard";
import { useLessonProgressStore } from "../useLessonProgressStore";
import { SECTION_ORDER, type SectionKey } from "../lesson.types";

export default function UnitHub() {
  const { t } = useTranslation();
  const { unitSlug } = useParams<{ unitSlug: string }>();
  const navigate = useNavigate();
  const unit = unitSlug ? getUnit(unitSlug) : undefined;
  const getSectionProgress = useLessonProgressStore(
    (s) => s.getSectionProgress,
  );
  const lastVisitedMap = useLessonProgressStore(
    (s) => s.lastVisitedSectionKey,
  );

  if (!unit) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-semantic-text mb-3">
          {t("lessons.notFound")}
        </h1>
        <Link
          to="/lessons"
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("lessons.backToLessons")}
        </Link>
      </div>
    );
  }

  if (unit.status === "coming-soon") {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Link
          to="/lessons"
          className="inline-flex items-center gap-2 text-sm text-semantic-text-muted hover:text-primary-600 dark:hover:text-primary-400 mb-4"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("lessons.backToLessons")}
        </Link>
        <h1 className="text-2xl font-bold text-semantic-text mb-3">
          {t("lessons.unitShort", { number: unit.number })} — {unit.title}
        </h1>
        <p className="text-semantic-text-muted">
          {t("lessons.comingSoonMessage")}
        </p>
      </div>
    );
  }

  // Determine CTA
  const hasAnyVisited = unit.sections.some(
    (s) => getSectionProgress(unit.slug, s.key).visited,
  );
  const allCompleted = unit.sections.every(
    (s) => getSectionProgress(unit.slug, s.key).completed,
  );

  let ctaLabel: string;
  let ctaTarget: SectionKey;

  if (allCompleted) {
    ctaLabel = t("lessons.hub.reviewUnit");
    ctaTarget = "overview";
  } else if (hasAnyVisited) {
    ctaLabel = t("lessons.hub.continue");
    const lastVisited = lastVisitedMap[unit.slug];
    if (
      lastVisited &&
      !getSectionProgress(unit.slug, lastVisited).completed
    ) {
      ctaTarget = lastVisited;
    } else {
      ctaTarget =
        SECTION_ORDER.find(
          (key) => !getSectionProgress(unit.slug, key).completed,
        ) ?? "overview";
    }
  } else {
    ctaLabel = t("lessons.hub.startUnit");
    ctaTarget = "overview";
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link
        to="/lessons"
        className="inline-flex items-center gap-2 text-sm text-semantic-text-muted hover:text-primary-600 dark:hover:text-primary-400 mb-4"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t("lessons.backToLessons")}
      </Link>

      <h1 className="text-2xl font-bold text-semantic-text mb-1">
        {t("lessons.unitShort", { number: unit.number })} — {unit.title}
      </h1>
      <p className="text-semantic-text-muted mb-1">{unit.topic}</p>
      <p className="text-sm text-semantic-subtle mb-6">{unit.grammarFocus}</p>

      <button
        type="button"
        onClick={() => navigate(`/lessons/${unit.slug}/${ctaTarget}`)}
        className="w-full mb-6 px-6 py-3 rounded-lg bg-primary-500 text-white text-base font-semibold hover:bg-primary-600 transition-colors"
      >
        {ctaLabel}
      </button>

      <div className="space-y-2">
        {unit.sections.map((section) => (
          <SectionCard
            key={section.key}
            section={section}
            unitSlug={unit.slug}
            progress={getSectionProgress(unit.slug, section.key)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create SectionPage.tsx**

```tsx
// src/features/lessons/pages/SectionPage.tsx
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { getUnit } from "../data/getUnit";
import { getSection } from "../data/getSection";
import { useLessonProgressStore } from "../useLessonProgressStore";
import { SECTION_ORDER, type SectionKey } from "../lesson.types";
import SectionRenderer from "../components/SectionRenderer";
import SectionNav from "../components/SectionNav";

export default function SectionPage() {
  const { t } = useTranslation();
  const { unitSlug, sectionKey } = useParams<{
    unitSlug: string;
    sectionKey: string;
  }>();

  const unit = unitSlug ? getUnit(unitSlug) : undefined;
  const validSectionKey =
    sectionKey && SECTION_ORDER.includes(sectionKey as SectionKey)
      ? (sectionKey as SectionKey)
      : undefined;
  const section =
    unitSlug && validSectionKey
      ? getSection(unitSlug, validSectionKey)
      : undefined;

  const markVisited = useLessonProgressStore((s) => s.markVisited);
  const setLastVisited = useLessonProgressStore((s) => s.setLastVisited);
  const toggleCompleted = useLessonProgressStore((s) => s.toggleCompleted);
  const getSectionProgress = useLessonProgressStore(
    (s) => s.getSectionProgress,
  );

  const progress =
    unitSlug && validSectionKey
      ? getSectionProgress(unitSlug, validSectionKey)
      : { visited: false, completed: false };

  useEffect(() => {
    if (unitSlug && validSectionKey) {
      markVisited(unitSlug, validSectionKey);
      setLastVisited(unitSlug, validSectionKey);
    }
  }, [unitSlug, validSectionKey, markVisited, setLastVisited]);

  // Not found: invalid unit
  if (!unit) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-semantic-text mb-3">
          {t("lessons.notFound")}
        </h1>
        <Link
          to="/lessons"
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("lessons.backToLessons")}
        </Link>
      </div>
    );
  }

  // Not found: invalid section key or no section data
  if (!validSectionKey || !section) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-semantic-text mb-3">
          {t("lessons.sectionNotFound")}
        </h1>
        <Link
          to={`/lessons/${unitSlug}`}
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("lessons.backToUnit")}
        </Link>
      </div>
    );
  }

  // Coming-soon or locked unit accessed directly
  if (unit.status !== "available") {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Link
          to="/lessons"
          className="inline-flex items-center gap-2 text-sm text-semantic-text-muted hover:text-primary-600 dark:hover:text-primary-400 mb-4"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("lessons.backToLessons")}
        </Link>
        <h1 className="text-2xl font-bold text-semantic-text mb-3">
          {t("lessons.unitShort", { number: unit.number })} — {unit.title}
        </h1>
        <p className="text-semantic-text-muted">
          {t("lessons.comingSoonMessage")}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="sticky top-0 z-10 bg-semantic-bg pb-3 mb-6 border-b border-semantic-border -mx-4 px-4 pt-2">
        <Link
          to={`/lessons/${unitSlug}`}
          className="inline-flex items-center gap-2 text-sm text-semantic-text-muted hover:text-primary-600 dark:hover:text-primary-400"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("lessons.backToUnit")}
        </Link>
        <h1 className="text-2xl font-bold text-semantic-text mt-1">
          {section.title}
        </h1>
      </div>

      <SectionRenderer section={section} />

      <SectionNav
        unitSlug={unit.slug}
        currentSection={validSectionKey}
        completed={progress.completed}
        onToggleComplete={() => toggleCompleted(unit.slug, validSectionKey)}
      />
    </div>
  );
}
```

- [ ] **Step 7: Run typecheck**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/features/lessons/components/UnitCard.tsx src/features/lessons/components/SectionCard.tsx src/features/lessons/components/SectionNav.tsx src/features/lessons/pages/
git commit -m "feat(lessons): add LessonsIndex, UnitHub, and SectionPage route components"
```

---

## Task 9: Route Wiring + Old File Cleanup

**Files:**
- Modify: `src/App.tsx`
- Remove: `src/pages/Lessons.tsx`
- Remove: `src/pages/LessonDetail.tsx`
- Remove: `src/data/units.ts`

- [ ] **Step 1: Update App.tsx imports and routes**

Replace the old lesson lazy imports:

```tsx
// Remove these lines:
const Lessons        = lazy(() => import("@/pages/Lessons"));
const LessonDetail   = lazy(() => import("@/pages/LessonDetail"));

// Add these lines:
const LessonsIndex   = lazy(() => import("@/features/lessons/pages/LessonsIndex"));
const UnitHub        = lazy(() => import("@/features/lessons/pages/UnitHub"));
const SectionPage    = lazy(() => import("@/features/lessons/pages/SectionPage"));
```

Replace the old lesson routes inside the `RequireAuth` + `AuthLayout` block:

```tsx
// Remove these lines:
<Route path="/lessons" element={<Lessons />} />
<Route path="/lessons/:unitSlug" element={<LessonDetail />} />

// Add these lines:
<Route path="/lessons" element={<LessonsIndex />} />
<Route path="/lessons/:unitSlug" element={<UnitHub />} />
<Route path="/lessons/:unitSlug/:sectionKey" element={<SectionPage />} />
```

- [ ] **Step 2: Check for other imports of old files**

Run: `grep -r "from.*@/pages/Lessons" src/` and `grep -r "from.*@/data/units" src/`

If any other files import `@/pages/Lessons`, `@/pages/LessonDetail`, or `@/data/units`, update them to use the new paths. Expected: only `App.tsx` imports the page files, no other files import from `@/data/units` (since e2e tests use their own selectors).

- [ ] **Step 3: Delete old files**

```bash
rm src/pages/Lessons.tsx src/pages/LessonDetail.tsx src/data/units.ts
```

- [ ] **Step 4: Run typecheck**

Run: `npm run type-check`
Expected: PASS — no dangling imports

- [ ] **Step 5: Run dev server and manually verify**

Run: `npm run dev`

Verify in browser:
1. `/lessons` shows the unit grid with 4 cards
2. `/lessons/unit-1` shows the UnitHub with 5 section cards and "Start Unit" CTA
3. Click "Start Unit" → navigates to `/lessons/unit-1/overview`
4. Overview section shows real content (headings, text, examples, callout)
5. Click "Next" → navigates to grammar section with MCQ exercise
6. Navigate through all 5 sections using prev/next
7. "Mark as Complete" toggles correctly
8. Return to UnitHub — CTA changes to "Continue"
9. `/lessons/unit-2` shows coming-soon message
10. `/lessons/unit-99` shows not-found UI
11. `/lessons/unit-1/invalid` shows section not-found UI
12. Dark mode toggle works on all pages

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git rm src/pages/Lessons.tsx src/pages/LessonDetail.tsx src/data/units.ts
git commit -m "feat(lessons): wire new routes, remove old scaffold pages and data"
```

---

## Task 10: Update E2E Tests

**Files:**
- Modify: `e2e/lessons.spec.ts`

- [ ] **Step 1: Rewrite e2e/lessons.spec.ts**

```ts
// e2e/lessons.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Lessons area", () => {
  // ── LessonsIndex ──────────────────────────────────────────────────────────

  test("sidebar link navigates to /lessons and shows the list page", async ({
    page,
  }) => {
    await page.goto("/home");
    await page.getByRole("link", { name: "Lessons" }).first().click();
    await expect(page).toHaveURL("/lessons");
    await expect(
      page.getByRole("heading", { level: 1, name: "Lessons" }),
    ).toBeVisible();
  });

  test("renders 4 unit cards with Unit 1 available and Units 2-4 coming soon", async ({
    page,
  }) => {
    await page.goto("/lessons");
    await expect(
      page.getByRole("link", { name: /To Be: Introduction/ }),
    ).toBeVisible();
    await expect(page.getByText("Available")).toHaveCount(1);
    await expect(page.getByText("Coming soon")).toHaveCount(3);
  });

  test("coming-soon cards are disabled divs, not navigable links", async ({
    page,
  }) => {
    await page.goto("/lessons");
    await expect(
      page.getByRole("link", { name: /To Be: Yes\/No Questions/ }),
    ).toHaveCount(0);
    const unit2Card = page
      .locator("[aria-disabled='true']")
      .filter({ hasText: "To Be: Yes/No Questions" });
    await expect(unit2Card).toBeVisible();
  });

  // ── UnitHub ────────────────────────────────────────────────────────────────

  test("Unit 1 hub shows sections with Start Unit CTA", async ({ page }) => {
    await page.goto("/lessons/unit-1");
    await expect(
      page.getByRole("heading", { level: 1, name: /Unit 1.*To Be: Introduction/ }),
    ).toBeVisible();

    // All 5 section cards visible
    for (const section of ["Overview", "Grammar", "Vocabulary", "Dialogues", "Activities"]) {
      await expect(page.getByText(section)).toBeVisible();
    }

    // Start Unit CTA
    await expect(
      page.getByRole("button", { name: /Start Unit/i }),
    ).toBeVisible();
  });

  test("Start Unit navigates to overview section", async ({ page }) => {
    await page.goto("/lessons/unit-1");
    await page.getByRole("button", { name: /Start Unit/i }).click();
    await expect(page).toHaveURL("/lessons/unit-1/overview");
  });

  test("coming-soon unit hub shows placeholder message", async ({ page }) => {
    await page.goto("/lessons/unit-2");
    await expect(
      page.getByText(/This unit isn.?t ready yet/),
    ).toBeVisible();
  });

  test("unknown unit slug shows not-found with back link", async ({ page }) => {
    await page.goto("/lessons/unit-99");
    await expect(
      page.getByRole("heading", { level: 1, name: /not found/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Back to lessons/i }),
    ).toBeVisible();
  });

  // ── SectionPage ────────────────────────────────────────────────────────────

  test("overview section renders real content", async ({ page }) => {
    await page.goto("/lessons/unit-1/overview");
    await expect(page.getByText("What you'll learn")).toBeVisible();
    await expect(
      page.getByText(/introduce yourself/),
    ).toBeVisible();
    // Back link to unit hub
    await expect(
      page.getByRole("link", { name: /Back to unit/i }),
    ).toBeVisible();
  });

  test("vocabulary section renders vocab cards", async ({ page }) => {
    await page.goto("/lessons/unit-1/vocabulary");
    await expect(page.getByText("hello")).toBeVisible();
    await expect(page.getByText("Tap to reveal")).toBeVisible();
  });

  test("grammar section renders MCQ exercise", async ({ page }) => {
    await page.goto("/lessons/unit-1/grammar");
    await expect(
      page.getByText(/Choose the correct form/),
    ).toBeVisible();
    // Click correct answer
    await page.getByRole("button", { name: "is" }).click();
    await expect(page.getByText("Correct!")).toBeVisible();
  });

  test("activities section renders fill-blank exercise", async ({ page }) => {
    await page.goto("/lessons/unit-1/activities");
    await expect(page.getByPlaceholder("...")).toBeVisible();
  });

  test("prev/next navigation works through all sections", async ({ page }) => {
    await page.goto("/lessons/unit-1/overview");

    // overview → grammar
    await page.getByRole("link", { name: /Next/i }).click();
    await expect(page).toHaveURL("/lessons/unit-1/grammar");

    // grammar → vocabulary
    await page.getByRole("link", { name: /Next/i }).click();
    await expect(page).toHaveURL("/lessons/unit-1/vocabulary");

    // vocabulary → dialogues
    await page.getByRole("link", { name: /Next/i }).click();
    await expect(page).toHaveURL("/lessons/unit-1/dialogues");

    // dialogues → activities
    await page.getByRole("link", { name: /Next/i }).click();
    await expect(page).toHaveURL("/lessons/unit-1/activities");

    // activities → back to unit (last section)
    await page.getByRole("link", { name: /Back to Unit/i }).click();
    await expect(page).toHaveURL("/lessons/unit-1");
  });

  test("mark as complete toggles section completion", async ({ page }) => {
    await page.goto("/lessons/unit-1/overview");
    await page.getByRole("button", { name: /Mark as Complete/i }).click();
    await expect(
      page.getByRole("button", { name: /Completed/i }),
    ).toBeVisible();

    // Toggle back
    await page.getByRole("button", { name: /Completed/i }).click();
    await expect(
      page.getByRole("button", { name: /Mark as Complete/i }),
    ).toBeVisible();
  });

  test("invalid section key shows section not-found", async ({ page }) => {
    await page.goto("/lessons/unit-1/invalid-section");
    await expect(
      page.getByRole("heading", { level: 1, name: /not found/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Back to unit/i }),
    ).toBeVisible();
  });

  test("coming-soon unit section URL shows coming-soon message", async ({
    page,
  }) => {
    await page.goto("/lessons/unit-2/overview");
    await expect(
      page.getByText(/This unit isn.?t ready yet/),
    ).toBeVisible();
  });
});
```

- [ ] **Step 2: Run e2e tests**

Run: `npx playwright test e2e/lessons.spec.ts`
Expected: PASS — all tests green

If any tests fail, fix the selectors or component output to match, then rerun.

- [ ] **Step 3: Commit**

```bash
git add e2e/lessons.spec.ts
git commit -m "test(e2e): rewrite lessons tests for new routes and section navigation"
```

---

## Task 11: Run Full Test Suite + Typecheck

**Files:** None — validation only

- [ ] **Step 1: Run typecheck**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 2: Run unit tests**

Run: `npm test`
Expected: PASS — all existing tests + new tests pass

- [ ] **Step 3: Run e2e tests**

Run: `npx playwright test`
Expected: PASS — all specs pass including updated lessons tests

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: PASS or only pre-existing warnings

- [ ] **Step 5: Fix any failures**

If any test or lint failure, fix the issue and rerun. Do not skip.

- [ ] **Step 6: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address test/lint issues from lessons phase 1"
```
