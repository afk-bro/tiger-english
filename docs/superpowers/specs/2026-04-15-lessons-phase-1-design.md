# Lessons Phase 1 Design Spec

## Overview

Build the lessons area for Gain English — the structural framework, navigation, content model, and minimal interactivity for Unit 1. This is Phase 1 of a three-phase plan:

- **Phase 1** (this spec): Site structure, lesson experience, progress placeholders
- **Phase 2** (future): Real progression model, Supabase persistence, unlock logic
- **Phase 3** (future): Gamification — XP, streaks, badges, performance bonuses

## Design Principles

- **Guided non-linear model**: the experience presents as linear (overview → grammar → vocabulary → dialogues → activities), but users can freely navigate to any section
- **Progression rule** (Phase 2): next unit unlocks at 70% completion of the current unit
- **Build the framework, not the exercises**: content shells + interaction placeholders, with just enough real interactivity to prove the model
- **Design for scoring to plug in later**: don't implement it, don't ignore it

## Content Model

All types live in `src/features/lessons/lesson.types.ts`.

```ts
type UnitStatus = "available" | "coming-soon" | "locked";

type SectionKey =
  | "overview"
  | "grammar"
  | "vocabulary"
  | "dialogues"
  | "activities";

const SECTION_ORDER: SectionKey[] = [
  "overview",
  "grammar",
  "vocabulary",
  "dialogues",
  "activities",
];

type Unit = {
  slug: string;
  number: number;
  title: string;
  topic: string;
  grammarFocus: string;
  estimatedMinutes: number;
  status: UnitStatus;
  sections: SectionMeta[];
};

type SectionMeta = {
  key: SectionKey;
  title: string;
  estimatedMinutes: number;
};

type Section = {
  id: string;
  unitSlug: string;
  key: SectionKey;
  title: string;
  blocks: SectionBlock[];
};

type SectionBlock =
  | { id: string; type: "heading"; content: string }
  | { id: string; type: "text"; content: string }
  | { id: string; type: "examples"; items: ExampleItem[] }
  | { id: string; type: "vocab-list"; items: VocabItem[] }
  | { id: string; type: "dialogue"; lines: DialogueLine[] }
  | { id: string; type: "exercise"; exerciseType: ExerciseType; exerciseId: string }
  | { id: string; type: "callout"; variant: "tip" | "note" | "warning"; content: string };

type ExampleItem = {
  english: string;
  translation: string;
  note?: string;
};

type VocabItem = {
  word: string;
  translation: string;
  phonetic?: string;
  audioUrl?: string;
  example?: string;
};

type DialogueLine = {
  speaker: string;
  text: string;
  translation: string;
  audioUrl?: string;
};

type ExerciseType = "multiple-choice" | "fill-blank" | "match";
```

### Notes on ExerciseType

`"match"` is included as a forward-looking union member. In Phase 1:

- No content references the `match` type
- No `Match.tsx` component is built
- If `SectionRenderer` encounters a `match` exercise, it renders a "Coming soon" placeholder

## File Structure

```
src/
├── features/
│   └── lessons/
│       ├── components/
│       │   ├── UnitCard.tsx            # unit card for lessons index
│       │   ├── SectionCard.tsx         # section card for unit hub
│       │   ├── SectionRenderer.tsx     # maps Section.blocks → block components
│       │   └── blocks/
│       │       ├── TextBlock.tsx
│       │       ├── HeadingBlock.tsx
│       │       ├── ExamplesBlock.tsx
│       │       ├── VocabListBlock.tsx
│       │       ├── DialogueBlock.tsx
│       │       ├── CalloutBlock.tsx
│       │       └── ExerciseBlock.tsx   # delegates to shared exercises
│       ├── data/
│       │   ├── units.ts               # unit catalog (moved from src/data/)
│       │   ├── sectionRegistry.ts     # maps unitSlug + sectionKey → Section
│       │   ├── getUnit.ts             # thin API: lookup unit by slug
│       │   ├── getSection.ts          # thin API: lookup section by unitSlug + sectionKey
│       │   ├── sections/
│       │   │   └── unit-1/
│       │   │       ├── overview.ts
│       │   │       ├── grammar.ts
│       │   │       ├── vocabulary.ts
│       │   │       ├── dialogues.ts
│       │   │       └── activities.ts
│       │   └── exercises/
│       │       └── unit-1.ts          # exercise definitions for unit 1
│       ├── pages/
│       │   ├── LessonsIndex.tsx       # /lessons
│       │   ├── UnitHub.tsx            # /lessons/:unitSlug
│       │   └── SectionPage.tsx        # /lessons/:unitSlug/:sectionKey
│       ├── lesson.types.ts            # all lesson type definitions
│       └── useLessonProgressStore.ts  # Zustand progress slice
│
├── components/
│   └── exercises/
│       ├── MultipleChoice.tsx
│       ├── FillBlank.tsx
│       └── exercises.types.ts         # shared exercise interfaces
```

