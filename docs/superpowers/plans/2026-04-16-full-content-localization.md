# Full Content Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Localize the remaining hardcoded English lesson content (unit metadata, section names, heading/text/callout blocks) for Thai, Vietnamese, and Simplified Chinese learners, with clean English fallback.

**Architecture:** Follow the existing localization pattern used by vocab / examples / dialogues: data declares a `translations` object keyed by `LearnerLanguage`; components call `getLearnerLanguage(i18n.language)` and look up the translation, falling back to the English default. Section names are UI labels handled by i18next keys (not per-unit data), since the locale files already have `lessons.detail.sections.*` populated for all four languages.

**Tech Stack:** React 19 + TypeScript, Vitest + @testing-library/react, react-i18next, Tailwind.

**Spec:** `docs/superpowers/specs/2026-04-15-full-content-localization-design.md`

---

## File Structure

### Modified

| File | Responsibility |
|------|---|
| `src/features/lessons/lesson.types.ts` | Add required `translations` to `Unit`; add optional `translations` to heading/text/callout `SectionBlock` variants. |
| `src/features/lessons/data/units.ts` | Populate `translations` on all four units (th/vi/zh-CN). |
| `src/features/lessons/data/sections/unit-1/overview.ts` | Add `translations` to heading/text/callout blocks. |
| `src/features/lessons/data/sections/unit-1/grammar.ts` | Same. |
| `src/features/lessons/data/sections/unit-1/vocabulary.ts` | Same. |
| `src/features/lessons/data/sections/unit-1/dialogues.ts` | Same. |
| `src/features/lessons/data/sections/unit-1/activities.ts` | Same. |
| `src/features/lessons/components/UnitCard.tsx` | Learner-language lookup for title/topic/grammarFocus. |
| `src/features/lessons/pages/UnitHub.tsx` | Learner-language lookup for unit header. |
| `src/features/lessons/components/SectionCard.tsx` | Switch from `section.title` to i18n key `lessons.detail.sections.${section.key}`. |
| `src/features/lessons/pages/SectionPage.tsx` | Sticky header uses i18n key instead of `section.title`. |
| `src/features/lessons/components/SectionRenderer.tsx` | Pass `block.translations` through to heading/text/callout blocks. |
| `src/features/lessons/components/blocks/TextBlock.tsx` | Accept optional `translations` prop; learner-language lookup with fallback. |
| `src/features/lessons/components/blocks/HeadingBlock.tsx` | Same. |
| `src/features/lessons/components/blocks/CalloutBlock.tsx` | Same. |

### Created

| File | Responsibility |
|------|---|
| `src/features/lessons/__tests__/UnitCard.test.tsx` | Renders translated fields per learner language; English fallback. |
| `src/features/lessons/__tests__/UnitHub.test.tsx` | Unit header renders translated topic/grammarFocus. |
| `src/features/lessons/__tests__/TextBlock.test.tsx` | Learner-language lookup + fallback. |
| `src/features/lessons/__tests__/HeadingBlock.test.tsx` | Same. |
| `src/features/lessons/__tests__/CalloutBlock.test.tsx` | Same (per variant). |

### Untouched (deliberate)

`ExamplesBlock`, `VocabListBlock`, `DialogueBlock`, `ExerciseBlock` — already localized or English-only by design.

---

## Task 1: Extend types and populate Unit translations

**Files:**
- Modify: `src/features/lessons/lesson.types.ts`
- Modify: `src/features/lessons/data/units.ts`
- Modify: `src/features/lessons/__tests__/data.test.ts`

- [ ] **Step 1: Add a failing test for unit translations coverage**

In `src/features/lessons/__tests__/data.test.ts`, add this import alongside the existing imports at the top of the file:

```ts
import { units } from "../data/units";
```

Then append this `describe` block to the bottom of the file (after the existing `describe("getSection + sectionRegistry", …)` block):

```ts
describe("unit translations", () => {
  const LANGS = ["th", "vi", "zh-CN"] as const;

  it("every unit has translations for th/vi/zh-CN", () => {
    for (const unit of units) {
      for (const lang of LANGS) {
        const t = unit.translations[lang];
        expect(t, `${unit.slug} missing ${lang}`).toBeDefined();
        expect(t!.title, `${unit.slug}.${lang}.title`).toBeTruthy();
        expect(t!.topic, `${unit.slug}.${lang}.topic`).toBeTruthy();
        expect(t!.grammarFocus, `${unit.slug}.${lang}.grammarFocus`).toBeTruthy();
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts`
Expected: FAIL — TypeScript error (no `translations` on `Unit`) or undefined access.

- [ ] **Step 3: Extend `Unit` and `SectionBlock` types**

In `src/features/lessons/lesson.types.ts`, replace the `Unit` type with:

```ts
export type Unit = {
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

And replace the `SectionBlock` union with:

```ts
export type SectionBlock =
  | { id: string; type: "heading"; content: string; translations?: Partial<Record<LearnerLanguage, string>> }
  | { id: string; type: "text"; content: string; translations?: Partial<Record<LearnerLanguage, string>> }
  | { id: string; type: "examples"; items: ExampleItem[] }
  | { id: string; type: "vocab-list"; items: VocabItem[] }
  | { id: string; type: "dialogue"; lines: DialogueLine[] }
  | { id: string; type: "exercise"; exerciseType: ExerciseType; exerciseId: string }
  | { id: string; type: "callout"; variant: "tip" | "note" | "warning"; content: string; translations?: Partial<Record<LearnerLanguage, string>> };
