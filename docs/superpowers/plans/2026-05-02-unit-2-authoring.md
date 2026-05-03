# Unit 2 Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author unit 2 ("To Be + Location") — rewrite the unit-2 stub in `units.ts`, create 5 section files, wire 14 exercises, ship `available` status with EN+VI translations only.

**Architecture:** Mirror unit-1's data layout exactly. Each section is its own `.ts` file under `src/features/lessons/data/sections/unit-2/` that constructs a `Section` object and self-registers via `registerSection`. Exercises live in `src/features/lessons/data/exercises/unit-2.ts` and are wired into the runtime by extending the `exerciseMap` in `ExerciseBlock.tsx`. The single `registerAllSections.ts` bootstrap file imports each section file once. No new block types — reuse the existing `SectionBlock` union.

**Tech Stack:** React 19 + TypeScript + Vite, Vitest for tests. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-02-unit-2-authoring-design.md`.

**Branch:** `feat/unit-2-content` (already created).

---

## File structure

**Files created:**
- `src/features/lessons/data/sections/unit-2/overview.ts` — overview Section, blocks only
- `src/features/lessons/data/sections/unit-2/grammar.ts` — grammar Section + 2 exercise refs
- `src/features/lessons/data/sections/unit-2/vocabulary.ts` — vocabulary Section, 3 vocab-list blocks (35 items)
- `src/features/lessons/data/sections/unit-2/dialogues.ts` — dialogues Section, 2 dialogue blocks
- `src/features/lessons/data/sections/unit-2/activities.ts` — activities Section + 12 exercise refs
- `src/features/lessons/data/exercises/unit-2.ts` — 14 exercise data objects

**Files modified:**
- `src/features/lessons/data/units.ts` — rewrite unit-2 entry
- `src/features/lessons/data/registerAllSections.ts` — add 5 unit-2 imports
- `src/features/lessons/components/blocks/ExerciseBlock.tsx` — add 14 entries to `exerciseMap`
- `src/features/lessons/__tests__/data.test.ts` — fix 2 broken tests + add unit-2 coverage

---

## Task 1: Rewrite `units.ts` unit-2 metadata + fix existing tests

**Files:**
- Modify: `src/features/lessons/data/units.ts:38-64`
- Modify: `src/features/lessons/__tests__/data.test.ts:21-26` and `data.test.ts:57-71`

- [ ] **Step 1.1: Write failing tests for the new unit-2 metadata**

In `src/features/lessons/__tests__/data.test.ts`, **replace lines 21-26** (the existing "returns coming-soon units" test that currently uses unit-2 as the sample) with this block:

```ts
  it("returns unit-2 with the textbook metadata", () => {
    const unit = getUnit("unit-2");
    expect(unit).toBeDefined();
    expect(unit!.slug).toBe("unit-2");
    expect(unit!.title).toBe("To Be + Location");
    expect(unit!.status).toBe("available");
    expect(unit!.sections).toHaveLength(5);
    expect(unit!.translations.vi?.title).toBe("To Be + Vị trí");
    expect(unit!.translations.th).toBeUndefined();
    expect(unit!.translations["zh-CN"]).toBeUndefined();
  });

  it("returns coming-soon units", () => {
    const unit = getUnit("unit-3");
    expect(unit).toBeDefined();
    expect(unit!.status).toBe("coming-soon");
    expect(unit!.sections).toHaveLength(0);
  });
```

Then **replace the entire `describe("unit translations", …)` block at lines 57-71** with this version that iterates over each unit's *declared* translations rather than asserting all three languages are present:

```ts
describe("unit translations", () => {
  it("every declared translation row has all required fields", () => {
    for (const unit of units) {
      for (const lang of Object.keys(unit.translations) as Array<keyof typeof unit.translations>) {
        const t = unit.translations[lang]!;
        expect(t.title, `${unit.slug}.${lang}.title`).toBeTruthy();
        expect(t.topic, `${unit.slug}.${lang}.topic`).toBeTruthy();
        expect(t.grammarFocus, `${unit.slug}.${lang}.grammarFocus`).toBeTruthy();
      }
    }
  });

  it("every unit has at least a Vietnamese translation", () => {
    for (const unit of units) {
      expect(unit.translations.vi, `${unit.slug} missing vi`).toBeDefined();
    }
  });
});
```

- [ ] **Step 1.2: Run tests and confirm the new ones fail**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts`

Expected: the new "returns unit-2 with the textbook metadata" test FAILS because the current unit-2 has `title === "To Be: Yes/No Questions"` and `status === "coming-soon"`. The "every unit has at least a Vietnamese translation" test passes (current unit-2 already has `vi`).

- [ ] **Step 1.3: Rewrite the unit-2 entry in `units.ts`**

In `src/features/lessons/data/units.ts`, replace the entire unit-2 entry (the object spanning **lines 38-64**, including the trailing comma) with:

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

- [ ] **Step 1.4: Run tests and confirm they pass**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts`

Expected: ALL tests in `data.test.ts` PASS, including the new ones.

- [ ] **Step 1.5: Commit**

```bash
git add src/features/lessons/data/units.ts src/features/lessons/__tests__/data.test.ts
git commit -m "feat(lessons): rewrite unit-2 metadata for To Be + Location"
```

---

## Task 2: Create unit-2 overview section

**Files:**
- Create: `src/features/lessons/data/sections/unit-2/overview.ts`
- Modify: `src/features/lessons/data/registerAllSections.ts:11`
- Modify: `src/features/lessons/__tests__/data.test.ts` (extend the unit-1 sections test)

- [ ] **Step 2.1: Write failing test for unit-2 overview**

In `src/features/lessons/__tests__/data.test.ts`, immediately after the existing `it("returns auto-registered unit-1 sections", …)` block (after `data.test.ts:47`), add:

```ts
  it("returns auto-registered unit-2 overview", () => {
    expect(getSection("unit-2", "overview")).toBeDefined();
  });
```

- [ ] **Step 2.2: Run test and confirm it fails**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts -t "unit-2 overview"`

Expected: FAIL — `getSection("unit-2", "overview")` returns undefined because no section file exists yet.

- [ ] **Step 2.3: Create the overview section file**

Create `src/features/lessons/data/sections/unit-2/overview.ts` with:

```ts
// src/features/lessons/data/sections/unit-2/overview.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const overview: Section = {
  id: "u2-overview",
  unitSlug: "unit-2",
  key: "overview",
  blocks: [
    {
      id: "u2-ov-1",
      type: "heading",
      content: "What you'll learn",
      translations: { vi: "Những gì bạn sẽ học" },
    },
    {
      id: "u2-ov-2",
      type: "text",
      content: "In this unit, you'll learn how to ask and answer where people and things are. You'll meet the seven subject pronouns (I, you, he, she, it, we, they), the question pattern 'Where is/are…?', everyday contractions like 'I'm' and 'he's', and vocabulary for classroom objects, rooms at home, and places around town.",
      translations: {
        vi: "Trong bài học này, bạn sẽ học cách hỏi và trả lời về vị trí của người và đồ vật. Bạn sẽ làm quen với bảy đại từ nhân xưng (I, you, he, she, it, we, they), mẫu câu hỏi 'Where is/are…?', các dạng rút gọn quen thuộc như 'I'm' và 'he's', cùng từ vựng về đồ vật trong lớp học, các phòng trong nhà, và các địa điểm trong thị trấn.",
      },
    },
    {
      id: "u2-ov-3",
      type: "callout",
      variant: "tip",
      content: "Once you know these patterns, you can ask about almost any object or place in your day.",
      translations: {
        vi: "Khi đã nắm được các mẫu câu này, bạn có thể hỏi về hầu hết mọi đồ vật hoặc địa điểm trong ngày của mình.",
      },
    },
    {
      id: "u2-ov-4",
      type: "heading",
      content: "Real-world context",
      translations: { vi: "Bối cảnh thực tế" },
    },
    {
      id: "u2-ov-5",
      type: "text",
      content: "Pointing things out at school, asking where a friend or family member is, finding your way around a new neighborhood, or describing where you live — all of these everyday situations use the patterns you'll practice here.",
      translations: {
        vi: "Chỉ đồ vật ở trường, hỏi xem một người bạn hoặc người thân đang ở đâu, tìm đường ở khu phố mới, hay miêu tả nơi bạn sống — tất cả những tình huống hằng ngày này đều dùng các mẫu câu mà bạn sẽ luyện tập ở đây.",
      },
    },
    {
      id: "u2-ov-6",
      type: "heading",
      content: "Key phrases",
      translations: { vi: "Cụm từ quan trọng" },
    },
    {
      id: "u2-ov-7",
      type: "examples",
      items: [
        { id: "u2-ex-where-book", english: "Where is the book? — It's on the desk.", translations: { vi: "Quyển sách ở đâu? — Nó ở trên bàn." } },
        { id: "u2-ex-where-they", english: "Where are they? — They're in the living room.", translations: { vi: "Họ đang ở đâu? — Họ đang ở trong phòng khách." } },
        { id: "u2-ex-shes-kitchen", english: "She's in the kitchen.", translations: { vi: "Cô ấy đang ở trong bếp." } },
        { id: "u2-ex-were-supermarket", english: "We're at the supermarket.", translations: { vi: "Chúng tôi đang ở siêu thị." } },
        { id: "u2-ex-its-bedroom", english: "It's in my bedroom.", translations: { vi: "Nó ở trong phòng ngủ của tôi." } },
      ],
    },
  ],
};

registerSection(overview);
export default overview;
```

- [ ] **Step 2.4: Add the import to the bootstrap**

In `src/features/lessons/data/registerAllSections.ts`, replace **line 11** (the comment `// Add unit-2 (and beyond) section imports here as they come online.`) with:

```ts
import "./sections/unit-2/overview";
// Add unit-2 (and beyond) section imports here as they come online.
```

- [ ] **Step 2.5: Run test and confirm it passes**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts -t "unit-2 overview"`

Expected: PASS.

- [ ] **Step 2.6: Commit**

```bash
git add src/features/lessons/data/sections/unit-2/overview.ts src/features/lessons/data/registerAllSections.ts src/features/lessons/__tests__/data.test.ts
git commit -m "feat(lessons): add unit-2 overview section"
```

---

## Task 3: Create unit-2 grammar section

**Files:**
- Create: `src/features/lessons/data/sections/unit-2/grammar.ts`
- Modify: `src/features/lessons/data/registerAllSections.ts`
- Modify: `src/features/lessons/__tests__/data.test.ts`

The grammar section references two exerciseIds (`u2-grammar-mcq-1`, `u2-grammar-mcq-2`) that don't exist yet — they'll be wired in Task 7/8. The section file itself just lists them as `exercise` blocks; rendering "Exercise not found" until wired is fine.

- [ ] **Step 3.1: Write failing test for unit-2 grammar**

In `src/features/lessons/__tests__/data.test.ts`, after the unit-2 overview test added in Task 2, add:

```ts
  it("returns auto-registered unit-2 grammar", () => {
    expect(getSection("unit-2", "grammar")).toBeDefined();
  });
```

- [ ] **Step 3.2: Run test and confirm it fails**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts -t "unit-2 grammar"`

Expected: FAIL.

- [ ] **Step 3.3: Create the grammar section file**

Create `src/features/lessons/data/sections/unit-2/grammar.ts` with:

```ts
// src/features/lessons/data/sections/unit-2/grammar.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const grammar: Section = {
  id: "u2-grammar",
  unitSlug: "unit-2",
  key: "grammar",
  blocks: [
    {
      id: "u2-gr-1",
      type: "heading",
      content: "Subject pronouns",
      translations: { vi: "Đại từ nhân xưng" },
    },
    {
      id: "u2-gr-2",
      type: "text",
      content: "In English, every sentence needs a subject. We use these subject pronouns to talk about people and things: I, you, he, she, it, we, they. Each pronoun pairs with the right form of 'to be' — am, is, or are.",
      translations: {
        vi: "Trong tiếng Anh, mỗi câu cần có chủ ngữ. Chúng ta dùng các đại từ nhân xưng sau để nói về người và đồ vật: I, you, he, she, it, we, they. Mỗi đại từ đi với dạng đúng của 'to be' — am, is, hoặc are.",
      },
    },
    {
      id: "u2-gr-3",
      type: "examples",
      items: [
        { id: "u2-ex-i-student", english: "I am a student.", translations: { vi: "Tôi là học sinh." } },
        { id: "u2-ex-he-friend", english: "He is my friend.", translations: { vi: "Anh ấy là bạn tôi." } },
        { id: "u2-ex-they-school", english: "They are at school.", translations: { vi: "Họ đang ở trường." } },
      ],
    },
    {
      id: "u2-gr-4",
      type: "heading",
      content: "Asking 'Where' with 'to be'",
      translations: { vi: "Hỏi 'Where' với 'to be'" },
    },
    {
      id: "u2-gr-5",
      type: "text",
      content: "To ask about location, put 'Where' at the beginning, then the correct form of 'to be' (am, is, are), then the subject. The answer uses the same form of 'to be' plus a location.",
      translations: {
        vi: "Để hỏi về vị trí, đặt 'Where' ở đầu câu, rồi đến dạng đúng của 'to be' (am, is, are), rồi đến chủ ngữ. Câu trả lời dùng cùng dạng 'to be' kèm theo địa điểm.",
      },
    },
    {
      id: "u2-gr-6",
      type: "examples",
      items: [
        { id: "u2-ex-where-am-i", english: "Where am I? — You're in the kitchen.", translations: { vi: "Tôi đang ở đâu? — Bạn đang ở trong bếp." } },
        { id: "u2-ex-where-is-he", english: "Where is he? — He's in the bedroom.", translations: { vi: "Anh ấy đang ở đâu? — Anh ấy đang ở trong phòng ngủ." } },
        { id: "u2-ex-where-are-we", english: "Where are we? — We're in the living room.", translations: { vi: "Chúng ta đang ở đâu? — Chúng ta đang ở trong phòng khách." } },
        { id: "u2-ex-where-are-they", english: "Where are they? — They're at the park.", translations: { vi: "Họ đang ở đâu? — Họ đang ở trong công viên." } },
      ],
    },
    {
      id: "u2-gr-7",
      type: "heading",
      content: "Contractions",
      translations: { vi: "Dạng rút gọn (contractions)" },
    },
    {
      id: "u2-gr-8",
      type: "text",
      content: "In everyday speech, English speakers shorten 'I am' to 'I'm', 'he is' to 'he's', and so on. These shortened forms are called contractions.",
      translations: {
        vi: "Trong giao tiếp hằng ngày, người nói tiếng Anh rút gọn 'I am' thành 'I'm', 'he is' thành 'he's', v.v. Những dạng rút gọn này được gọi là contractions.",
      },
    },
    {
      id: "u2-gr-9",
      type: "examples",
      items: [
        { id: "u2-ex-c-i", english: "I am → I'm", translations: { vi: "I am → I'm (tôi)" } },
        { id: "u2-ex-c-he", english: "He is → He's", translations: { vi: "He is → He's (anh ấy)" } },
        { id: "u2-ex-c-she", english: "She is → She's", translations: { vi: "She is → She's (cô ấy)" } },
        { id: "u2-ex-c-it", english: "It is → It's", translations: { vi: "It is → It's (nó)" } },
        { id: "u2-ex-c-we", english: "We are → We're", translations: { vi: "We are → We're (chúng ta / chúng tôi)" } },
        { id: "u2-ex-c-you", english: "You are → You're", translations: { vi: "You are → You're (bạn / các bạn)" } },
        { id: "u2-ex-c-they", english: "They are → They're", translations: { vi: "They are → They're (họ)" } },
      ],
    },
    {
      id: "u2-gr-10",
      type: "callout",
      variant: "note",
      content: "Written English is fine without contractions, but spoken English almost always uses them.",
      translations: {
        vi: "Tiếng Anh viết không cần dùng dạng rút gọn cũng được, nhưng tiếng Anh nói gần như luôn dùng chúng.",
      },
    },
    {
      id: "u2-gr-11-h",
      type: "heading",
      content: "Quick check: contractions",
      translations: { vi: "Kiểm tra nhanh: dạng rút gọn" },
    },
    { id: "u2-gr-11", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-grammar-mcq-1" },
    {
      id: "u2-gr-12-h",
      type: "heading",
      content: "Quick check: 'Where' questions",
      translations: { vi: "Kiểm tra nhanh: câu hỏi 'Where'" },
    },
    { id: "u2-gr-12", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-grammar-mcq-2" },
  ],
};

registerSection(grammar);
export default grammar;
```

- [ ] **Step 3.4: Add the import to the bootstrap**

In `src/features/lessons/data/registerAllSections.ts`, immediately after the `import "./sections/unit-2/overview";` line added in Task 2, add:

```ts
import "./sections/unit-2/grammar";
```

- [ ] **Step 3.5: Run test and confirm it passes**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts -t "unit-2 grammar"`

Expected: PASS.

- [ ] **Step 3.6: Commit**

```bash
git add src/features/lessons/data/sections/unit-2/grammar.ts src/features/lessons/data/registerAllSections.ts src/features/lessons/__tests__/data.test.ts
git commit -m "feat(lessons): add unit-2 grammar section"
```

---

## Task 4: Create unit-2 vocabulary section

**Files:**
- Create: `src/features/lessons/data/sections/unit-2/vocabulary.ts`
- Modify: `src/features/lessons/data/registerAllSections.ts`
- Modify: `src/features/lessons/__tests__/data.test.ts`

35 vocab items across 3 sets. Phonetics included only on the 13 items flagged as phonetically tricky (matching the spec's Q4-B decision and unit-1's lowercase respelling style).

- [ ] **Step 4.1: Write failing test for unit-2 vocabulary**

In `src/features/lessons/__tests__/data.test.ts`, after the unit-2 grammar test, add:

```ts
  it("returns auto-registered unit-2 vocabulary with all 35 items", () => {
    const section = getSection("unit-2", "vocabulary");
    expect(section).toBeDefined();
    const vocabBlocks = section!.blocks.filter((b) => b.type === "vocab-list");
    expect(vocabBlocks).toHaveLength(3);
    const totalItems = vocabBlocks.reduce(
      (sum, b) => sum + (b.type === "vocab-list" ? b.items.length : 0),
      0,
    );
    expect(totalItems).toBe(35);
  });
```

- [ ] **Step 4.2: Run test and confirm it fails**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts -t "unit-2 vocabulary"`

Expected: FAIL.

- [ ] **Step 4.3: Create the vocabulary section file**

Create `src/features/lessons/data/sections/unit-2/vocabulary.ts` with:

```ts
// src/features/lessons/data/sections/unit-2/vocabulary.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const vocabulary: Section = {
  id: "u2-vocabulary",
  unitSlug: "unit-2",
  key: "vocabulary",
  blocks: [
    {
      id: "u2-vocab-1-h",
      type: "heading",
      content: "Classroom Objects",
      translations: { vi: "Đồ vật trong lớp học" },
    },
    {
      id: "u2-vocab-1-t",
      type: "text",
      content: "Words for the things you see and use every day in a classroom.",
      translations: { vi: "Các từ chỉ những đồ vật bạn thấy và sử dụng hằng ngày trong lớp học." },
    },
    {
      id: "u2-vocab-1",
      type: "vocab-list",
      items: [
        { id: "u2-v-board", word: "board", translations: { vi: "bảng" } },
        { id: "u2-v-book", word: "book", translations: { vi: "sách" } },
        { id: "u2-v-bookshelf", word: "bookshelf", phonetic: "book-shelf", translations: { vi: "kệ sách" } },
        { id: "u2-v-bulletin-board", word: "bulletin board", phonetic: "bul-uh-tin bord", translations: { vi: "bảng tin" } },
        { id: "u2-v-chair", word: "chair", translations: { vi: "ghế" } },
        { id: "u2-v-clock", word: "clock", translations: { vi: "đồng hồ" } },
        { id: "u2-v-computer", word: "computer", translations: { vi: "máy tính" } },
        { id: "u2-v-desk", word: "desk", translations: { vi: "bàn học" } },
        { id: "u2-v-dictionary", word: "dictionary", phonetic: "dik-shuh-ner-ee", translations: { vi: "từ điển" } },
        { id: "u2-v-globe", word: "globe", phonetic: "glohb", translations: { vi: "quả địa cầu" } },
        { id: "u2-v-map", word: "map", translations: { vi: "bản đồ" } },
        { id: "u2-v-notebook", word: "notebook", translations: { vi: "vở" } },
        { id: "u2-v-pen", word: "pen", translations: { vi: "bút mực" } },
        { id: "u2-v-pencil", word: "pencil", translations: { vi: "bút chì" } },
        { id: "u2-v-ruler", word: "ruler", translations: { vi: "thước kẻ" } },
        { id: "u2-v-table", word: "table", translations: { vi: "bàn" } },
        { id: "u2-v-wall", word: "wall", translations: { vi: "tường" } },
      ],
    },
    {
      id: "u2-vocab-2-h",
      type: "heading",
      content: "Places at Home",
      translations: { vi: "Các phòng trong nhà" },
    },
    {
      id: "u2-vocab-2-t",
      type: "text",
      content: "Names of the rooms and spaces in a typical home.",
      translations: { vi: "Tên các phòng và khu vực trong một ngôi nhà điển hình." },
    },
    {
      id: "u2-vocab-2",
      type: "vocab-list",
      items: [
        { id: "u2-v-attic", word: "attic", phonetic: "at-ik", translations: { vi: "gác mái" } },
        { id: "u2-v-basement", word: "basement", phonetic: "beys-muhnt", translations: { vi: "tầng hầm" } },
        { id: "u2-v-bathroom", word: "bathroom", translations: { vi: "phòng tắm" } },
        { id: "u2-v-bedroom", word: "bedroom", translations: { vi: "phòng ngủ" } },
        { id: "u2-v-dining-room", word: "dining room", phonetic: "dahy-ning room", translations: { vi: "phòng ăn" } },
        { id: "u2-v-garage", word: "garage", phonetic: "guh-rahzh", translations: { vi: "nhà để xe" } },
        { id: "u2-v-kitchen", word: "kitchen", translations: { vi: "nhà bếp" } },
        { id: "u2-v-living-room", word: "living room", translations: { vi: "phòng khách" } },
        { id: "u2-v-yard", word: "yard", translations: { vi: "sân" } },
      ],
    },
    {
      id: "u2-vocab-3-h",
      type: "heading",
      content: "Places Around Town",
      translations: { vi: "Các địa điểm trong thị trấn" },
    },
    {
      id: "u2-vocab-3-t",
      type: "text",
      content: "Common places you'll go in everyday life around town.",
      translations: { vi: "Những địa điểm quen thuộc bạn sẽ đến trong cuộc sống hằng ngày quanh thị trấn." },
    },
    {
      id: "u2-vocab-3",
      type: "vocab-list",
      items: [
        { id: "u2-v-bank", word: "bank", translations: { vi: "ngân hàng" } },
        { id: "u2-v-hospital", word: "hospital", phonetic: "hos-pi-tl", translations: { vi: "bệnh viện" } },
        { id: "u2-v-library", word: "library", phonetic: "lahy-brer-ee", translations: { vi: "thư viện" } },
        { id: "u2-v-movie-theater", word: "movie theater", phonetic: "moo-vee thee-uh-ter", translations: { vi: "rạp chiếu phim" } },
        { id: "u2-v-park", word: "park", translations: { vi: "công viên" } },
        { id: "u2-v-post-office", word: "post office", translations: { vi: "bưu điện" } },
        { id: "u2-v-restaurant", word: "restaurant", phonetic: "res-tuh-rahnt", translations: { vi: "nhà hàng" } },
        { id: "u2-v-supermarket", word: "supermarket", phonetic: "soo-per-mahr-kit", translations: { vi: "siêu thị" } },
        { id: "u2-v-zoo", word: "zoo", translations: { vi: "sở thú" } },
      ],
    },
  ],
};

registerSection(vocabulary);
export default vocabulary;
```

- [ ] **Step 4.4: Add the import to the bootstrap**

In `src/features/lessons/data/registerAllSections.ts`, after the unit-2 grammar import added in Task 3, add:

```ts
import "./sections/unit-2/vocabulary";
```

- [ ] **Step 4.5: Run test and confirm it passes**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts -t "unit-2 vocabulary"`

Expected: PASS — exactly 35 vocab items across 3 vocab-list blocks.

- [ ] **Step 4.6: Commit**

```bash
git add src/features/lessons/data/sections/unit-2/vocabulary.ts src/features/lessons/data/registerAllSections.ts src/features/lessons/__tests__/data.test.ts
git commit -m "feat(lessons): add unit-2 vocabulary section (35 words)"
```

---

## Task 5: Create unit-2 dialogues section

**Files:**
- Create: `src/features/lessons/data/sections/unit-2/dialogues.ts`
- Modify: `src/features/lessons/data/registerAllSections.ts`
- Modify: `src/features/lessons/__tests__/data.test.ts`

Two dialogue blocks: the textbook 3-line greeting (verbatim) and an original 8-line scene practicing `Where is/are…?` patterns.

- [ ] **Step 5.1: Write failing test for unit-2 dialogues**

In `src/features/lessons/__tests__/data.test.ts`, after the unit-2 vocabulary test, add:

```ts
  it("returns auto-registered unit-2 dialogues with two dialogue blocks", () => {
    const section = getSection("unit-2", "dialogues");
    expect(section).toBeDefined();
    const dialogueBlocks = section!.blocks.filter((b) => b.type === "dialogue");
    expect(dialogueBlocks).toHaveLength(2);
  });
