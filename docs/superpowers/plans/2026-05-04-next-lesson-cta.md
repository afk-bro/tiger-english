# Next-lesson CTA implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the last section of a unit, surface a `Next: Unit N — Title →` button that links to the next available unit's `overview` section. When no next available unit exists, show `Back to Unit` plus a tertiary terminal-state message + `Back to Lessons` link.

**Architecture:** New `getNextAvailableUnit(slug)` helper walks the `units` array forward to find the next unit with `status === "available"`. `SectionPage` computes `isLastSection`, calls the helper, composes the i18n CTA text, and passes both into `SectionNav` as props. `SectionNav` branches the right-side button on `(isLastSection, nextUnit)` and renders the terminal-state message + link below the prev/next row only when on the last section AND no next unit exists.

**Tech Stack:** React 19, React Router DOM v7, react-i18next, Vitest + React Testing Library, TypeScript.

**Spec:** `docs/superpowers/specs/2026-05-04-next-lesson-cta-design.md`.

---

## File map

| File | Action | Why |
|---|---|---|
| `src/features/lessons/data/getUnit.ts` | Modify | Add `getNextAvailableUnit` named export |
| `src/features/lessons/data/__tests__/getNextAvailableUnit.test.ts` | Create | Unit test (mocks `../units` fixture) |
| `src/features/lessons/components/SectionNav.tsx` | Modify | Accept `isLastSection` + `nextUnit` props; branch right-side button; render terminal-state block |
| `src/features/lessons/components/__tests__/SectionNav.test.tsx` | Create | New component tests covering the three rendering branches |
| `src/features/lessons/pages/SectionPage.tsx` | Modify | Compute `isLastSection`, call helper, compose CTA text, pass into `SectionNav` |
| `src/locales/{en,vi,th,zh-CN}/<lang>.json` | Modify | 3 new keys per locale: `nextUnit`, `allUnitsCompletedMessage`, `backToLessons` (under `lessons.section`) |

`useLessonProgressStore`, `lesson.types.ts`, `getUnit`, and other lessons-feature modules are untouched.

---

## Task 1: `getNextAvailableUnit` helper (TDD)

**Files:**
- Modify: `src/features/lessons/data/getUnit.ts` (add named export)
- Create: `src/features/lessons/data/__tests__/getNextAvailableUnit.test.ts`

- [ ] **Step 1.1: Write the failing test**