```

- [ ] **Step 4: Populate unit translations**

Replace the entire `units` export in `src/features/lessons/data/units.ts`:

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
      { key: "overview", estimatedMinutes: 3 },
      { key: "grammar", estimatedMinutes: 8 },
      { key: "vocabulary", estimatedMinutes: 5 },
      { key: "dialogues", estimatedMinutes: 6 },
      { key: "activities", estimatedMinutes: 8 },
    ],
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
    translations: {
      th: {
        title: "To Be: คำถามใช่/ไม่ใช่",
        topic: "ห้องเรียน ประเทศ สัญชาติ",
        grammarFocus: "คำสรรพนามประธาน และ 'to be' รูปเอกพจน์/พหูพจน์",
      },
      vi: {
        title: "To Be: Câu hỏi Có/Không",
        topic: "Lớp học, các quốc gia, quốc tịch",
        grammarFocus: "Đại từ nhân xưng & 'to be' số ít/số nhiều",
      },
      "zh-CN": {
        title: "To Be: 是非疑问句",
        topic: "教室、国家、国籍",
        grammarFocus: "主语代词与单复数 'to be'",
      },
    },
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
    translations: {
      th: {
        title: "กาลปัจจุบันต่อเนื่อง",
        topic: "กิจกรรมประจำวัน",
        grammarFocus: "ปัจจุบันต่อเนื่อง (am/is/are + -ing)",
      },
      vi: {
        title: "Thì Hiện tại Tiếp diễn",
        topic: "Các hoạt động hàng ngày",
        grammarFocus: "Hiện tại tiếp diễn (am/is/are + -ing)",
      },
      "zh-CN": {
        title: "现在进行时",
        topic: "日常活动",
        grammarFocus: "现在进行时 (am/is/are + -ing)",
      },
    },
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
    translations: {
      th: {
        title: "To Be: คำตอบสั้น และคำคุณศัพท์แสดงความเป็นเจ้าของ",
        topic: "สมาชิกในครอบครัวและคำอธิบาย",
        grammarFocus: "คำคุณศัพท์แสดงความเป็นเจ้าของ (my, your, his, her…)",
      },
      vi: {
        title: "To Be: Câu trả lời ngắn & Tính từ sở hữu",
        topic: "Thành viên gia đình & miêu tả",
        grammarFocus: "Tính từ sở hữu (my, your, his, her…)",
      },
      "zh-CN": {
        title: "To Be: 简短回答与物主形容词",
        topic: "家庭成员和描述",
        grammarFocus: "物主形容词 (my, your, his, her…)",
      },
    },
  },
];
```

- [ ] **Step 5: Run tests**

Run: `npm test -- src/features/lessons/__tests__/data.test.ts`
Expected: PASS — all tests including the new `unit translations` suite.

Also run: `npm run type-check`
Expected: no new TS errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/lessons/lesson.types.ts src/features/lessons/data/units.ts src/features/lessons/__tests__/data.test.ts
git commit -m "feat(lessons): add translations to Unit and block types"
```

---

## Task 2: UnitCard renders localized title/topic/grammarFocus

**Files:**
- Create: `src/features/lessons/__tests__/UnitCard.test.tsx`
- Modify: `src/features/lessons/components/UnitCard.tsx`

- [ ] **Step 1: Write failing test**

Create `src/features/lessons/__tests__/UnitCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UnitCard from "../components/UnitCard";
import type { Unit } from "../lesson.types";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "count" in opts) return `${key}:${opts.count}`;
      if (opts && "number" in opts) return `${key}:${opts.number}`;
      return key;
    },
    i18n: mockI18n,
  }),
}));

const unit: Unit = {
  slug: "unit-1",
  number: 1,
  title: "To Be: Introduction",
  topic: "Personal information & meeting people",
  grammarFocus: "Present tense of 'to be' (am / is / are)",
  estimatedMinutes: 30,
  status: "available",
  sections: [],
  translations: {
    th: {
      title: "To Be: บทนำ",
      topic: "ข้อมูลส่วนตัวและการพบปะผู้คน",
      grammarFocus: "กาลปัจจุบันของ 'to be' (am / is / are)",
    },
  },
};