### Data Layer

Route components do not import raw content files directly. Instead they use thin accessor functions:

- `getUnit(slug)` — returns `Unit | undefined`
- `getSection(unitSlug, sectionKey)` — returns `Section | undefined`
- `sectionRegistry.ts` — centralizes imports, maps `${unitSlug}:${sectionKey}` → `Section`

This creates a seam for migrating to Supabase/CMS later without touching page components.

## Routing

**Routes in `App.tsx`:**

```
/lessons                          → LessonsIndex
/lessons/:unitSlug                → UnitHub
/lessons/:unitSlug/:sectionKey    → SectionPage
```

All wrapped in `<RequireAuth>` + `AuthLayout` (existing pattern).

**Route guards:**

- Invalid `unitSlug` → not-found state
- Invalid `sectionKey` for a valid unit → not-found state
- `"locked"` unit accessed via direct URL → redirect to `/lessons` or show locked state
- `"coming-soon"` unit accessed via direct URL → show coming-soon message

**Canonical section order** (single constant, used everywhere):

```ts
const SECTION_ORDER: SectionKey[] = [
  "overview", "grammar", "vocabulary", "dialogues", "activities"
];
```

Used for: UnitHub display order, prev/next logic, Continue CTA resolution, validation.

## Navigation

### LessonsIndex (`/lessons`)

- Grid of `UnitCard` components
- Available units are clickable links to `/lessons/:unitSlug`
- Coming-soon units show disabled state with badge
- Locked units show locked state with badge (Phase 1: static, no real unlock logic)

### UnitHub (`/lessons/:unitSlug`)

Displays:

- Unit title, topic, description
- Section list — each `SectionCard` is clickable, shows: title, estimated minutes, status icon
- Primary CTA button:
  - No sections started → **"Start Unit"** → navigates to `/lessons/:unitSlug/overview`
  - Some sections visited → **"Continue"** → navigates to `lastVisitedSectionKey` if set, otherwise first incomplete section
  - All sections completed → **"Review Unit"** → navigates to overview

**Section status icons:**

- Not started: empty circle, muted text
- In progress (visited, not completed): outlined/half circle, normal text
- Completed: filled check circle (gold accent), normal text

### SectionPage (`/lessons/:unitSlug/:sectionKey`)

- **Top**: sticky header with section title + back link to unit hub. Background + subtle bottom border for clarity.
- **Content**: `SectionRenderer` maps `Section.blocks` to block components
- **Bottom** (below content, with strong spacing):
  1. "Mark as Complete" button (secondary style). After completion: changes to "Completed" (gold check) with option to undo.
  2. Prev/Next navigation — primary blue buttons, left/right aligned. "Next" on the last section becomes "Back to Unit."

Navigation is always free — "Mark as Complete" is optional UI state, not a gate.

## Progress State

Zustand store: `useLessonProgressStore`

```ts
type SectionProgress = {
  visited: boolean;
  completed: boolean;
};

type LessonProgressState = {
  progress: Record<string, SectionProgress>; // keyed by `${unitSlug}:${sectionKey}`
  lastVisitedSectionKey: Record<string, SectionKey>; // keyed by unitSlug

  markVisited: (unitSlug: string, sectionKey: SectionKey) => void;
  toggleCompleted: (unitSlug: string, sectionKey: SectionKey) => void;
  setLastVisited: (unitSlug: string, sectionKey: SectionKey) => void;
  getSectionProgress: (unitSlug: string, sectionKey: SectionKey) => SectionProgress;
  getUnitCompletionPercent: (unitSlug: string, sections: SectionMeta[]) => number;
};
```

- `visited` set to `true` on `SectionPage` mount
- `completed` toggled by user via "Mark as Complete"
- `lastVisitedSectionKey` updated on each section visit
- Not persisted to storage in Phase 1 — resets on refresh
- `getUnitCompletionPercent` counts completed sections / total sections (future: weighted)

### Continue CTA resolution

