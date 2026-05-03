# Unit 2 Authoring — Design

**Status:** Approved (brainstorm)
**Date:** 2026-05-02
**Source material:** `Lesson 2 summary.txt` (root of repo), drawn from *Side by Side 1* Unit 2.
**Branch:** `feat/unit-2-content` off `main`.

## Problem

Unit 2 currently exists in `src/features/lessons/data/units.ts` as a `coming-soon` stub with metadata that does **not** match the textbook chapter we want to ship. The stub's title (*"To Be: Yes/No Questions"*) and topic (*"Classroom, countries, nationalities"*) describe a different curriculum unit. The textbook chapter the user has queued is **"To Be + Location"** — subject pronouns, the `Where + am/is/are` question pattern, contractions, and three vocabulary domains (classroom objects, places at home, places around town), plus a short greetings dialogue.

We need to:

1. Rewrite the unit-2 metadata in `units.ts` to match the textbook reality.
2. Author all 5 section files (`overview`, `grammar`, `vocabulary`, `dialogues`, `activities`) under `src/features/lessons/data/sections/unit-2/`.
3. Author the exercises that those sections reference, plus wire them into the runtime exercise map.
4. Flip the unit's `status` from `coming-soon` to `available`.

All new content is authored in **English with Vietnamese translations only** — no Thai, no Chinese — per the user's current language focus. Image generation is deferred to a follow-up PR; `imagePrompt` fields are omitted entirely.

## Constraints

- Reuse the existing `SectionBlock` union from `src/features/lessons/lesson.types.ts` — no new block types in this PR.
- The `match` exercise type is currently stubbed in `src/features/lessons/components/blocks/ExerciseBlock.tsx` and is **out of scope**; tracked as a follow-up PR.
- Image generation pipeline (`npm run lesson-images`) runs against unit 2 in a **separate** PR. Unit 2 ships text-only.
- Follow unit-1's authoring conventions (file layout, ID conventions, registration pattern) so the codebase stays uniform.

## File-level changes

### New files

- `src/features/lessons/data/sections/unit-2/overview.ts`
- `src/features/lessons/data/sections/unit-2/grammar.ts`
- `src/features/lessons/data/sections/unit-2/vocabulary.ts`
- `src/features/lessons/data/sections/unit-2/dialogues.ts`
- `src/features/lessons/data/sections/unit-2/activities.ts`
- `src/features/lessons/data/exercises/unit-2.ts`

### Modified files

- `src/features/lessons/data/units.ts` — rewrite the unit-2 entry (metadata + sections array, status `coming-soon` → `available`, drop the `th` and `zh-CN` translation rows).
- `src/features/lessons/data/registerAllSections.ts` — add 5 `import "./sections/unit-2/<key>";` lines after the unit-1 block.
- `src/features/lessons/components/blocks/ExerciseBlock.tsx` — `import * as unit2Exercises from "../../data/exercises/unit-2";` and add the 14 new `exerciseId` entries to the `exerciseMap`. Keep the existing unit-1 entries untouched.
- `src/features/lessons/__tests__/data.test.ts` — add unit-2 mirrors of the existing unit-1 `getUnit` and `getSection` tests.

## `units.ts` rewrite

Replace the existing unit-2 entry with:

```ts
{
  slug: "unit-2",
  number: 2,
  title: "To Be + Location",
  topic: "Talking about where people and things are",
  grammarFocus: "Subject pronouns + 'to be' for location ('Where is he?' / 'He's in the kitchen.')",
  estimatedMinutes: 35,
  status: "available",
  sections: [
    { key: "overview", estimatedMinutes: 3 },
    { key: "grammar", estimatedMinutes: 8 },
    { key: "vocabulary", estimatedMinutes: 8 },
    { key: "dialogues", estimatedMinutes: 6 },
    { key: "activities", estimatedMinutes: 10 },
  ],
  translations: {
    vi: {
      title: "To Be + Vị trí",
      topic: "Nói về vị trí của người và đồ vật",
      grammarFocus: "Đại từ nhân xưng + 'to be' chỉ vị trí ('Where is he?' / 'He's in the kitchen.')",
    },
  },
},
```

Notes:

- `estimatedMinutes` total = 35 (vs unit-1's 30). The bump reflects the larger vocabulary surface (35 words vs ~16) and the larger grammar surface (7 pronouns × question forms + contractions).
- `vocabulary` is bumped to 8 minutes to give learners time across all 3 sets.
- `activities` is bumped to 10 minutes for the 14 exercises.
- The Vietnamese strings keep the **English** example tokens (`Where is he?`, `He's in the kitchen.`) embedded inline — matches how unit-1's `vi` rows leave English grammar tokens (`am, is, are`) untranslated.

## Section-by-section content plan

ID convention: `u2-<section>-<n>` for blocks; `u2-<section>-<type>-<n>` for exercises (e.g., `u2-grammar-mcq-1`, `u2-activities-fb-2`). All `heading`, `text`, `callout`, `examples`, `vocab-list`, and `dialogue` blocks include `vi` translations on every translatable field.

### `overview.ts` (~7 blocks)

1. heading — *"What you'll learn"*
2. text — covers subject pronouns, the `Where + to be` question pattern, contractions, and the 3 vocabulary domains (classroom, home, town).
3. callout (`tip`) — encouragement: once these patterns are known, learners can ask about any object or place in their day.
4. heading — *"Real-world context"*
5. text — situations: pointing things out at school/work, asking where a friend is, navigating a new neighborhood.
6. heading — *"Key phrases"*
7. examples (5 items): `Where is the book? — It's on the desk.`, `Where are they? — They're in the living room.`, `She's in the kitchen.`, `We're at the supermarket.`, `It's in my bedroom.`

### `grammar.ts` (~12 blocks, 2 exercises)

Two-pass progression per Approach 1: introduce pronouns → introduce the `Where` question pattern → introduce contractions → two quick checks.

1. heading — *"Subject pronouns"*
2. text — introduce the 7 pronouns (I, he, she, it, we, you, they) and their `to be` form (am/is/are).
3. examples (3 items): `I am a student.`, `He is my friend.`, `They are at school.`
4. heading — *"Asking 'Where' with 'to be'"*
5. text — explains the pattern `Where + am/is/are + [pronoun]?` and the answer form using location prepositions.
6. examples (4 items, drawn from the textbook list): `Where am I?`, `Where is he?`, `Where are we?`, `Where are they?` — each paired with a representative answer.
7. heading — *"Contractions"*
8. text — short note that everyday speech uses contractions.
9. examples (7 items): one per row from the textbook contractions table — `english: "I am → I'm"`, `english: "He is → He's"`, etc., with `vi` field giving the equivalent in Vietnamese.
10. callout (`note`) — written English is fine without contractions, but spoken English almost always contracts.
11. heading — *"Quick check: contractions"* + exercise `u2-grammar-mcq-1`.
12. heading — *"Quick check: 'Where' questions"* + exercise `u2-grammar-mcq-2`.

### `vocabulary.ts` (3 vocab-list blocks, 35 items total)

Three vocab-list blocks separated by headings within the single `vocabulary.ts` Section file:

1. heading — *"Classroom Objects"* + 1-line text intro.
2. vocab-list — 17 items: `board`, `book`, `bookshelf`, `bulletin board`, `chair`, `clock`, `computer`, `desk`, `dictionary`, `globe`, `map`, `notebook`, `pen`, `pencil`, `ruler`, `table`, `wall`.
3. heading — *"Places at Home"* + 1-line text intro.
4. vocab-list — 9 items: `attic`, `basement`, `bathroom`, `bedroom`, `dining room`, `garage`, `kitchen`, `living room`, `yard`.
5. heading — *"Places Around Town"* + 1-line text intro.
6. vocab-list — 9 items: `bank`, `hospital`, `library`, `movie theater`, `park`, `post office`, `restaurant`, `supermarket`, `zoo`.

**Phonetics:** Per Q4-B in the brainstorm, only phonetically tricky items get a `phonetic` field. Likely candidates (~14 of 35): `bookshelf`, `bulletin board`, `dictionary`, `globe`, `attic`, `basement`, `garage`, `dining room`, `hospital`, `library`, `movie theater`, `restaurant`, `supermarket`, `zoo`. Final list locked during authoring.

### `dialogues.ts` (2 dialogue blocks)

Per Q2-C, two separate dialogue blocks:

1. heading — *"Greeting people"* + 1-line text intro.
2. dialogue — the **3 textbook lines verbatim** (speakers A/B), `vi` translations on each line:
   - A: *Hi. How are you?*
   - B: *Fine. And you?*
   - A: *Fine, thanks.*
3. heading — *"Where is everyone?"* + 1-line text intro.
4. dialogue — original **8-line scene** practicing the `Where is/are…?` pattern across rooms and objects. Sketch:
   - A: *Where's Maria?*
   - B: *She's in the kitchen.*
   - A: *Where are the kids?*
   - B: *They're in the yard.*
   - A: *Where's my book?*
   - B: *It's on the bookshelf.*
   - A: *Where's Dad?*
   - B: *He's at the supermarket.*
   - All 8 lines include `vi` translations.

### `activities.ts` (~13 blocks: 12 exercises with one heading per cluster)

3 topical clusters of 4 exercises each. Cluster heading + exercise list. See the exercise table below for IDs and content.

## Exercise list (14 total)

Mix: 11 multiple-choice + 3 fill-blank. All authored in `src/features/lessons/data/exercises/unit-2.ts`, all wired into `ExerciseBlock.tsx`'s `exerciseMap`.

### Grammar exercises (2, in `grammar.ts`)

| ID | Type | Tests | Sketch |
|---|---|---|---|
| `u2-grammar-mcq-1` | mcq | contractions | *"What is the contraction for 'She is'?"* → `She's` (vs `She'r`, `She'is`) |
| `u2-grammar-mcq-2` | mcq | Where + to be | *"Choose the correct word: '___ are they?'"* → `Where` (vs `What`, `When`) |

### Activities exercises (12, in `activities.ts`)

**Cluster: Vocabulary recognition (4)**

| ID | Type | Sketch |
|---|---|---|
| `u2-activities-mcq-1` | mcq | classroom: *"Which one do you write on?"* → `board` (vs `chair`, `clock`) |
| `u2-activities-mcq-2` | mcq | home: *"Where do you cook food?"* → `kitchen` (vs `garage`, `attic`) |
| `u2-activities-mcq-3` | mcq | town: *"Where do you borrow books?"* → `library` (vs `zoo`, `post office`) |
| `u2-activities-mcq-4` | mcq | mixed: *"Which one is in your home, not in your classroom?"* → `bedroom` (vs `bookshelf`, `dictionary`) |

**Cluster: "Where" + pronouns (4)**

| ID | Type | Sketch |
|---|---|---|
| `u2-activities-mcq-5` | mcq | *"Choose the response to 'Where is Maria?'"* → `She's in the kitchen.` (vs `He's…`, `I am Maria.`) |
| `u2-activities-fb-1` | fill-blank | *"Where ___ they?"* → `are` |
| `u2-activities-mcq-6` | mcq | *"Choose the response to 'Where are the children?'"* → `They're in the yard.` |
| `u2-activities-fb-2` | fill-blank | *"___ is the dictionary?"* → `Where` |

**Cluster: Contractions (4)**

| ID | Type | Sketch |
|---|---|---|
| `u2-activities-mcq-7` | mcq | *"What is the contraction for 'They are'?"* → `They're` |
| `u2-activities-mcq-8` | mcq | *"What is the contraction for 'It is'?"* → `It's` |
| `u2-activities-fb-3` | fill-blank | *"Make this shorter (use a contraction): 'He is at home.' → ___ at home."* → `He's` |
| `u2-activities-mcq-9` | mcq | *"Which sentence is correct?"* → `We're at the bank.` (vs `We at the bank.`, `We's at the bank.`) |

Exact wording and distractors will be polished during authoring; this table locks in count, type, and topic coverage.

## Tests & verification

### Test changes

In `src/features/lessons/__tests__/data.test.ts`:

- Add `it("returns unit-2 by slug", …)` mirroring the unit-1 block at `data.test.ts:10-13`.
- Add `it("returns auto-registered unit-2 sections", …)` mirroring the block at `data.test.ts:41-46`, asserting `getSection("unit-2", key)` is defined for all 5 keys.
- No changes to existing unit-1 tests.

### Pre-PR spot-checks

1. `npm run type-check` — confirms unit-2's `Section` / `VocabItem` / `DialogueLine` shapes match `lesson.types.ts`.
2. `npm run lint` — catches stray imports / formatting.
3. `npm test` — the new auto-register tests pass; existing tests stay green.
4. `npm run build` — full TS check + Vite production build.
5. `npm run dev` and click through `/lessons/unit-2/{overview,grammar,vocabulary,dialogues,activities}` in the browser:
   - All 5 sections render without console errors.
   - Vietnamese language toggle shows `vi` translations on every block; toggling to `th` or `zh-CN` falls back to English (no broken UI).
   - All 14 exercises are interactive — pick correct/incorrect answers and verify the feedback path works.
   - The unit-2 card on the lessons index shows `available` status (not `coming-soon`).

### Out of test scope

- E2E (Playwright) — unit-1 doesn't have unit-specific E2E coverage; unit-2 doesn't either.
- Image rendering — unit-2 ships without images.

## Acceptance criteria

- [ ] All 5 unit-2 section files exist and self-register on import.
- [ ] All 14 exercises wired into `ExerciseBlock.tsx`.
- [ ] `units.ts` unit-2 entry rewritten with `available` status, populated `sections`, and `vi`-only translations.
- [ ] Vietnamese translations present on every translatable block (no missing `vi` rows).
- [ ] `npm run build` + `npm test` green.
- [ ] Manual click-through of all 5 unit-2 routes successful.

## Out of scope (follow-ups)

- **Image generation for unit 2.** Run `npm run lesson-images -- --unit unit-2` in a separate PR after the text content lands. `imagePrompt` fields are omitted from this PR entirely.
- **`match` exercise type.** Currently stubbed in `ExerciseBlock.tsx:31-37`. A future PR will build the component and let unit 2 (and onward) use vocab-matching exercises.
- **Thai and Chinese translations for unit 2.** May be added in a future PR; this PR is EN+VI only.
- **A `pairs` block type for the contractions table.** Considered in brainstorm Approach 2 and deferred — revisit if a second unit needs the same shape.