```

- [ ] **Step 5.2: Run test and confirm it fails**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts -t "unit-2 dialogues"`

Expected: FAIL.

- [ ] **Step 5.3: Create the dialogues section file**

Create `src/features/lessons/data/sections/unit-2/dialogues.ts` with:

```ts
// src/features/lessons/data/sections/unit-2/dialogues.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const dialogues: Section = {
  id: "u2-dialogues",
  unitSlug: "unit-2",
  key: "dialogues",
  blocks: [
    {
      id: "u2-dl-1-h",
      type: "heading",
      content: "Greeting people",
      translations: { vi: "Chào hỏi mọi người" },
    },
    {
      id: "u2-dl-1-t",
      type: "text",
      content: "A short, friendly exchange you'll hear every day. Two people meet and ask how each other is doing.",
      translations: {
        vi: "Một cuộc trao đổi ngắn, thân thiện mà bạn sẽ nghe hằng ngày. Hai người gặp nhau và hỏi thăm nhau.",
      },
    },
    {
      id: "u2-dl-1",
      type: "dialogue",
      lines: [
        { id: "u2-d1-1", speaker: "A", text: "Hi. How are you?", translations: { vi: "Chào. Bạn khoẻ không?" } },
        { id: "u2-d1-2", speaker: "B", text: "Fine. And you?", translations: { vi: "Khoẻ. Còn bạn thì sao?" } },
        { id: "u2-d1-3", speaker: "A", text: "Fine, thanks.", translations: { vi: "Khoẻ, cảm ơn." } },
      ],
    },
    {
      id: "u2-dl-2-h",
      type: "heading",
      content: "Where is everyone?",
      translations: { vi: "Mọi người đang ở đâu?" },
    },
    {
      id: "u2-dl-2-t",
      type: "text",
      content: "Two people at home check in on where their family members and things are. Notice the 'Where is/are…?' pattern and the contractions.",
      translations: {
        vi: "Hai người ở nhà hỏi nhau xem các thành viên trong gia đình và đồ vật đang ở đâu. Hãy chú ý mẫu câu 'Where is/are…?' và các dạng rút gọn.",
      },
    },
    {
      id: "u2-dl-2",
      type: "dialogue",
      lines: [
        { id: "u2-d2-1", speaker: "Alex", text: "Where's Maria?", translations: { vi: "Maria đang ở đâu?" } },
        { id: "u2-d2-2", speaker: "Linh", text: "She's in the kitchen.", translations: { vi: "Cô ấy đang ở trong bếp." } },
        { id: "u2-d2-3", speaker: "Alex", text: "Where are the kids?", translations: { vi: "Bọn trẻ đang ở đâu?" } },
        { id: "u2-d2-4", speaker: "Linh", text: "They're in the yard.", translations: { vi: "Chúng đang ở ngoài sân." } },
        { id: "u2-d2-5", speaker: "Alex", text: "Where's my book?", translations: { vi: "Quyển sách của tôi ở đâu?" } },
        { id: "u2-d2-6", speaker: "Linh", text: "It's on the bookshelf.", translations: { vi: "Nó ở trên kệ sách." } },
        { id: "u2-d2-7", speaker: "Alex", text: "Where's Dad?", translations: { vi: "Bố đang ở đâu?" } },
        { id: "u2-d2-8", speaker: "Linh", text: "He's at the supermarket.", translations: { vi: "Bố đang ở siêu thị." } },
      ],
    },
  ],
};

registerSection(dialogues);
export default dialogues;
```

- [ ] **Step 5.4: Add the import to the bootstrap**

In `src/features/lessons/data/registerAllSections.ts`, after the unit-2 vocabulary import added in Task 4, add:

```ts
import "./sections/unit-2/dialogues";
```

- [ ] **Step 5.5: Run test and confirm it passes**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts -t "unit-2 dialogues"`

Expected: PASS.

- [ ] **Step 5.6: Commit**

```bash
git add src/features/lessons/data/sections/unit-2/dialogues.ts src/features/lessons/data/registerAllSections.ts src/features/lessons/__tests__/data.test.ts
git commit -m "feat(lessons): add unit-2 dialogues section"
```

---

## Task 6: Create unit-2 activities section

**Files:**
- Create: `src/features/lessons/data/sections/unit-2/activities.ts`
- Modify: `src/features/lessons/data/registerAllSections.ts`
- Modify: `src/features/lessons/__tests__/data.test.ts`

12 exercise blocks grouped under 3 cluster headings. The exerciseIds reference exercises that don't exist yet — wired up in Tasks 7-8.

- [ ] **Step 6.1: Write failing test for unit-2 activities**

In `src/features/lessons/__tests__/data.test.ts`, after the unit-2 dialogues test, add:

```ts
  it("returns auto-registered unit-2 activities with 12 exercises", () => {
    const section = getSection("unit-2", "activities");
    expect(section).toBeDefined();
    const exerciseBlocks = section!.blocks.filter((b) => b.type === "exercise");
    expect(exerciseBlocks).toHaveLength(12);
  });
```

- [ ] **Step 6.2: Run test and confirm it fails**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts -t "unit-2 activities"`

Expected: FAIL.

- [ ] **Step 6.3: Create the activities section file**

Create `src/features/lessons/data/sections/unit-2/activities.ts` with:

```ts
// src/features/lessons/data/sections/unit-2/activities.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const activities: Section = {
  id: "u2-activities",
  unitSlug: "unit-2",
  key: "activities",
  blocks: [
    {
      id: "u2-act-1",
      type: "heading",
      content: "Practice what you've learned",
      translations: { vi: "Luyện tập những gì bạn đã học" },
    },
    {
      id: "u2-act-2",
      type: "text",
      content: "Complete the exercises below to reinforce the vocabulary, the 'Where' question pattern, and the contractions you saw in this unit.",
      translations: {
        vi: "Hoàn thành các bài tập dưới đây để củng cố từ vựng, mẫu câu hỏi 'Where', và các dạng rút gọn mà bạn đã học trong bài này.",
      },
    },
    {
      id: "u2-act-3",
      type: "callout",
      variant: "tip",
      content: "Try to answer from memory before looking back at the grammar or vocabulary section.",
      translations: {
        vi: "Hãy cố gắng trả lời bằng trí nhớ trước khi xem lại phần ngữ pháp hoặc từ vựng.",
      },
    },

    {
      id: "u2-act-cluster-vocab-h",
      type: "heading",
      content: "Vocabulary recognition",
      translations: { vi: "Nhận biết từ vựng" },
    },
    { id: "u2-act-vocab-1", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-1" },
    { id: "u2-act-vocab-2", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-2" },
    { id: "u2-act-vocab-3", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-3" },
    { id: "u2-act-vocab-4", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-4" },

    {
      id: "u2-act-cluster-where-h",
      type: "heading",
      content: "'Where' + pronouns",
      translations: { vi: "'Where' + đại từ" },
    },
    { id: "u2-act-where-1", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-5" },
    { id: "u2-act-where-2", type: "exercise", exerciseType: "fill-blank", exerciseId: "u2-activities-fb-1" },
    { id: "u2-act-where-3", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-6" },
    { id: "u2-act-where-4", type: "exercise", exerciseType: "fill-blank", exerciseId: "u2-activities-fb-2" },

    {
      id: "u2-act-cluster-contr-h",
      type: "heading",
      content: "Contractions",
      translations: { vi: "Dạng rút gọn" },
    },
    { id: "u2-act-contr-1", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-7" },
    { id: "u2-act-contr-2", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-8" },
    { id: "u2-act-contr-3", type: "exercise", exerciseType: "fill-blank", exerciseId: "u2-activities-fb-3" },
    { id: "u2-act-contr-4", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-9" },
  ],
};

registerSection(activities);
export default activities;
```

- [ ] **Step 6.4: Add the import to the bootstrap**

In `src/features/lessons/data/registerAllSections.ts`, after the unit-2 dialogues import added in Task 5, add:

```ts
import "./sections/unit-2/activities";
```

- [ ] **Step 6.5: Run test and confirm it passes**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts -t "unit-2 activities"`

Expected: PASS.

- [ ] **Step 6.6: Commit**

```bash
git add src/features/lessons/data/sections/unit-2/activities.ts src/features/lessons/data/registerAllSections.ts src/features/lessons/__tests__/data.test.ts
git commit -m "feat(lessons): add unit-2 activities section (12 exercises)"
```

---

## Task 7: Create the unit-2 exercises data file

**Files:**
- Create: `src/features/lessons/data/exercises/unit-2.ts`
- Modify: `src/features/lessons/__tests__/data.test.ts`

14 exercise objects (2 grammar + 12 activities). Pure data — no imports beyond the type module.

- [ ] **Step 7.1: Write failing test for the exercises file**

In `src/features/lessons/__tests__/data.test.ts`, **add this import at the top of the file** (alongside the existing imports):

```ts
import * as unit2Exercises from "../data/exercises/unit-2";
```

Then **append a new `describe` block at the end of the file**:

```ts
describe("unit-2 exercises", () => {
  it("exports all 14 expected exercise objects with correct IDs", () => {
    const expected: Record<string, string> = {
      grammarMcqContractions: "u2-grammar-mcq-1",
      grammarMcqWhereWord: "u2-grammar-mcq-2",
      activitiesVocabClassroomMcq: "u2-activities-mcq-1",
      activitiesVocabHomeMcq: "u2-activities-mcq-2",
      activitiesVocabTownMcq: "u2-activities-mcq-3",
      activitiesVocabMixedMcq: "u2-activities-mcq-4",
      activitiesWhereResponseMariaMcq: "u2-activities-mcq-5",
      activitiesWhereAreFb: "u2-activities-fb-1",
      activitiesWhereResponseChildrenMcq: "u2-activities-mcq-6",
      activitiesWhereDictionaryFb: "u2-activities-fb-2",
      activitiesContractionTheyMcq: "u2-activities-mcq-7",
      activitiesContractionItMcq: "u2-activities-mcq-8",
      activitiesContractionShortenFb: "u2-activities-fb-3",
      activitiesContractionCorrectMcq: "u2-activities-mcq-9",
    };
    for (const [exportName, id] of Object.entries(expected)) {
      const exercise = (unit2Exercises as Record<string, { id: string }>)[exportName];
      expect(exercise, `missing export: ${exportName}`).toBeDefined();
      expect(exercise.id, `${exportName} has wrong id`).toBe(id);
    }
  });
});
```

- [ ] **Step 7.2: Run test and confirm it fails**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts -t "unit-2 exercises"`

Expected: FAIL — module `../data/exercises/unit-2` does not exist (or the imports throw).

- [ ] **Step 7.3: Create the exercises data file**

Create `src/features/lessons/data/exercises/unit-2.ts` with:

```ts
// src/features/lessons/data/exercises/unit-2.ts
import type { McqExercise, FillBlankExercise } from "@/components/exercises/exercises.types";

// ----- Grammar exercises (in grammar.ts) -----

export const grammarMcqContractions: McqExercise = {
  id: "u2-grammar-mcq-1",
  question: "What is the contraction for \"She is\"?",
  options: [
    { id: "a", text: "She'r" },
    { id: "b", text: "She's" },
    { id: "c", text: "She'is" },
  ],
  correctOptionId: "b",
};

export const grammarMcqWhereWord: McqExercise = {
  id: "u2-grammar-mcq-2",
  question: "Choose the correct word: \"___ are they?\"",
  options: [
    { id: "a", text: "What" },
    { id: "b", text: "When" },
    { id: "c", text: "Where" },
  ],
  correctOptionId: "c",
};

// ----- Activities: vocabulary recognition -----

export const activitiesVocabClassroomMcq: McqExercise = {
  id: "u2-activities-mcq-1",
  question: "Which one do you write on?",
  options: [
    { id: "a", text: "board" },
    { id: "b", text: "chair" },
    { id: "c", text: "clock" },
  ],
  correctOptionId: "a",
};

export const activitiesVocabHomeMcq: McqExercise = {
  id: "u2-activities-mcq-2",
  question: "Where do you cook food?",
  options: [
    { id: "a", text: "garage" },
    { id: "b", text: "attic" },
    { id: "c", text: "kitchen" },
  ],
  correctOptionId: "c",
};

export const activitiesVocabTownMcq: McqExercise = {
  id: "u2-activities-mcq-3",
  question: "Where do you borrow books?",
  options: [
    { id: "a", text: "zoo" },
    { id: "b", text: "library" },
    { id: "c", text: "post office" },
  ],
  correctOptionId: "b",
};

export const activitiesVocabMixedMcq: McqExercise = {
  id: "u2-activities-mcq-4",
  question: "Which one is in your home, not in your classroom?",
  options: [
    { id: "a", text: "bookshelf" },
    { id: "b", text: "dictionary" },
    { id: "c", text: "bedroom" },
  ],
  correctOptionId: "c",
};

// ----- Activities: 'Where' + pronouns -----

export const activitiesWhereResponseMariaMcq: McqExercise = {
  id: "u2-activities-mcq-5",
  question: "Choose the response to: \"Where is Maria?\"",
  options: [
    { id: "a", text: "He's in the bedroom." },
    { id: "b", text: "I am Maria." },
    { id: "c", text: "She's in the kitchen." },
  ],
  correctOptionId: "c",
};

export const activitiesWhereAreFb: FillBlankExercise = {
  id: "u2-activities-fb-1",
  beforeBlank: "Where",
  afterBlank: "they?",
  correctAnswer: "are",
};

export const activitiesWhereResponseChildrenMcq: McqExercise = {
  id: "u2-activities-mcq-6",
  question: "Choose the response to: \"Where are the children?\"",
  options: [
    { id: "a", text: "They're in the yard." },
    { id: "b", text: "He's in the yard." },
    { id: "c", text: "It's in the yard." },
  ],
  correctOptionId: "a",
};

export const activitiesWhereDictionaryFb: FillBlankExercise = {
  id: "u2-activities-fb-2",
  beforeBlank: "",
  afterBlank: "is the dictionary?",
  correctAnswer: "Where",
};

// ----- Activities: contractions -----

export const activitiesContractionTheyMcq: McqExercise = {
  id: "u2-activities-mcq-7",
  question: "What is the contraction for \"They are\"?",
  options: [
    { id: "a", text: "They's" },
    { id: "b", text: "They're" },
    { id: "c", text: "They'r" },
  ],
  correctOptionId: "b",
};

export const activitiesContractionItMcq: McqExercise = {
  id: "u2-activities-mcq-8",
  question: "What is the contraction for \"It is\"?",
  options: [
    { id: "a", text: "It're" },
    { id: "b", text: "Its'" },
    { id: "c", text: "It's" },
  ],
  correctOptionId: "c",
};

export const activitiesContractionShortenFb: FillBlankExercise = {
  id: "u2-activities-fb-3",
  beforeBlank: "Make this shorter (use a contraction): \"He is at home.\" →",
  afterBlank: "at home.",
  correctAnswer: "He's",
};

export const activitiesContractionCorrectMcq: McqExercise = {
  id: "u2-activities-mcq-9",
  question: "Which sentence is correct?",
  options: [
    { id: "a", text: "We at the bank." },
    { id: "b", text: "We's at the bank." },
    { id: "c", text: "We're at the bank." },
  ],
  correctOptionId: "c",
};
```

- [ ] **Step 7.4: Run test and confirm it passes**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts -t "unit-2 exercises"`

Expected: PASS — all 14 exercises exported with correct IDs.

- [ ] **Step 7.5: Commit**

```bash
git add src/features/lessons/data/exercises/unit-2.ts src/features/lessons/__tests__/data.test.ts
git commit -m "feat(lessons): add unit-2 exercise data (14 items)"
```

---

## Task 8: Wire unit-2 exercises into `ExerciseBlock.tsx`

**Files:**
- Modify: `src/features/lessons/components/blocks/ExerciseBlock.tsx`

The `exerciseMap` const is the runtime lookup. Until each exerciseId appears here, the renderer shows "Exercise not found" for any unit-2 exercise.

There's no clean way to test this without exporting `exerciseMap` (currently a private module-level const). We'll rely on TypeScript to catch shape mismatches at build time, and on the dev-server smoke check in Task 9 to confirm runtime wiring.

- [ ] **Step 8.1: Add the unit-2 import**

In `src/features/lessons/components/blocks/ExerciseBlock.tsx`, immediately after **line 4** (`import * as unit1Exercises from "../../data/exercises/unit-1";`) add:

```ts
import * as unit2Exercises from "../../data/exercises/unit-2";
```

- [ ] **Step 8.2: Add the 14 unit-2 entries to `exerciseMap`**

In the same file, **inside the `exerciseMap` object literal** (currently at lines 18-28, ending with the entry for `u1-activities-mcq-6`), add the following 14 entries before the closing `}`. Order them grouped by section + matching the spec table:

```ts
  // unit-2 grammar
  "u2-grammar-mcq-1": { type: "multiple-choice", data: unit2Exercises.grammarMcqContractions },
  "u2-grammar-mcq-2": { type: "multiple-choice", data: unit2Exercises.grammarMcqWhereWord },
  // unit-2 activities: vocabulary recognition
  "u2-activities-mcq-1": { type: "multiple-choice", data: unit2Exercises.activitiesVocabClassroomMcq },
  "u2-activities-mcq-2": { type: "multiple-choice", data: unit2Exercises.activitiesVocabHomeMcq },
  "u2-activities-mcq-3": { type: "multiple-choice", data: unit2Exercises.activitiesVocabTownMcq },
  "u2-activities-mcq-4": { type: "multiple-choice", data: unit2Exercises.activitiesVocabMixedMcq },
  // unit-2 activities: 'Where' + pronouns
  "u2-activities-mcq-5": { type: "multiple-choice", data: unit2Exercises.activitiesWhereResponseMariaMcq },
  "u2-activities-fb-1": { type: "fill-blank", data: unit2Exercises.activitiesWhereAreFb },
  "u2-activities-mcq-6": { type: "multiple-choice", data: unit2Exercises.activitiesWhereResponseChildrenMcq },
  "u2-activities-fb-2": { type: "fill-blank", data: unit2Exercises.activitiesWhereDictionaryFb },
  // unit-2 activities: contractions
  "u2-activities-mcq-7": { type: "multiple-choice", data: unit2Exercises.activitiesContractionTheyMcq },
  "u2-activities-mcq-8": { type: "multiple-choice", data: unit2Exercises.activitiesContractionItMcq },
  "u2-activities-fb-3": { type: "fill-blank", data: unit2Exercises.activitiesContractionShortenFb },
  "u2-activities-mcq-9": { type: "multiple-choice", data: unit2Exercises.activitiesContractionCorrectMcq },