describe("UnitCard", () => {
  it("renders English by default", () => {
    mockI18n.language = "en";
    render(<MemoryRouter><UnitCard unit={unit} /></MemoryRouter>);
    expect(screen.getByText("To Be: Introduction")).toBeInTheDocument();
    expect(screen.getByText("Personal information & meeting people")).toBeInTheDocument();
    expect(screen.getByText("Present tense of 'to be' (am / is / are)")).toBeInTheDocument();
  });

  it("renders Thai when learner language is th", () => {
    mockI18n.language = "th";
    render(<MemoryRouter><UnitCard unit={unit} /></MemoryRouter>);
    expect(screen.getByText("To Be: บทนำ")).toBeInTheDocument();
    expect(screen.getByText("ข้อมูลส่วนตัวและการพบปะผู้คน")).toBeInTheDocument();
  });

  it("falls back to English when the learner translation is missing", () => {
    mockI18n.language = "vi";
    render(<MemoryRouter><UnitCard unit={unit} /></MemoryRouter>);
    expect(screen.getByText("To Be: Introduction")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/lessons/__tests__/UnitCard.test.tsx`
Expected: FAIL — Thai test fails because the component still renders English.

- [ ] **Step 3: Implement learner-language lookup**

Replace the contents of `src/features/lessons/components/UnitCard.tsx`:

```tsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, Lock } from "lucide-react";
import type { Unit } from "../lesson.types";
import { getLearnerLanguage } from "../utils/learnerLanguage";

type Props = { unit: Unit };

export default function UnitCard({ unit }: Props) {
  const { t, i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);
  const localized = learnerLang ? unit.translations[learnerLang] : undefined;
  const title = localized?.title ?? unit.title;
  const topic = localized?.topic ?? unit.topic;
  const grammarFocus = localized?.grammarFocus ?? unit.grammarFocus;

  const isAvailable = unit.status === "available";
  const isLocked = unit.status === "locked";

  const className = `block ${
    isAvailable ? "card card-interactive" : "card opacity-60 cursor-not-allowed"
  }`;

  const statusBadge = (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
      isAvailable
        ? "bg-semantic-success/10 text-semantic-success"
        : "bg-semantic-surface-2 text-semantic-text-muted"
    }`}>
      {(isLocked || !isAvailable) && <Lock className="w-3 h-3" aria-hidden="true" />}
      {isAvailable ? t("lessons.status.available") : isLocked ? t("lessons.status.locked") : t("lessons.status.comingSoon")}
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
      <h2 className="text-lg font-semibold text-semantic-text mb-1">{title}</h2>
      <p className="text-sm text-semantic-text-muted mb-2">{topic}</p>
      <p className="text-xs text-semantic-subtle mb-4">{grammarFocus}</p>
      <div className="flex items-center gap-1 text-xs text-semantic-subtle">
        <Clock className="w-3 h-3" aria-hidden="true" />
        {t("lessons.card.estMinutes", { count: unit.estimatedMinutes })}
      </div>
    </>
  );

  if (isAvailable) {
    return <Link to={`/lessons/${unit.slug}`} className={className}>{content}</Link>;
  }
  return <div className={className} aria-disabled="true">{content}</div>;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/features/lessons/__tests__/UnitCard.test.tsx`
Expected: PASS — all three cases (en default, th localized, vi fallback).

- [ ] **Step 5: Commit**

```bash
git add src/features/lessons/components/UnitCard.tsx src/features/lessons/__tests__/UnitCard.test.tsx
git commit -m "feat(lessons): localize UnitCard title/topic/grammarFocus"
```

---

## Task 3: UnitHub renders localized unit header

**Files:**
- Create: `src/features/lessons/__tests__/UnitHub.test.tsx`
- Modify: `src/features/lessons/pages/UnitHub.tsx`

- [ ] **Step 1: Write failing test**

Create `src/features/lessons/__tests__/UnitHub.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import UnitHub from "../pages/UnitHub";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "number" in opts) return `${key}:${opts.number}`;
      if (opts && "count" in opts) return `${key}:${opts.count}`;
      return key;
    },
    i18n: mockI18n,
  }),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/lessons/:unitSlug" element={<UnitHub />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("UnitHub header", () => {
  beforeEach(() => {
    mockI18n.language = "en";
  });

  it("renders English topic and grammarFocus by default", () => {
    renderAt("/lessons/unit-1");
    expect(screen.getByText("Personal information & meeting people")).toBeInTheDocument();
    expect(screen.getByText("Present tense of 'to be' (am / is / are)")).toBeInTheDocument();
  });

  it("renders Thai topic and grammarFocus when language is th", () => {
    mockI18n.language = "th";
    renderAt("/lessons/unit-1");
    expect(screen.getByText("ข้อมูลส่วนตัวและการพบปะผู้คน")).toBeInTheDocument();
    expect(screen.getByText("กาลปัจจุบันของ 'to be' (am / is / are)")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/lessons/__tests__/UnitHub.test.tsx`
Expected: FAIL — Thai test fails because UnitHub still reads `unit.topic`/`unit.grammarFocus` directly.

- [ ] **Step 3: Implement learner-language lookup in UnitHub**

In `src/features/lessons/pages/UnitHub.tsx`, add the import after the existing imports:

```ts
import { getLearnerLanguage } from "../utils/learnerLanguage";
```

Then replace the `return` block's header section. Find:

```tsx
const { t } = useTranslation();
```

Replace with:

```tsx
const { t, i18n } = useTranslation();
const learnerLang = getLearnerLanguage(i18n.language);
```

Find the title/topic/grammarFocus rendering in the main return (lines beginning `<h1 className="text-2xl font-bold text-semantic-text mb-1">`):

```tsx
<h1 className="text-2xl font-bold text-semantic-text mb-1">
  {t("lessons.unitShort", { number: unit.number })} — {unit.title}
</h1>
<p className="text-semantic-text-muted mb-1">{unit.topic}</p>
<p className="text-sm text-semantic-subtle mb-6">{unit.grammarFocus}</p>
```

Replace with:

```tsx
<h1 className="text-2xl font-bold text-semantic-text mb-1">
  {t("lessons.unitShort", { number: unit.number })} — {(learnerLang && unit.translations[learnerLang]?.title) ?? unit.title}
</h1>
<p className="text-semantic-text-muted mb-1">{(learnerLang && unit.translations[learnerLang]?.topic) ?? unit.topic}</p>
<p className="text-sm text-semantic-subtle mb-6">{(learnerLang && unit.translations[learnerLang]?.grammarFocus) ?? unit.grammarFocus}</p>
```

Apply the same replacement to the earlier "coming-soon" branch's `<h1>` (which also reads `unit.title`):

Find:

```tsx
<h1 className="text-2xl font-bold text-semantic-text mb-3">
  {t("lessons.unitShort", { number: unit.number })} — {unit.title}
</h1>
<p className="text-semantic-text-muted">{t("lessons.comingSoonMessage")}</p>
```

Replace with:

```tsx
<h1 className="text-2xl font-bold text-semantic-text mb-3">
  {t("lessons.unitShort", { number: unit.number })} — {(learnerLang && unit.translations[learnerLang]?.title) ?? unit.title}
</h1>
<p className="text-semantic-text-muted">{t("lessons.comingSoonMessage")}</p>
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/features/lessons/__tests__/UnitHub.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/lessons/pages/UnitHub.tsx src/features/lessons/__tests__/UnitHub.test.tsx
git commit -m "feat(lessons): localize UnitHub title/topic/grammarFocus"
```

---

## Task 4: SectionCard uses i18n key for section name

**Files:**
- Modify: `src/features/lessons/components/SectionCard.tsx`
- Create: `src/features/lessons/__tests__/SectionCard.test.tsx`

> **Historical note.** The snippet below references `SectionMeta.title`. After Tasks 4 and 5 of this plan replaced every read of that field with the i18n key `lessons.detail.sections.<key>`, the field was dropped from `SectionMeta` and `Section` entirely as a follow-up cleanup. The walkthrough is preserved for narrative continuity; in current code the fixture has no `title:` and the assertion that `"Grammar"` is absent is no longer needed.

- [ ] **Step 1: Write failing test**

Create `src/features/lessons/__tests__/SectionCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SectionCard from "../components/SectionCard";
import type { SectionMeta } from "../lesson.types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "count" in opts) return `${key}:${opts.count}`;
      return key;
    },
    i18n: { language: "en" },
  }),
}));

const section: SectionMeta = { key: "grammar", title: "Grammar", estimatedMinutes: 8 };

describe("SectionCard", () => {
  it("renders the i18n section key instead of section.title", () => {
    render(
      <MemoryRouter>
        <SectionCard
          section={section}
          unitSlug="unit-1"
          progress={{ visited: false, completed: false }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("lessons.detail.sections.grammar")).toBeInTheDocument();
    expect(screen.queryByText("Grammar")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/lessons/__tests__/SectionCard.test.tsx`
Expected: FAIL — SectionCard still renders `section.title` (`"Grammar"`).

- [ ] **Step 3: Implement i18n key rendering**

In `src/features/lessons/components/SectionCard.tsx`, find:

```tsx
<p className="text-base font-medium text-semantic-text">{section.title}</p>
```

Replace with:

```tsx
<p className="text-base font-medium text-semantic-text">{t(`lessons.detail.sections.${section.key}`)}</p>
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/features/lessons/__tests__/SectionCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/lessons/components/SectionCard.tsx src/features/lessons/__tests__/SectionCard.test.tsx
git commit -m "feat(lessons): render SectionCard title via i18n key"
```

---

## Task 5: SectionPage sticky header uses i18n key

**Files:**
- Modify: `src/features/lessons/pages/SectionPage.tsx`

Note: `SectionRenderer.test.tsx` already uses `t: (key) => key`, so if any existing SectionPage-level tests render `section.title` we need to update them. There are no current SectionPage tests — so no existing test needs updating. A new test is added below.

- [ ] **Step 1: Write failing test — augment existing or create new SectionPage test**

Create `src/features/lessons/__tests__/SectionPage.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SectionPage from "../pages/SectionPage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "count" in opts) return `${key}:${opts.count}`;
      if (opts && "number" in opts) return `${key}:${opts.number}`;
      return key;
    },
    i18n: { language: "en" },
  }),
}));

describe("SectionPage sticky header", () => {
  it("renders the section title from i18n key", () => {
    render(
      <MemoryRouter initialEntries={["/lessons/unit-1/grammar"]}>
        <Routes>
          <Route path="/lessons/:unitSlug/:sectionKey" element={<SectionPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "lessons.detail.sections.grammar" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/lessons/__tests__/SectionPage.test.tsx`
Expected: FAIL — the `<h1>` currently renders `section.title` (`"Grammar"`).

- [ ] **Step 3: Implement i18n key rendering**

In `src/features/lessons/pages/SectionPage.tsx`, find:

```tsx
<h1 className="text-2xl font-bold text-semantic-text mt-1">{section.title}</h1>
```

Replace with:

```tsx
<h1 className="text-2xl font-bold text-semantic-text mt-1">{t(`lessons.detail.sections.${validSectionKey}`)}</h1>
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/features/lessons/__tests__/SectionPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/lessons/pages/SectionPage.tsx src/features/lessons/__tests__/SectionPage.test.tsx
git commit -m "feat(lessons): render SectionPage sticky title via i18n key"
```

---

## Task 6: TextBlock learner-language lookup + wire through SectionRenderer

**Files:**
- Modify: `src/features/lessons/components/blocks/TextBlock.tsx`
- Modify: `src/features/lessons/components/SectionRenderer.tsx`
- Create: `src/features/lessons/__tests__/TextBlock.test.tsx`
- Modify: `src/features/lessons/__tests__/SectionRenderer.test.tsx` (mock i18n so it stays consistent)

- [ ] **Step 1: Write failing test**

Create `src/features/lessons/__tests__/TextBlock.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TextBlock from "../components/blocks/TextBlock";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}));

describe("TextBlock", () => {
  it("renders English content by default", () => {
    mockI18n.language = "en";
    render(<TextBlock content="Hello, world." />);
    expect(screen.getByText("Hello, world.")).toBeInTheDocument();
  });

  it("renders the learner-language translation when available", () => {
    mockI18n.language = "th";
    render(
      <TextBlock
        content="Hello, world."
        translations={{ th: "สวัสดีชาวโลก", vi: "Xin chào" }}
      />,
    );
    expect(screen.getByText("สวัสดีชาวโลก")).toBeInTheDocument();
    expect(screen.queryByText("Hello, world.")).not.toBeInTheDocument();
  });

  it("falls back to English when translation is missing for the learner language", () => {
    mockI18n.language = "zh";
    render(
      <TextBlock
        content="Hello, world."
        translations={{ th: "สวัสดีชาวโลก" }}
      />,
    );
    expect(screen.getByText("Hello, world.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/lessons/__tests__/TextBlock.test.tsx`
Expected: FAIL — TextBlock has no `translations` prop yet.

- [ ] **Step 3: Implement TextBlock translation lookup**

Replace the contents of `src/features/lessons/components/blocks/TextBlock.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import type { LearnerLanguage } from "../../utils/learnerLanguage";
import { getLearnerLanguage } from "../../utils/learnerLanguage";

type Props = {
  content: string;
  translations?: Partial<Record<LearnerLanguage, string>>;
};

export default function TextBlock({ content, translations }: Props) {
  const { i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);
  const text = (learnerLang && translations?.[learnerLang]) ?? content;
  return <p className="text-base leading-relaxed text-semantic-text">{text}</p>;
}
```

- [ ] **Step 4: Wire `translations` through `SectionRenderer`**

In `src/features/lessons/components/SectionRenderer.tsx`, find:

```tsx
case "text": return <TextBlock content={block.content} />;
```

Replace with:

```tsx
case "text": return <TextBlock content={block.content} translations={block.translations} />;
```

- [ ] **Step 5: Run tests**

Run: `npm test -- src/features/lessons/__tests__/TextBlock.test.tsx src/features/lessons/__tests__/SectionRenderer.test.tsx`
Expected: PASS — TextBlock tests pass and existing SectionRenderer tests continue to pass (the mocked i18n language is still `"th"` but no `translations` are provided in the fixture, so English fallback renders).

- [ ] **Step 6: Commit**

```bash
git add src/features/lessons/components/blocks/TextBlock.tsx src/features/lessons/components/SectionRenderer.tsx src/features/lessons/__tests__/TextBlock.test.tsx
git commit -m "feat(lessons): localize TextBlock with fallback"
```

---

## Task 7: HeadingBlock learner-language lookup

**Files:**
- Modify: `src/features/lessons/components/blocks/HeadingBlock.tsx`
- Modify: `src/features/lessons/components/SectionRenderer.tsx`
- Create: `src/features/lessons/__tests__/HeadingBlock.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/features/lessons/__tests__/HeadingBlock.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HeadingBlock from "../components/blocks/HeadingBlock";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}));

describe("HeadingBlock", () => {
  it("renders English by default", () => {
    mockI18n.language = "en";
    render(<HeadingBlock content="What you'll learn" />);
    expect(screen.getByRole("heading", { level: 2, name: "What you'll learn" })).toBeInTheDocument();
  });

  it("renders learner-language translation when provided", () => {
    mockI18n.language = "vi";
    render(
      <HeadingBlock
        content="What you'll learn"
        translations={{ vi: "Những gì bạn sẽ học" }}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Những gì bạn sẽ học" })).toBeInTheDocument();
  });

  it("falls back to English when translation is missing", () => {
    mockI18n.language = "th";
    render(
      <HeadingBlock
        content="What you'll learn"
        translations={{ vi: "Những gì bạn sẽ học" }}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "What you'll learn" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/lessons/__tests__/HeadingBlock.test.tsx`
Expected: FAIL — no `translations` prop.

- [ ] **Step 3: Implement HeadingBlock translation lookup**

Replace the contents of `src/features/lessons/components/blocks/HeadingBlock.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import type { LearnerLanguage } from "../../utils/learnerLanguage";
import { getLearnerLanguage } from "../../utils/learnerLanguage";

type Props = {
  content: string;
  translations?: Partial<Record<LearnerLanguage, string>>;
};

export default function HeadingBlock({ content, translations }: Props) {
  const { i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);
  const text = (learnerLang && translations?.[learnerLang]) ?? content;
  return <h2 className="text-xl font-semibold text-semantic-text mt-2">{text}</h2>;
}
```

- [ ] **Step 4: Wire `translations` through `SectionRenderer`**

In `src/features/lessons/components/SectionRenderer.tsx`, find:

```tsx
case "heading": return <HeadingBlock content={block.content} />;
```

Replace with:

```tsx
case "heading": return <HeadingBlock content={block.content} translations={block.translations} />;
```

- [ ] **Step 5: Run tests**

Run: `npm test -- src/features/lessons/__tests__/HeadingBlock.test.tsx src/features/lessons/__tests__/SectionRenderer.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/lessons/components/blocks/HeadingBlock.tsx src/features/lessons/components/SectionRenderer.tsx src/features/lessons/__tests__/HeadingBlock.test.tsx
git commit -m "feat(lessons): localize HeadingBlock with fallback"
```

---

## Task 8: CalloutBlock learner-language lookup

**Files:**
- Modify: `src/features/lessons/components/blocks/CalloutBlock.tsx`
- Modify: `src/features/lessons/components/SectionRenderer.tsx`
- Create: `src/features/lessons/__tests__/CalloutBlock.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/features/lessons/__tests__/CalloutBlock.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CalloutBlock from "../components/blocks/CalloutBlock";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}));

describe("CalloutBlock", () => {
  it("renders English content by default for each variant", () => {
    mockI18n.language = "en";
    const { rerender } = render(<CalloutBlock variant="tip" content="Helpful tip." />);
    expect(screen.getByText("Helpful tip.")).toBeInTheDocument();

    rerender(<CalloutBlock variant="note" content="A note." />);
    expect(screen.getByText("A note.")).toBeInTheDocument();

    rerender(<CalloutBlock variant="warning" content="Be careful." />);
    expect(screen.getByText("Be careful.")).toBeInTheDocument();
  });

  it("renders learner-language translation when provided", () => {
    mockI18n.language = "zh";
    render(
      <CalloutBlock
        variant="tip"
        content="Helpful tip."
        translations={{ "zh-CN": "有用的提示。" }}
      />,
    );
    expect(screen.getByText("有用的提示。")).toBeInTheDocument();
  });

  it("falls back to English when translation is missing", () => {
    mockI18n.language = "vi";
    render(
      <CalloutBlock
        variant="tip"
        content="Helpful tip."
        translations={{ th: "เคล็ดลับ" }}
      />,
    );
    expect(screen.getByText("Helpful tip.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/lessons/__tests__/CalloutBlock.test.tsx`
Expected: FAIL — no `translations` prop.

- [ ] **Step 3: Implement CalloutBlock translation lookup**

Replace the contents of `src/features/lessons/components/blocks/CalloutBlock.tsx`:

```tsx
import { Lightbulb, Info, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import type { LearnerLanguage } from "../../utils/learnerLanguage";
import { getLearnerLanguage } from "../../utils/learnerLanguage";

type Props = {
  variant: "tip" | "note" | "warning";
  content: string;
  translations?: Partial<Record<LearnerLanguage, string>>;
};

const VARIANT_STYLES = {
  tip: {
    border: "border-primary-400 dark:border-primary-500",
    bg: "bg-primary-50 dark:bg-primary-900/20",
    text: "text-primary-800 dark:text-primary-300",
    icon: Lightbulb,
  },
  note: {
    border: "border-sky-400 dark:border-sky-500",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    text: "text-sky-800 dark:text-sky-300",
    icon: Info,
  },
  warning: {
    border: "border-amber-400 dark:border-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-800 dark:text-amber-300",
    icon: AlertTriangle,
  },
};

export default function CalloutBlock({ variant, content, translations }: Props) {
  const { i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);
  const text = (learnerLang && translations?.[learnerLang]) ?? content;
  const style = VARIANT_STYLES[variant];
  const Icon = style.icon;
  return (
    <div className={clsx("flex items-start gap-3 rounded-lg border-l-4 p-4", style.border, style.bg)}>
      <Icon className={clsx("w-5 h-5 flex-shrink-0 mt-0.5", style.text)} aria-hidden="true" />
      <p className={clsx("text-sm", style.text)}>{text}</p>
    </div>
  );
}
```

- [ ] **Step 4: Wire `translations` through `SectionRenderer`**

In `src/features/lessons/components/SectionRenderer.tsx`, find:

```tsx
case "callout": return <CalloutBlock variant={block.variant} content={block.content} />;
```

Replace with:

```tsx
case "callout": return <CalloutBlock variant={block.variant} content={block.content} translations={block.translations} />;
```

- [ ] **Step 5: Run tests**

Run: `npm test -- src/features/lessons/__tests__/CalloutBlock.test.tsx src/features/lessons/__tests__/SectionRenderer.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/lessons/components/blocks/CalloutBlock.tsx src/features/lessons/components/SectionRenderer.tsx src/features/lessons/__tests__/CalloutBlock.test.tsx
git commit -m "feat(lessons): localize CalloutBlock with fallback"
```

---

## Task 9: Populate unit-1 block translations

Per the spec: Thai fully populated; Vietnamese and zh-CN populated where feasible, English fallback elsewhere. For this task, populate all three learner languages for every heading/text/callout block in unit-1. There aren't that many.

**Files:**
- Modify: `src/features/lessons/data/sections/unit-1/overview.ts`
- Modify: `src/features/lessons/data/sections/unit-1/grammar.ts`
- Modify: `src/features/lessons/data/sections/unit-1/vocabulary.ts`
- Modify: `src/features/lessons/data/sections/unit-1/dialogues.ts`
- Modify: `src/features/lessons/data/sections/unit-1/activities.ts`

- [ ] **Step 1: Update `overview.ts`**

Replace the file contents:

```ts
// src/features/lessons/data/sections/unit-1/overview.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const overview: Section = {
  id: "u1-overview",
  unitSlug: "unit-1",
  key: "overview",
  blocks: [
    {
      id: "u1-ov-1",
      type: "heading",
      content: "What you'll learn",
      translations: {
        th: "สิ่งที่คุณจะได้เรียนรู้",
        vi: "Những gì bạn sẽ học",
        "zh-CN": "你将学到的内容",
      },
    },
    {
      id: "u1-ov-2",
      type: "text",
      content: "In this unit, you'll learn how to introduce yourself, greet people, and share basic personal information using the present tense of 'to be' (am, is, are).",
      translations: {
        th: "ในบทนี้ คุณจะได้เรียนรู้วิธีแนะนำตัวเอง ทักทายผู้คน และแบ่งปันข้อมูลส่วนตัวพื้นฐานโดยใช้กาลปัจจุบันของ 'to be' (am, is, are)",
        vi: "Trong bài học này, bạn sẽ học cách giới thiệu bản thân, chào hỏi mọi người và chia sẻ thông tin cá nhân cơ bản bằng thì hiện tại của 'to be' (am, is, are).",
        "zh-CN": "在本单元中，你将学习如何使用 'to be' 的现在时 (am, is, are) 介绍自己、问候他人以及分享基本的个人信息。",
      },
    },
    {
      id: "u1-ov-3",
      type: "callout",
      variant: "tip",
      content: "These are some of the most common phrases in English. You'll use them every day!",
      translations: {
        th: "วลีเหล่านี้เป็นวลีที่พบบ่อยที่สุดในภาษาอังกฤษ คุณจะได้ใช้มันทุกวัน!",
        vi: "Đây là một số cụm từ phổ biến nhất trong tiếng Anh. Bạn sẽ sử dụng chúng hằng ngày!",
        "zh-CN": "这些是英语中最常见的短语。你每天都会用到！",
      },
    },
    {
      id: "u1-ov-4",
      type: "heading",
      content: "Real-world context",
      translations: {
        th: "สถานการณ์จริง",
        vi: "Bối cảnh thực tế",
        "zh-CN": "真实场景",
      },
    },
    {
      id: "u1-ov-5",
      type: "text",
      content: "Meeting new people at work, introducing yourself at school, filling out a simple form, or starting a conversation with a stranger — all of these situations use the patterns you'll practice here.",
      translations: {
        th: "การพบเพื่อนใหม่ที่ทำงาน การแนะนำตัวเองที่โรงเรียน การกรอกแบบฟอร์มง่ายๆ หรือการเริ่มบทสนทนากับคนแปลกหน้า — ทุกสถานการณ์เหล่านี้ใช้รูปแบบที่คุณจะได้ฝึกที่นี่",
        vi: "Gặp gỡ người mới ở nơi làm việc, giới thiệu bản thân ở trường, điền vào một biểu mẫu đơn giản, hoặc bắt chuyện với người lạ — tất cả những tình huống này đều sử dụng các mẫu câu mà bạn sẽ luyện tập ở đây.",
        "zh-CN": "在工作中结识新朋友、在学校介绍自己、填写简单的表格，或与陌生人开始交谈——所有这些情境都会用到你将在这里练习的句型。",
      },
    },
    {
      id: "u1-ov-6",
      type: "heading",
      content: "Key phrases",
      translations: {
        th: "วลีสำคัญ",
        vi: "Cụm từ quan trọng",
        "zh-CN": "关键短语",
      },
    },
    {
      id: "u1-ov-7",
      type: "examples",
      items: [
        { id: "u1-ex-hello-name", english: "Hello, my name is Somchai.", translations: { th: "สวัสดีครับ ผมชื่อสมชาย" } },
        { id: "u1-ex-from-thailand", english: "I am from Thailand.", translations: { th: "ผมมาจากประเทศไทย" } },
        { id: "u1-ex-she-teacher", english: "She is a teacher.", translations: { th: "เธอเป็นครู" } },
        { id: "u1-ex-we-students", english: "We are students.", translations: { th: "พวกเราเป็นนักเรียน" } },
        { id: "u1-ex-nice-meet", english: "Nice to meet you.", translations: { th: "ยินดีที่ได้รู้จัก" } },
      ],
    },
  ],
};

registerSection(overview);
export default overview;
```

- [ ] **Step 2: Update `grammar.ts`**

Replace the file contents:

```ts
// src/features/lessons/data/sections/unit-1/grammar.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const grammar: Section = {
  id: "u1-grammar",
  unitSlug: "unit-1",
  key: "grammar",
  blocks: [
    {
      id: "u1-gr-1",
      type: "heading",
      content: "Present tense of 'to be'",
      translations: {
        th: "กาลปัจจุบันของ 'to be'",
        vi: "Thì hiện tại của 'to be'",
        "zh-CN": "'to be' 的现在时",
      },
    },
    {
      id: "u1-gr-2",
      type: "text",
      content: "The verb 'to be' is one of the most important verbs in English. It changes form depending on the subject: I am, you are, he/she/it is, we are, they are.",
      translations: {
        th: "กริยา 'to be' เป็นหนึ่งในกริยาที่สำคัญที่สุดในภาษาอังกฤษ มันเปลี่ยนรูปตามประธาน: I am, you are, he/she/it is, we are, they are",
        vi: "Động từ 'to be' là một trong những động từ quan trọng nhất trong tiếng Anh. Nó thay đổi theo chủ ngữ: I am, you are, he/she/it is, we are, they are.",
        "zh-CN": "动词 'to be' 是英语中最重要的动词之一。它会根据主语变化：I am, you are, he/she/it is, we are, they are。",
      },
    },
    {
      id: "u1-gr-3",
      type: "examples",
      items: [
        { id: "u1-ex-i-happy", english: "I am happy.", translations: { th: "ฉันมีความสุข" } },
        { id: "u1-ex-you-tall", english: "You are tall.", translations: { th: "คุณสูง" } },
        { id: "u1-ex-he-japan", english: "He is from Japan.", translations: { th: "เขามาจากญี่ปุ่น" } },
      ],
    },
    {
      id: "u1-gr-4",
      type: "callout",
      variant: "note",
      content: "In casual speech, English speakers often use contractions: I'm, you're, he's, she's, we're, they're.",
      translations: {
        th: "ในการพูดทั่วไป ผู้พูดภาษาอังกฤษมักจะใช้คำย่อ: I'm, you're, he's, she's, we're, they're",
        vi: "Trong lời nói thông thường, người nói tiếng Anh thường dùng dạng rút gọn: I'm, you're, he's, she's, we're, they're.",
        "zh-CN": "在日常口语中，说英语的人常常使用缩写形式：I'm, you're, he's, she's, we're, they're。",
      },
    },
    {
      id: "u1-gr-5",
      type: "heading",
      content: "Quick check",
      translations: {
        th: "ตรวจสอบอย่างรวดเร็ว",
        vi: "Kiểm tra nhanh",
        "zh-CN": "快速检查",
      },
    },
    { id: "u1-gr-6", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u1-grammar-mcq-1" },
  ],
};

registerSection(grammar);
export default grammar;
```

- [ ] **Step 3: Update `vocabulary.ts`**

Replace the file contents:

```ts
// src/features/lessons/data/sections/unit-1/vocabulary.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const vocabulary: Section = {
  id: "u1-vocabulary",
  unitSlug: "unit-1",
  key: "vocabulary",
  blocks: [
    {
      id: "u1-vocab-1",
      type: "heading",
      content: "Key words for introductions",
      translations: {
        th: "คำสำคัญสำหรับการแนะนำตัว",
        vi: "Từ vựng quan trọng để giới thiệu",
        "zh-CN": "介绍时的关键词",
      },
    },
    {
      id: "u1-vocab-2",
      type: "text",
      content: "Learn these common words and phrases used when meeting people for the first time.",
      translations: {
        th: "เรียนรู้คำและวลีที่พบบ่อยเหล่านี้ซึ่งใช้เมื่อพบผู้คนเป็นครั้งแรก",
        vi: "Hãy học những từ và cụm từ phổ biến này được dùng khi gặp gỡ mọi người lần đầu.",
        "zh-CN": "学习这些第一次见面时常用的单词和短语。",
      },
    },
    {
      id: "u1-vocab-3",
      type: "vocab-list",
      items: [
        { id: "u1-v-hello", word: "hello", phonetic: "heh-loh", translations: { th: "สวัสดี", vi: "xin chào", "zh-CN": "你好" } },
        { id: "u1-v-name", word: "name", phonetic: "neym", translations: { th: "ชื่อ", vi: "tên", "zh-CN": "名字" } },
        { id: "u1-v-teacher", word: "teacher", phonetic: "tee-cher", translations: { th: "ครู", vi: "giáo viên", "zh-CN": "老师" } },
        { id: "u1-v-student", word: "student", phonetic: "stoo-dent", translations: { th: "นักเรียน", vi: "học sinh", "zh-CN": "学生" } },
        { id: "u1-v-friend", word: "friend", phonetic: "frend", translations: { th: "เพื่อน", vi: "bạn", "zh-CN": "朋友" } },
        { id: "u1-v-country", word: "country", phonetic: "kuhn-tree", translations: { th: "ประเทศ", vi: "quốc gia", "zh-CN": "国家" } },
        { id: "u1-v-from", word: "from", phonetic: "fruhm", translations: { th: "จาก", vi: "từ", "zh-CN": "来自" } },
        { id: "u1-v-nice", word: "nice", phonetic: "nys", translations: { th: "ดี", vi: "tốt", "zh-CN": "好的" } },
        { id: "u1-v-thankyou", word: "thank you", phonetic: "thangk-yoo", translations: { th: "ขอบคุณ", vi: "cảm ơn", "zh-CN": "谢谢" } },
        { id: "u1-v-yes", word: "yes", phonetic: "yes", translations: { th: "ใช่", vi: "vâng", "zh-CN": "是的" } },
      ],
    },
  ],
};

registerSection(vocabulary);
export default vocabulary;
```

- [ ] **Step 4: Update `dialogues.ts`**

Replace the file contents:

```ts
// src/features/lessons/data/sections/unit-1/dialogues.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const dialogues: Section = {
  id: "u1-dialogues",
  unitSlug: "unit-1",
  key: "dialogues",
  blocks: [
    {
      id: "u1-dl-1",
      type: "heading",
      content: "Meeting someone new",
      translations: {
        th: "การพบคนใหม่",
        vi: "Gặp gỡ người mới",
        "zh-CN": "结识新朋友",
      },
    },
    {
      id: "u1-dl-2",
      type: "text",
      content: "Read through this conversation between two people meeting for the first time.",
      translations: {
        th: "อ่านบทสนทนาระหว่างคนสองคนที่พบกันเป็นครั้งแรก",
        vi: "Đọc cuộc trò chuyện giữa hai người gặp nhau lần đầu.",
        "zh-CN": "读一读两个人第一次见面的对话。",
      },
    },
    {
      id: "u1-dl-3",
      type: "dialogue",
      lines: [
        { id: "u1-d-1", speaker: "Anna", text: "Hello! My name is Anna.", translations: { th: "สวัสดี! ฉันชื่ออันนา", vi: "Xin chào! Tôi tên là Anna.", "zh-CN": "你好！我叫Anna。" } },
        { id: "u1-d-2", speaker: "Somchai", text: "Hi Anna. I am Somchai.", translations: { th: "สวัสดีอันนา ผมชื่อสมชาย", vi: "Chào Anna. Tôi là Somchai.", "zh-CN": "你好Anna。我是Somchai。" } },
        { id: "u1-d-3", speaker: "Anna", text: "Nice to meet you. Are you a student?", translations: { th: "ยินดีที่ได้รู้จัก คุณเป็นนักเรียนหรือ?", vi: "Rất vui được gặp bạn. Bạn là học sinh à?", "zh-CN": "很高兴认识你。你是学生吗？" } },
        { id: "u1-d-4", speaker: "Somchai", text: "Yes, I am. I am from Thailand.", translations: { th: "ใช่ครับ ผมมาจากประเทศไทย", vi: "Vâng. Tôi đến từ Thái Lan.", "zh-CN": "是的。我来自泰国。" } },
        { id: "u1-d-5", speaker: "Anna", text: "That is great! I am from Germany.", translations: { th: "ดีมาก! ฉันมาจากเยอรมนี", vi: "Tuyệt vời! Tôi đến từ Đức.", "zh-CN": "太好了！我来自德国。" } },
      ],
    },
  ],
};

registerSection(dialogues);
export default dialogues;
```

- [ ] **Step 5: Update `activities.ts`**

Replace the file contents:

```ts
// src/features/lessons/data/sections/unit-1/activities.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const activities: Section = {
  id: "u1-activities",
  unitSlug: "unit-1",
  key: "activities",
  blocks: [
    {
      id: "u1-act-1",
      type: "heading",
      content: "Practice what you've learned",
      translations: {
        th: "ฝึกสิ่งที่คุณได้เรียนรู้",
        vi: "Luyện tập những gì bạn đã học",
        "zh-CN": "练习你所学到的",
      },
    },
    {
      id: "u1-act-2",
      type: "text",
      content: "Complete the exercises below to reinforce what you learned in this unit.",
      translations: {
        th: "ทำแบบฝึกหัดด้านล่างให้เสร็จเพื่อเสริมสิ่งที่คุณได้เรียนรู้ในบทนี้",
        vi: "Hoàn thành các bài tập dưới đây để củng cố những gì bạn đã học trong bài này.",
        "zh-CN": "完成下面的练习，以巩固你在本单元中学到的内容。",
      },
    },
    {
      id: "u1-act-3",
      type: "callout",
      variant: "tip",
      content: "Try to answer from memory before looking back at the grammar section.",
      translations: {
        th: "พยายามตอบจากความจำก่อนกลับไปดูส่วนไวยากรณ์",
        vi: "Hãy cố gắng trả lời bằng trí nhớ trước khi xem lại phần ngữ pháp.",
        "zh-CN": "先凭记忆作答，再回去查看语法部分。",
      },
    },
    { id: "u1-act-4", type: "exercise", exerciseType: "fill-blank", exerciseId: "u1-activities-fb-1" },
  ],
};

registerSection(activities);
export default activities;
```

- [ ] **Step 6: Run all lesson tests and type-check**

Run: `npm run type-check`
Expected: no errors.

Run: `npm test -- src/features/lessons/`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/lessons/data/sections/unit-1/
git commit -m "feat(lessons): add unit-1 block translations for th/vi/zh-CN"
```

---

## Task 10: Full verification sweep

**Files:** none — this is a verify-and-fix task.

- [ ] **Step 1: Run the full unit test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: no errors. (If warnings already existed pre-change, they're acceptable; no new warnings from changed files.)

- [ ] **Step 4: Run Playwright e2e suite**

Run: `npx playwright test`
Expected: all e2e tests pass. English mode UI is unchanged so the existing suite should be green.

- [ ] **Step 5: Manual smoke (dev server)**

Start: `npm run dev`
In browser at `http://localhost:5173/lessons`:
- Switch app language to Thai, Vietnamese, Chinese, English via the language switcher — confirm unit cards, unit header, section names, heading/text/callout blocks all localize correctly and fall back to English where translations are missing.

- [ ] **Step 6: Tidy any fixes as additional commits**

If anything failed in steps 1-5, fix and commit per the convention (`fix(lessons): …`).

---

## Definition of Done

- [ ] Thai / Vietnamese / Chinese learners see localized unit titles, topics, and grammar focus on the lessons index and the unit hub.
- [ ] Section names (Overview, Grammar, Vocabulary, Dialogues, Activities) change with the app language via the existing i18n keys.
- [ ] Heading, text, and callout blocks in all five unit-1 sections show learner-language translations where available.
- [ ] Missing block translations fall back to English content cleanly.
- [ ] English / unsupported language users see English throughout — no regressions.
- [ ] `npm test`, `npm run type-check`, `npm run lint`, `npx playwright test` all pass.
