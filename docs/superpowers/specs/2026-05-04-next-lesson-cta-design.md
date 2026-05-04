# Next-lesson CTA on the last section — design

**Status:** approved (spec under review)
**Author:** afk-bro
**Last updated:** 2026-05-04

## Problem

When a user finishes the last section of a unit (`activities`, the final entry in `SECTION_ORDER`), `SectionNav` swaps the within-unit "Next →" button for a "Back to Unit" link. There's no path forward to the next unit's content — the user has to click "Back to Unit", then click into the next unit themselves.

`SectionNav.tsx:44-54` is where this happens today. The data model (`src/features/lessons/data/units.ts`) already has units in array order with a `status: "available" | "coming-soon" | "locked"` field, so resolving "next available unit" is a straightforward lookup that hasn't been wired in.

## Goals

1. On the **last section** of a unit, when there's a next available unit, render `Next: Unit N — Title →` as the right-side primary action. Clicking it navigates to that unit's first section (`overview`).
2. When there's no next available unit (current is the last unit, OR all subsequent units are `coming-soon`/`locked`), render `Back to Unit` as today plus a tertiary `Back to Lessons` link with copy that acknowledges the end-state: `All available units completed — Back to Lessons`.
3. Within-unit navigation (any non-last section) is unchanged — the existing "Next →" still goes to the next section in the same unit.
4. The "next unit" CTA does NOT gate on `Mark complete`. It appears the moment the user lands on the last section.

## Non-goals

- Skipping completed sections in cross-unit navigation. The next-unit link always lands on `overview` of the destination unit, regardless of any completion state on that unit's sections.
- Auto-advancing the user without a click. The user always opts into navigation.
- Showing a celebration on unit completion (separate UX concern).
- Cross-unit "previous" navigation. The within-unit `← Previous` stops at the first section of the unit; we don't add a "previous unit" symmetric to the new "next unit".

## Approach

A small data helper (`getNextAvailableUnit`) plus a couple of branches in `SectionNav`. No state-management changes; all derivable from the existing `units` array and the current `unitSlug`/`sectionKey` route params.

### Helper: `getNextAvailableUnit`

Lives in `src/features/lessons/data/getUnit.ts` next to the existing `getUnit` function.

Signature:

```ts
export function getNextAvailableUnit(currentSlug: string): Unit | undefined;
```

Behavior:

1. Guard against malformed input: if `units` is empty, return `undefined`.
2. Find the index of `currentSlug` in `units`. If not found, return `undefined`.
3. Walk forward through `units` from `index + 1`. Return the first unit with `status === "available"`.
4. If no remaining unit qualifies (all subsequent are `coming-soon`/`locked`, or there are none), return `undefined`.

The walk-forward approach is intentional: it skips coming-soon units rather than hard-stopping at them, so a future "unit-2 available, unit-3 coming-soon, unit-4 available" configuration would correctly surface unit-4 as the next available. Today there's no such gap (units 1-2 available, 3-4 coming-soon), but the logic should be future-proof.

### "Last section" detection

Explicit, not implied. `SectionNav` already imports `SECTION_ORDER` and computes `currentIndex`. Add:

```ts
const isLastSection = currentIndex === SECTION_ORDER.length - 1;
```

The right-side button branches on `isLastSection`, then on whether `nextUnit` is defined.

### `SectionNav` updated rendering

Right-side primary button:

| `isLastSection` | `nextUnit` | Right-side button |
|---|---|---|
| `false` | (any) | `Next →` to next section in this unit (unchanged) |
| `true` | defined | **`Next: Unit N — Title →`** to `/lessons/<next-slug>/overview` (new) |
| `true` | undefined | `Back to Unit` (today's behavior) |

Below the prev/next row, a tertiary "back to lessons" link appears only in the terminal-state case (`isLastSection && !nextUnit`):

```
[← Previous section]                                 [Back to Unit]
              [← All available units completed — Back to Lessons]
```

Tertiary visual weight: text-link styling (no filled button), centered under the prev/back row, smaller font.

### Visual treatment of `Next: Unit N — Title →`

This is a progression jump (across units), not lateral navigation (within a unit), so it earns slightly stronger visual weight than the within-unit "Next section" button while staying in the same shape language:

- Same dimensions / shape as within-unit "Next section": `inline-flex items-center gap-2 px-4 py-2.5 rounded-lg`
- One shade darker base: `bg-primary-600` instead of `bg-primary-500`
- Stronger hover: `hover:bg-primary-700`
- Subtle elevation: add `shadow-md`
- The whole element is a `<Link>` — full hit area, not just the text

The within-unit "Next section" stays exactly as it is today.

## Architecture / data flow

```
SectionPage:
  isLastSection = SECTION_ORDER.indexOf(currentSection) === SECTION_ORDER.length - 1
  nextUnitData = isLastSection ? getNextAvailableUnit(unit.slug) : undefined
  nextUnit = nextUnitData
    ? { slug: nextUnitData.slug,
        label: `${t('lessons.unitShort', { number: nextUnitData.number })} — ${
          (learnerLang && nextUnitData.translations[learnerLang]?.title) || nextUnitData.title
        }` }
    : undefined

SectionPage renders SectionNav with:
  - unitSlug, currentSection, completed, onToggleComplete (existing)
  - nextUnit?: { slug: string, label: string }    (NEW — already-formatted label)

SectionNav internally:
  - isLastSection = SECTION_ORDER.indexOf(currentSection) === SECTION_ORDER.length - 1
  - branch the right-side button on (isLastSection, nextUnit)
  - render the terminal-state "Back to Lessons" tertiary link iff isLastSection && !nextUnit
```

`SectionPage` does both the data lookup AND the i18n label composition because it already has the `t` function and `learnerLang`. `SectionNav` receives an already-formatted `{ slug, label }` and stays a presentational component free of i18n logic.

The `isLastSection` computation is duplicated in both `SectionPage` (to decide whether to call `getNextAvailableUnit`) and `SectionNav` (to decide which right-side button to render). Acceptable because each side needs its own gate; the alternative — passing `isLastSection` as a prop — wouldn't simplify either side meaningfully and would couple the two on a derived boolean.

## i18n

Two new keys per locale (`en`, `vi`, `th`, `zh-CN`):

```json
"lessons.section.nextUnit": "Next: {{unitLabel}}",
"lessons.section.allUnitsCompleted": "All available units completed — Back to Lessons"
```

`unitLabel` is composed at the call site in `SectionPage` using existing patterns:

```ts
const unitLabel = `${t('lessons.unitShort', { number: nextUnit.number })} — ${
  (learnerLang && nextUnit.translations[learnerLang]?.title) || nextUnit.title
}`;
```

The `lessons.unitShort` key (e.g., `"Unit {{number}}"` in en) and the per-unit translation lookup pattern are already in use at `SectionPage.tsx:69`. No new i18n primitives needed.

Per existing fallback (`fallbackLng: 'en'`), th/zh-CN locales without their own translation of the new keys fall back to English.

## Components touched

| File | Change |
|---|---|
| `src/features/lessons/data/getUnit.ts` | Add `getNextAvailableUnit` named export with the walk-forward logic + empty-array guard |
| `src/features/lessons/data/__tests__/getNextAvailableUnit.test.ts` | New unit test file |
| `src/features/lessons/components/SectionNav.tsx` | Accept `nextUnit?: { slug, label }` prop; branch right-side button; render tertiary "Back to Lessons" in terminal state |
| `src/features/lessons/pages/SectionPage.tsx` | Compute `nextUnit` and `unitLabel`, pass into `SectionNav` |
| `src/locales/{en,vi,th,zh-CN}/<lang>.json` | Add `lessons.section.nextUnit` and `lessons.section.allUnitsCompleted` per locale |

`useLessonProgressStore`, `lesson.types.ts`, the data accessor `getUnit`, and other sections of the lessons feature are untouched.

`SectionNav` accepts the resolved unit *label* (already-formatted string) rather than a full `Unit` object — keeps the component free of i18n and translation-lookup logic.

## Testing

### Unit tests for `getNextAvailableUnit`

In `src/features/lessons/data/__tests__/getNextAvailableUnit.test.ts`. The test mocks the `units` import to control fixtures.

| Case | Expectation |
|---|---|
| `unit-1` with normal `units` (1, 2 available; 3, 4 coming-soon) | Returns `unit-2` |
| `unit-2` with same units | Returns `undefined` (next two are coming-soon, then nothing) |
| `unit-1` in a configuration where `unit-2` is coming-soon but `unit-3` is available | Returns `unit-3` (skips the coming-soon) |
| Unknown slug `"unit-99"` | Returns `undefined` |
| Empty `units` array | Returns `undefined` |
| `units = [{...slug: "u-1", status: "available"}]` (single unit) called with its own slug | Returns `undefined` |

### Component tests for `SectionNav`

Update existing tests (or add new ones) to cover:

| Scenario | Expectation |
|---|---|
| Non-last section (`grammar`) | Renders within-unit `Next →` link to next section; no "Back to Lessons" |
| Last section + `nextUnit` provided | Renders `Next: Unit 2 — To Be: Location →` (or whatever the test fixture's label is) linking to `/lessons/unit-2/overview`; no "Back to Lessons" |
| Last section + `nextUnit` undefined | Renders `Back to Unit` AND tertiary `← All available units completed — Back to Lessons` link going to `/lessons` |

Existing tests that don't pass `nextUnit` continue to work — the new prop is optional (`nextUnit?: ...`), default `undefined`. In the non-last-section branch, `nextUnit` is never read, so its absence is harmless.

### Manual verify

1. Log in, open `/lessons/unit-1/activities`. Right-side button reads `Next: Unit 2 — To Be: Location →`. Click it → land on `/lessons/unit-2/overview`.
2. Open `/lessons/unit-2/activities`. Right-side button is `Back to Unit`. Below the row, a `← All available units completed — Back to Lessons` text link is visible. Click it → land on `/lessons`.
3. Open `/lessons/unit-1/grammar` (or any non-last section). Right-side button is `Next →` linking to the next section in unit-1. No "Back to Lessons" link below.
4. Toggle UI language to Vietnamese on `/lessons/unit-1/activities`. The next-unit label should render in Vietnamese (using `nextUnit.translations.vi.title` if present).

## Acceptance criteria

- [ ] Last section of unit-1 surfaces a `Next: Unit 2 — ...` button linking to `/lessons/unit-2/overview`.
- [ ] Last section of unit-2 surfaces `Back to Unit` plus the terminal-state `Back to Lessons` link.
- [ ] Non-last sections retain the existing within-unit "Next section →" behavior unchanged.
- [ ] `getNextAvailableUnit` handles unknown slugs and empty arrays without throwing.
- [ ] Locale toggling renders the next-unit label in the active learner language with English fallback.
- [ ] `npm test` and `npm run type-check` clean.