Create `src/features/lessons/data/__tests__/getNextAvailableUnit.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Unit } from '../../lesson.types';

// Mock `../units` so each test controls the fixture order/status.
vi.mock('../units', () => ({
  units: [] as Unit[],
}));

// Minimal Unit factory — only the fields the helper reads.
const makeUnit = (overrides: Partial<Unit> & { slug: string }): Unit => ({
  number: 0,
  title: 'Test Unit',
  topic: '',
  grammarFocus: '',
  estimatedMinutes: 0,
  status: 'available',
  sections: [],
  translations: {},
  ...overrides,
});

const setUnits = async (units: Unit[]) => {
  const mod = await import('../units');
  (mod as { units: Unit[] }).units = units;
};

describe('getNextAvailableUnit', () => {
  beforeEach(async () => {
    await setUnits([]);
    vi.resetModules();
  });

  it('returns the next available unit', async () => {
    await setUnits([
      makeUnit({ slug: 'unit-1', status: 'available' }),
      makeUnit({ slug: 'unit-2', status: 'available' }),
    ]);
    const { getNextAvailableUnit } = await import('../getUnit');
    const next = getNextAvailableUnit('unit-1');
    expect(next?.slug).toBe('unit-2');
  });

  it('skips coming-soon units to find the next available', async () => {
    await setUnits([
      makeUnit({ slug: 'unit-1', status: 'available' }),
      makeUnit({ slug: 'unit-2', status: 'coming-soon' }),
      makeUnit({ slug: 'unit-3', status: 'available' }),
    ]);
    const { getNextAvailableUnit } = await import('../getUnit');
    const next = getNextAvailableUnit('unit-1');
    expect(next?.slug).toBe('unit-3');
  });

  it('returns undefined when current is the last available and rest are coming-soon', async () => {
    await setUnits([
      makeUnit({ slug: 'unit-1', status: 'available' }),
      makeUnit({ slug: 'unit-2', status: 'available' }),
      makeUnit({ slug: 'unit-3', status: 'coming-soon' }),
      makeUnit({ slug: 'unit-4', status: 'coming-soon' }),
    ]);
    const { getNextAvailableUnit } = await import('../getUnit');
    expect(getNextAvailableUnit('unit-2')).toBeUndefined();
  });

  it('returns undefined when the unit is the last in the array', async () => {
    await setUnits([makeUnit({ slug: 'unit-only', status: 'available' })]);
    const { getNextAvailableUnit } = await import('../getUnit');
    expect(getNextAvailableUnit('unit-only')).toBeUndefined();
  });

  it('returns undefined for unknown slug', async () => {
    await setUnits([makeUnit({ slug: 'unit-1' })]);
    const { getNextAvailableUnit } = await import('../getUnit');
    expect(getNextAvailableUnit('unit-99')).toBeUndefined();
  });

  it('returns undefined when units array is empty', async () => {
    await setUnits([]);
    const { getNextAvailableUnit } = await import('../getUnit');
    expect(getNextAvailableUnit('unit-1')).toBeUndefined();
  });
});
```

- [ ] **Step 1.2: Run test, verify it fails**

```bash
npm test -- --run src/features/lessons/data/__tests__/getNextAvailableUnit.test.ts
```

Expected: FAIL with `Module ... does not export 'getNextAvailableUnit'` or similar.

- [ ] **Step 1.3: Add `getNextAvailableUnit` to `getUnit.ts`**

Open `src/features/lessons/data/getUnit.ts`. Append the new function below the existing `getUnit` export. The current file (after Task 1) should look like:

```ts
import type { Unit } from "../lesson.types";
import { units } from "./units";
import { hydrateUnit } from "./imageHydration";
import { unitImagesSidecars } from "./images";

export function getUnit(slug: string): Unit | undefined {
  const unit = units.find((u) => u.slug === slug);
  if (!unit) return undefined;
  const sidecar = unitImagesSidecars[slug] ?? {};
  return hydrateUnit(unit, sidecar);
}

/**
 * Returns the next unit (in `units` array order) whose status is "available",
 * starting AFTER the unit with `currentSlug`. Skips "coming-soon" and "locked"
 * units. Returns undefined if `currentSlug` isn't found, the units array is
 * empty, or no subsequent unit qualifies.
 *
 * Note: the returned unit is NOT hydrated with sidecar image URLs — callers
 * that need hydrated unit data should pipe the result through `getUnit(slug)`
 * with the returned unit's slug. For the next-lesson CTA's needs (slug,
 * number, title, translations), the raw unit is sufficient.
 */
export function getNextAvailableUnit(currentSlug: string): Unit | undefined {
  if (units.length === 0) return undefined;
  const currentIndex = units.findIndex((u) => u.slug === currentSlug);
  if (currentIndex === -1) return undefined;
  for (let i = currentIndex + 1; i < units.length; i++) {
    if (units[i].status === "available") return units[i];
  }
  return undefined;
}
```

- [ ] **Step 1.4: Run test, verify it passes**

```bash
npm test -- --run src/features/lessons/data/__tests__/getNextAvailableUnit.test.ts
```

Expected: 6/6 tests pass.

- [ ] **Step 1.5: Run type-check**

```bash
npm run type-check
```

Expected: clean.

- [ ] **Step 1.6: Commit**