1. If `lastVisitedSectionKey` exists for the unit and that section is not completed → go there
2. Otherwise, iterate `SECTION_ORDER`, return first section not marked completed
3. If all completed → return `"overview"`

## Visual Design

### Layout

- Centered content column: `max-w-3xl`, comfortable horizontal padding
- Moderate vertical spacing between blocks (not too generous — keep it readable but not wasteful)
- Sticky top bar on SectionPage: background fill + subtle bottom border

### Typography

- Section title: `text-2xl font-bold`
- Block headings: `text-xl font-semibold`
- Body text: `text-base leading-relaxed`

### Color Usage

- Blue `#326de2` → actions, links, active/selected states, primary buttons
- Gold `#fcd34d` → completion indicators, highlights
- Neutral backgrounds → content areas
- Dark mode supported via existing class-based system

### Block Styling

| Block Type | Visual Treatment |
|---|---|
| `text` | Plain prose, no container |
| `heading` | Bold, clear top margin |
| `examples` | Light background card, rounded, grouped items |
| `vocab-list` | Card grid — reuses flashcard flip pattern |
| `dialogue` | Alternating subtle speech indicators per speaker, not heavy chat bubbles |
| `exercise` | Elevated card, slightly stronger border/shadow, clear interactive affordance |
| `callout` | Left border accent + icon. Tip = blue, Note = gold, Warning = muted amber (not red) |

### Key Visual Principle

Interactive blocks should feel like a natural interruption — visually distinct from static content so users recognize "this is something I do" without the UI feeling jarring.

### Bottom Navigation

- Clear spacing above nav area
- "Mark as Complete" centered, secondary style
- Prev/Next as primary buttons with strong hierarchy
- Adequate padding and separation between elements

## Phase 1 Content Scope

### Unit 1: "Greetings & Introductions" — real content

- **Overview**: real content — what you'll learn, real-world context, 3-5 example sentences
- **Vocabulary**: real content — 8-12 vocab items with translations, phonetics; uses flashcard flip cards

### Unit 1: placeholder content

- **Grammar**: real structure with placeholder explanations, 1 working MCQ exercise
- **Dialogues**: placeholder dialogue script with stub lines
- **Activities**: placeholder with 1 working mixed exercise (MCQ or fill-blank)

### Units 2-4

Remain in the unit catalog as `"coming-soon"`. No section data.

### Exercise Components (shared)

- `MultipleChoice.tsx` — renders question + options, tracks selected answer, shows correct/incorrect
- `FillBlank.tsx` — renders sentence with blank, text input, checks answer
- Exercise data (questions, answers, options) lives in `src/features/lessons/data/exercises/unit-1.ts` — owned by lessons because the content is lesson-specific
- Exercise components (`MultipleChoice`, `FillBlank`) accept generic props and know nothing about lessons — they are reusable across any feature that needs exercises

## Existing Code Impact

| File | Change |
|---|---|
| `src/pages/Lessons.tsx` | Remove — replaced by `features/lessons/pages/LessonsIndex.tsx` |
| `src/pages/LessonDetail.tsx` | Remove — replaced by `features/lessons/pages/UnitHub.tsx` |
| `src/data/units.ts` | Move to `features/lessons/data/units.ts`, extend with `sections` field |
| `App.tsx` | Update routes: 3 lesson routes instead of 2 |
| `e2e/lessons.spec.ts` | Update to match new routes and UI structure |
| i18n locale files | Extend `lessons.*` namespace with section-level keys |

## Testing Strategy

- **Unit tests**: data layer (`getUnit`, `getSection`, `sectionRegistry`), `SectionRenderer` block mapping, progress store
- **Component tests**: shared exercise components (`MultipleChoice`, `FillBlank`)
- **E2E tests**: update existing `e2e/lessons.spec.ts` for new routing, add full navigation flow coverage
- **Manual testing**: full navigation flow, all section types render, exercise interactions work, progress state updates correctly across pages

## What Phase 2 Adds (not in scope, listed for context)

- Per-section completion tracking with real validation (exercises must be answered correctly)
- Unit completion percentage calculated from weighted section scores
- Next-unit unlock logic at 70% threshold
- Supabase tables for lesson progress persistence
- Backend endpoints for progress read/write
- Audio playback for vocab and dialogue items
- `Match.tsx` exercise component

## What Phase 3 Adds (not in scope, listed for context)

- XP/points system
- Streaks and performance bonuses
- Level progression
- Badges/achievements