```

- [ ] **Step 8.3: Run TypeScript check**

Run: `npm run type-check`

Expected: PASS — no type errors. (TypeScript verifies each entry's `data` matches the declared `type` in the `TaggedExercise` union, so a wrong-type entry would fail the build.)

- [ ] **Step 8.4: Commit**

```bash
git add src/features/lessons/components/blocks/ExerciseBlock.tsx
git commit -m "feat(lessons): wire unit-2 exercises into ExerciseBlock"
```

---

## Task 9: Final verification (build, lint, tests, manual walkthrough)

**Files:** None modified.

This task does not introduce code — it confirms the work meets the acceptance criteria from the spec.

- [ ] **Step 9.1: Run the full test suite**

Run: `npm test`

Expected: ALL tests PASS, including all unit-2 tests added in Tasks 1-7. No regressions in unit-1, flashcard, or other test files.

- [ ] **Step 9.2: Run TypeScript check**

Run: `npm run type-check`

Expected: PASS — no type errors anywhere.

- [ ] **Step 9.3: Run lint**

Run: `npm run lint`

Expected: PASS — no lint errors. (Warnings are acceptable if pre-existing.)

- [ ] **Step 9.4: Run the production build**

Run: `npm run build`

Expected: build succeeds. Vite output shows all unit-2 chunks bundled.

- [ ] **Step 9.5: Start the dev server and walk through unit-2**

Run: `npm run dev`

In a browser at `http://localhost:5173`, navigate to:
1. The lessons index — verify the unit-2 card now shows `available` (not `coming-soon`) and the new title `To Be + Location`.
2. `/lessons/unit-2/overview` — verify all 7 blocks render, no console errors.
3. `/lessons/unit-2/grammar` — verify all 14 blocks render, both Quick check exercises are interactive (try a wrong then a right answer on each).
4. `/lessons/unit-2/vocabulary` — verify all 3 vocab clusters render with 17/9/9 items, phonetics show on the 13 flagged items.
5. `/lessons/unit-2/dialogues` — verify both dialogue blocks render, all 11 lines (3 + 8) display speakers correctly.
6. `/lessons/unit-2/activities` — verify all 12 exercises render under their cluster headings, each is interactive (try wrong then right answer on at least 4 of them, including both fill-blanks).
7. Switch the language toggle to **Vietnamese** — verify each section's `vi` translations appear on every translatable block.
8. Switch the language toggle to **Thai** or **Chinese** — verify the UI gracefully falls back to English (no broken UI, no missing-translation crashes). Unit cards on the index should also fall back to English title/topic for unit-2.

Stop the dev server when done (Ctrl+C).

- [ ] **Step 9.6: Confirm acceptance criteria from the spec**

Re-read `docs/superpowers/specs/2026-05-02-unit-2-authoring-design.md` "Acceptance criteria" section and tick off:

- All 5 unit-2 section files exist and self-register on import.
- All 14 exercises wired into `ExerciseBlock.tsx`.
- `units.ts` unit-2 entry rewritten with `available` status, populated `sections`, and `vi`-only translations.
- Vietnamese translations present on every translatable block (no missing `vi` rows).
- `npm run build` + `npm test` green.
- Manual click-through of all 5 unit-2 routes successful.

- [ ] **Step 9.7: Push the branch and open a PR**

Run:

```bash
git push -u origin feat/unit-2-content
gh pr create --title "feat(lessons): add unit 2 (To Be + Location)" --body "$(cat <<'EOF'
## Summary
- Rewrites the unit-2 stub in `units.ts` to match the *Side by Side 1* Unit 2 textbook chapter ("To Be + Location").
- Adds all 5 section files under `src/features/lessons/data/sections/unit-2/`: overview, grammar, vocabulary (35 words across 3 sets), dialogues (greeting + 8-line location scene), activities (12 exercises).
- Adds 14 exercise objects (2 grammar + 12 activities) and wires them into `ExerciseBlock.tsx`.
- Flips status from `coming-soon` to `available`. EN + Vietnamese only — Thai and Chinese deferred.
- Updates `data.test.ts` to fix the two assertions that depended on unit-2 being a stub.

Spec: `docs/superpowers/specs/2026-05-02-unit-2-authoring-design.md`
Plan: `docs/superpowers/plans/2026-05-02-unit-2-authoring.md`

## Test plan
- [ ] `npm test` green
- [ ] `npm run type-check` clean
- [ ] `npm run lint` clean
- [ ] `npm run build` succeeds
- [ ] Manual walkthrough of all 5 unit-2 routes in dev
- [ ] Vietnamese translations render correctly; Thai/Chinese fall back to English without breakage

## Follow-ups (not in this PR)
- Image generation for unit 2 (`npm run lesson-images -- --unit unit-2`).
- `match` exercise type (currently stubbed in `ExerciseBlock.tsx`).
- Thai and Chinese translations for unit 2.
EOF
)"
```

Expected: PR opened against `main`. Capture the URL and report back.

---

## Self-review notes

**Spec coverage:** Each spec section maps to a task — units.ts rewrite (Task 1), 5 section files (Tasks 2-6), exercises file (Task 7), ExerciseBlock wiring (Task 8), tests + verification (Tasks 1-9). The "Out of scope" follow-ups in the spec are explicitly preserved in the PR description.

**Translation completeness:** Every translatable block in every section file has a `vi` translation. The unit-2 entry in `units.ts` has only `vi` (per Q5).

**Type consistency:** All exerciseIds referenced in section files (`u2-grammar-mcq-1`, `u2-grammar-mcq-2`, `u2-activities-mcq-1` through `u2-activities-mcq-9`, `u2-activities-fb-1` through `u2-activities-fb-3`) match exactly the IDs assigned in `data/exercises/unit-2.ts` and the keys used in `ExerciseBlock.tsx`'s `exerciseMap`.

**TDD discipline:** Tasks 1-7 each begin with a failing test, then make it pass with the smallest implementation, then commit. Task 8 has no automated test (TypeScript catches shape errors at build). Task 9 is verification-only.

**Commit cadence:** 9 commits total, one per task. Each is a self-contained, working state that runs `npm test` green up to that point.