```bash
git add src/features/lessons/data/getUnit.ts src/features/lessons/data/__tests__/getNextAvailableUnit.test.ts
git commit -m "feat(lessons): add getNextAvailableUnit helper"
```

---

## Task 2: i18n keys for all 4 locales

**Files:**
- Modify: `src/locales/en/en.json`
- Modify: `src/locales/vi/vi.json`
- Modify: `src/locales/th/th.json`
- Modify: `src/locales/zh-CN/zh-CN.json`

Each locale gets 3 new keys under the existing `lessons.section` block. The block currently contains keys like `markComplete`, `completed`, `previous`, `next`, `backToUnit`. Add the new keys alongside them.

- [ ] **Step 2.1: Add to `src/locales/en/en.json`**

Find the `lessons.section` block (search for `"section": {` under `lessons`) and add three siblings to existing keys:

```json
"nextUnit": "Next: {{unitLabel}}",
"allUnitsCompletedMessage": "You've completed all available units",
"backToLessons": "Back to Lessons"
```

The keys can go at the end of the section block (just before the closing `}`). Add a comma after the previous last entry so JSON stays valid.

- [ ] **Step 2.2: Add to `src/locales/vi/vi.json`**

Same location, with Vietnamese values:

```json
"nextUnit": "Tiếp theo: {{unitLabel}}",
"allUnitsCompletedMessage": "Bạn đã hoàn thành tất cả các bài học hiện có",
"backToLessons": "Quay lại danh sách bài học"
```

- [ ] **Step 2.3: Add to `src/locales/th/th.json`**

Same location, with Thai values:

```json
"nextUnit": "ถัดไป: {{unitLabel}}",
"allUnitsCompletedMessage": "คุณได้เรียนจบบทเรียนที่มีอยู่ทั้งหมดแล้ว",
"backToLessons": "กลับไปยังรายการบทเรียน"
```

- [ ] **Step 2.4: Add to `src/locales/zh-CN/zh-CN.json`**

Same location, with Simplified Chinese values:

```json
"nextUnit": "下一个：{{unitLabel}}",
"allUnitsCompletedMessage": "您已完成所有可用单元",
"backToLessons": "返回课程列表"
```

- [ ] **Step 2.5: Validate JSON**

```bash
node -e "['en','vi','th','zh-CN'].forEach(l => { JSON.parse(require('fs').readFileSync('src/locales/' + l + '/' + l + '.json','utf8')); }); console.log('OK')"
```

Expected: `OK`. If any locale fails to parse, the most common cause is a missing/extra comma — open and inspect the area you edited.

- [ ] **Step 2.6: Verify keys are reachable via i18next interpolation**

```bash
node -e "['en','vi','th','zh-CN'].forEach(l => { const d = JSON.parse(require('fs').readFileSync('src/locales/' + l + '/' + l + '.json','utf8')); const s = d.lessons.section; if (!s.nextUnit || !s.allUnitsCompletedMessage || !s.backToLessons) throw new Error(l + ' missing keys'); }); console.log('all 4 locales have all 3 keys');"
```

Expected: `all 4 locales have all 3 keys`.

- [ ] **Step 2.7: Commit**

```bash
git add src/locales/en/en.json src/locales/vi/vi.json src/locales/th/th.json src/locales/zh-CN/zh-CN.json
git commit -m "feat(i18n): add next-unit + all-units-completed keys for lessons"
```

---

## Task 3: `SectionNav` props + new branches (TDD)

**Files:**
- Create: `src/features/lessons/components/__tests__/SectionNav.test.tsx`
- Modify: `src/features/lessons/components/SectionNav.tsx`

- [ ] **Step 3.1: Write the failing component tests**

Create `src/features/lessons/components/__tests__/SectionNav.test.tsx`:

```tsx
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import SectionNav from '../SectionNav';

const i18n = createInstance();

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {
          lessons: {
            section: {
              previous: 'Previous',
              next: 'Next',
              backToUnit: 'Back to Unit',
              markComplete: 'Mark complete',
              completed: 'Completed',
              nextUnit: 'Next: {{unitLabel}}',
              allUnitsCompletedMessage: "You've completed all available units",
              backToLessons: 'Back to Lessons',
            },
          },
        },
      },
    },
    interpolation: { escapeValue: false },
  });
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <MemoryRouter>{children}</MemoryRouter>
  </I18nextProvider>
);

describe('SectionNav', () => {
  it('renders within-unit Next link on a non-last section', () => {
    render(
      <SectionNav
        unitSlug="unit-1"
        currentSection="grammar"
        completed={false}
        onToggleComplete={() => {}}
        isLastSection={false}
      />,
      { wrapper },
    );
    const nextLink = screen.getByRole('link', { name: /^next$/i });
    expect(nextLink).toHaveAttribute('href', '/lessons/unit-1/vocabulary');
    expect(screen.queryByText("You've completed all available units")).not.toBeInTheDocument();
  });

  it('renders Next: Unit X link on the last section when nextUnit is provided', () => {
    render(
      <SectionNav
        unitSlug="unit-1"
        currentSection="activities"
        completed={false}
        onToggleComplete={() => {}}
        isLastSection={true}
        nextUnit={{ slug: 'unit-2', ctaText: 'Next: Unit 2 — To Be: Location' }}
      />,
      { wrapper },
    );
    const nextLink = screen.getByRole('link', { name: /next: unit 2/i });
    expect(nextLink).toHaveAttribute('href', '/lessons/unit-2/overview');
    expect(screen.queryByText("You've completed all available units")).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /back to lessons/i })).not.toBeInTheDocument();
  });

  it('renders Back to Unit + terminal-state message + Back to Lessons on the last section when nextUnit is undefined', () => {
    render(
      <SectionNav
        unitSlug="unit-2"
        currentSection="activities"
        completed={false}
        onToggleComplete={() => {}}
        isLastSection={true}
      />,
      { wrapper },
    );
    const backToUnit = screen.getByRole('link', { name: /back to unit/i });
    expect(backToUnit).toHaveAttribute('href', '/lessons/unit-2');
    expect(screen.getByText("You've completed all available units")).toBeInTheDocument();
    const backToLessons = screen.getByRole('link', { name: /back to lessons/i });
    expect(backToLessons).toHaveAttribute('href', '/lessons');
  });
});
```

- [ ] **Step 3.2: Run test, verify it fails**

```bash
npm test -- --run src/features/lessons/components/__tests__/SectionNav.test.tsx
```

Expected: FAIL on the type signature mismatch (`isLastSection` and `nextUnit` props don't exist yet) OR test 2/3 assertions failing (the new rendering branches haven't been written yet). Either way, the file should not pass.

- [ ] **Step 3.3: Update `SectionNav.tsx`**

Replace the current contents of `src/features/lessons/components/SectionNav.tsx` with:

```tsx
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
  isLastSection: boolean;
  nextUnit?: { slug: string; ctaText: string };
};

export default function SectionNav({
  unitSlug,
  currentSection,
  completed,
  onToggleComplete,
  isLastSection,
  nextUnit,
}: Props) {
  const { t } = useTranslation();
  const currentIndex = SECTION_ORDER.indexOf(currentSection);
  const prevSection = currentIndex > 0 ? SECTION_ORDER[currentIndex - 1] : null;
  const nextSection = !isLastSection ? SECTION_ORDER[currentIndex + 1] : null;

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
          {completed ? t("lessons.section.completed") : t("lessons.section.markComplete")}
        </button>
      </div>
      <div className="flex items-center justify-between">
        {prevSection ? (
          <Link to={`/lessons/${unitSlug}/${prevSection}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t("lessons.section.previous")}
          </Link>
        ) : <div />}
        {nextSection ? (
          <Link to={`/lessons/${unitSlug}/${nextSection}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">
            {t("lessons.section.next")}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        ) : nextUnit ? (
          <Link to={`/lessons/${nextUnit.slug}/overview`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 shadow-md transition-colors">
            {nextUnit.ctaText}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        ) : (
          <Link to={`/lessons/${unitSlug}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">
            {t("lessons.section.backToUnit")}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {isLastSection && !nextUnit && (
        <div className="flex flex-col items-center gap-1 pt-2">
          <p className="text-sm text-semantic-text-muted">{t("lessons.section.allUnitsCompletedMessage")}</p>
          <Link to="/lessons" className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t("lessons.section.backToLessons")}
          </Link>
        </div>
      )}
    </div>
  );
}
```

Key changes from the current file:
- Two new props: `isLastSection: boolean` and `nextUnit?: { slug, ctaText }`
- The right-side button now has THREE branches: `nextSection` (within-unit), `nextUnit` (cross-unit, new), or fallback `Back to Unit`
- New cross-unit button uses `bg-primary-600` (one shade darker than `bg-primary-500`) and `shadow-md` for stronger visual weight
- New tertiary block below the prev/next row, conditional on `isLastSection && !nextUnit`

- [ ] **Step 3.4: Run test, verify it passes**

```bash
npm test -- --run src/features/lessons/components/__tests__/SectionNav.test.tsx
```

Expected: 3/3 tests pass.

- [ ] **Step 3.5: Run type-check**

```bash
npm run type-check
```

Expected: a TypeScript error in `SectionPage.tsx` because it doesn't pass the new `isLastSection` prop yet. That's fine — Task 4 fixes it. If you want a clean intermediate commit, defer commit until after Task 4. If you commit here, the build is broken until Task 4 lands.

For TDD discipline, prefer to commit Task 3 + Task 4 together as a single "wire up" commit, OR keep Task 3's commit message clear that it's an intermediate state. The plan recommends combining: skip the commit at Step 3.6 below and commit both at Step 4.5.

- [ ] **Step 3.6: SKIP commit (deferred to Task 4.5)**

(No-op step — included for clarity. The full SectionNav + SectionPage update will be a single commit at Task 4.5.)

---

## Task 4: `SectionPage` plumbs new props into `SectionNav`

**Files:**
- Modify: `src/features/lessons/pages/SectionPage.tsx`

- [ ] **Step 4.1: Update `SectionPage.tsx`**

Open `src/features/lessons/pages/SectionPage.tsx`. Two changes inside the main `return` block (the one that renders `SectionNav` at the bottom):

(a) Add imports at the top, alongside the existing imports from `../data/getUnit`:

```tsx
import { getUnit, getNextAvailableUnit } from "../data/getUnit";
```

(replace the single existing `import { getUnit } from "../data/getUnit";` with the line above).

(b) Inside the component body, just before the `return` block, compute the new values:

```tsx
const isLastSection =
  validSectionKey
    ? SECTION_ORDER.indexOf(validSectionKey) === SECTION_ORDER.length - 1
    : false;

const nextUnitData = isLastSection && unitSlug
  ? getNextAvailableUnit(unitSlug)
  : undefined;

const nextUnitTitle = nextUnitData
  ? (learnerLang && nextUnitData.translations?.[learnerLang]?.title) || nextUnitData.title
  : '';

const nextUnit = nextUnitData
  ? {
      slug: nextUnitData.slug,
      ctaText: t('lessons.section.nextUnit', {
        unitLabel: `${t('lessons.unitShort', { number: nextUnitData.number })} — ${nextUnitTitle}`,
      }),
    }
  : undefined;
```

(c) Update the `SectionNav` JSX call site at the bottom of the return block:

```tsx
<SectionNav
  unitSlug={unit.slug}
  currentSection={validSectionKey}
  completed={progress.completed}
  onToggleComplete={() => toggleCompleted(unit.slug, validSectionKey)}
  isLastSection={isLastSection}
  nextUnit={nextUnit}
/>
```

The two new props (`isLastSection`, `nextUnit`) are added; the rest are unchanged.

- [ ] **Step 4.2: Run type-check**

```bash
npm run type-check
```

Expected: clean.

- [ ] **Step 4.3: Run all flashcards/lessons tests**

```bash
npm test -- --run src/features/lessons
```

Expected: green. The new `SectionNav.test.tsx` passes (per Task 3), the `getNextAvailableUnit.test.ts` passes (per Task 1), and any existing lessons tests are unaffected (they don't render `SectionNav` or call the new helper).

- [ ] **Step 4.4: Run lint**

```bash
npm run lint
```

Expected: clean.

- [ ] **Step 4.5: Commit Tasks 3 + 4 together**

```bash
git add src/features/lessons/components/SectionNav.tsx src/features/lessons/components/__tests__/SectionNav.test.tsx src/features/lessons/pages/SectionPage.tsx
git commit -m "feat(lessons): show next-unit CTA on last section + terminal-state link"
```

---

## Task 5: Verify, push, open PR

- [ ] **Step 5.1: Run the full test suite**

```bash
npm test -- --run
```

Expected: all green. Test count goes up by ~9 (6 helper tests + 3 SectionNav tests).

- [ ] **Step 5.2: Run type-check, lint, build**

```bash
npm run type-check && npm run lint && npm run build
```

Expected: all clean. Pre-existing chunk-size warning unrelated.

- [ ] **Step 5.3: Manual smoke**

Start `npm run dev` and (if the backend is needed for any unrelated path) the backend.

1. **Logged-in user, navigate to `/lessons/unit-1/activities`** → right-side button reads `Next: Unit 2 — To Be: Location` (or the Vietnamese/Thai/Chinese equivalent depending on UI language). Click it → land on `/lessons/unit-2/overview`.
2. **Navigate to `/lessons/unit-2/activities`** → right-side button is `Back to Unit`. Below the prev/next row: muted text `You've completed all available units` and a `← Back to Lessons` link. Click the link → land on `/lessons`.
3. **Navigate to `/lessons/unit-1/grammar` (any non-last section)** → right-side button is `Next →` linking to the next within-unit section (`vocabulary`). No terminal-state block below.
4. **Toggle UI language to Vietnamese on `/lessons/unit-1/activities`** → next-unit button label uses Vietnamese (e.g., `Tiếp theo: Bài 2 — ...`) with the Vietnamese unit title from `unit-2.translations.vi.title`.
5. **Toggle to Thai or Chinese on `/lessons/unit-2/activities`** → terminal-state message + Back-to-Lessons link translate accordingly.

If any of these fail, debug — most likely cause is a typo in the i18n key name or a missing nested object in one of the locale files.

- [ ] **Step 5.4: Push the branch**

```bash
git push -u origin feat/next-lesson-cta
```

- [ ] **Step 5.5: Open the PR**

```bash
gh pr create --title "feat(lessons): next-unit CTA on the last section" --body "$(cat <<'EOF'
## Summary

On the last section of a unit (\`activities\`), the right-side navigation button now reads \`Next: Unit N — Title →\` and links to the next available unit's \`overview\` section. When no next available unit exists (current is the last unit, or all subsequent units are coming-soon/locked), the button stays as \`Back to Unit\` and a tertiary block appears below: a muted message \`You've completed all available units\` plus a \`← Back to Lessons\` link.

Within-unit navigation (any non-last section) is unchanged — the existing \`Next →\` to the next section still works.

Spec: \`docs/superpowers/specs/2026-05-04-next-lesson-cta-design.md\`
Plan: \`docs/superpowers/plans/2026-05-04-next-lesson-cta.md\`

## Architecture

- New \`getNextAvailableUnit(slug)\` helper in \`src/features/lessons/data/getUnit.ts\` walks the \`units\` array forward from the current slug, skipping coming-soon/locked, returning the next \`available\` unit or undefined.
- \`SectionPage\` computes \`isLastSection\` once and passes it to \`SectionNav\` as a prop (single source of truth — no recomputation).
- \`SectionPage\` composes the CTA text via \`t('lessons.section.nextUnit', { unitLabel })\` so the prefix is translatable. \`SectionNav\` receives \`{ slug, ctaText }\` already-resolved and stays free of i18n logic.
- New visual weight on the cross-unit jump: \`bg-primary-600\` + \`shadow-md\` to signal it's a progression jump, not lateral nav.

## i18n

Three new keys per locale (en / vi / th / zh-CN) under \`lessons.section\`:

- \`nextUnit\`: \`"Next: {{unitLabel}}"\`
- \`allUnitsCompletedMessage\`: \`"You've completed all available units"\`
- \`backToLessons\`: \`"Back to Lessons"\`

## Test plan
- [x] \`npm test\` — all green; 6 new helper tests + 3 new SectionNav tests
- [x] \`npm run type-check\` — clean
- [x] \`npm run lint\` — clean
- [x] \`npm run build\` — succeeds
- [ ] **Manual: \`/lessons/unit-1/activities\` → \`Next: Unit 2 — ...\` button → click → land on \`/lessons/unit-2/overview\`**
- [ ] **Manual: \`/lessons/unit-2/activities\` → \`Back to Unit\` button + terminal-state \`Back to Lessons\` link**
- [ ] **Manual: \`/lessons/unit-1/grammar\` → within-unit \`Next →\` unchanged**
- [ ] **Manual: vi / th / zh-CN locale toggling — CTA text translates**

## Out of scope

- Skipping completed sections in cross-unit navigation (always lands on \`overview\`).
- Auto-advancing on Mark complete (user must click).
- "You completed Unit X" celebration UX.
- Cross-unit "previous" navigation symmetric to next.
EOF
)"
```

Expected: PR opened against \`main\`.

---

## Self-review notes

**Spec coverage:**
- Goal #1 (next-unit CTA) → Tasks 3 + 4. Verified by SectionNav test 2 + getNextAvailableUnit tests.
- Goal #2 (terminal-state message + Back to Lessons) → Tasks 3 (rendering) + 2 (i18n). Verified by SectionNav test 3.
- Goal #3 (within-unit nav unchanged) → SectionNav test 1 confirms.
- Goal #4 (no Mark-complete gating) → no completion check anywhere in the new branches; Tasks 3-4 don't reference \`progress.completed\`.
- Architecture (\`getNextAvailableUnit\`, single \`isLastSection\`, t()-based CTA text) → Tasks 1 + 4 deliver each.
- Defensive translation guard (\`?.translations?.[learnerLang]?.title\`) → Task 4 step (b) uses optional chaining throughout.
- Visual treatment (bg-primary-600 + shadow-md) → Task 3.3 SectionNav code includes both classes on the cross-unit branch.

**Type / identifier consistency:**
- \`getNextAvailableUnit\` is the exact name used in the helper file, the test file, and the SectionPage import.
- \`isLastSection\` and \`nextUnit\` props match between SectionPage's call site, SectionNav's prop type, and the SectionNav tests.
- \`{ slug, ctaText }\` shape matches across SectionPage's composition, SectionNav's prop type, and SectionNav's render code.

**Commit cadence:**
- 3 commits: helper + tests, locale strings, SectionNav + SectionPage wired together. Plus the spec commit \`994c766\` and tweaks commit \`0c350a6\` already on the branch.
- Tasks 3 and 4 are commit-coupled because Task 3 alone leaves the build broken (SectionPage doesn't pass the new required prop yet). Splitting them would require a temporary `?` on the prop, which we'd then have to remove — adds churn for no benefit.
