# Lesson Content Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Localize lesson content for Thai, Vietnamese, and Simplified Chinese learners — flip vocab cards to native-front/English-back, add zh-CN locale, and wire all content blocks to use per-language translations.

**Architecture:** Add `LearnerLanguage` type and `getLearnerLanguage()` helper. Replace single `translation` fields with `translations: Partial<Record<LearnerLanguage, string>>` maps on VocabItem/ExampleItem/DialogueLine. Update block components to read learner language from i18n and look up the appropriate translation. Add zh-CN locale file and register it.

**Tech Stack:** React 19, TypeScript, i18next, Vitest, Playwright, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-04-15-lesson-content-localization-design.md`

---

## File Map

### New files

| File | Responsibility |
|------|---------------|
| `src/features/lessons/utils/learnerLanguage.ts` | `LearnerLanguage` type, `SUPPORTED_LEARNER_LANGUAGES`, `getLearnerLanguage()` |
| `src/features/lessons/utils/__tests__/learnerLanguage.test.ts` | Tests for getLearnerLanguage mapping |
| `src/locales/zh-CN/zh-CN.json` | Full Simplified Chinese UI translations |

### Modified files

| File | Change |
|------|--------|
| `src/features/lessons/lesson.types.ts` | Update VocabItem, ExampleItem, DialogueLine — add id, replace translation with translations map, remove example from VocabItem |
| `src/features/lessons/components/blocks/VocabListBlock.tsx` | Flip card direction, learner language lookup, remove example display |
| `src/features/lessons/components/blocks/ExamplesBlock.tsx` | Learner language lookup, fallback behavior |
| `src/features/lessons/components/blocks/DialogueBlock.tsx` | Learner language lookup, fallback behavior |
| `src/features/lessons/data/sections/unit-1/vocabulary.ts` | Migrate to new VocabItem shape with th/vi/zh-CN translations |
| `src/features/lessons/data/sections/unit-1/overview.ts` | Migrate ExampleItems to new shape with id + translations |
| `src/features/lessons/data/sections/unit-1/grammar.ts` | Migrate ExampleItems to new shape with id + translations |
| `src/features/lessons/data/sections/unit-1/dialogues.ts` | Migrate DialogueLines to new shape with id + translations |
| `src/lib/i18n.ts` | Register zh-CN locale |
| `src/components/LanguageSwitcher.tsx` | Add zh-CN option |
| `src/locales/en/en.json` | Add vocab card i18n keys |
| `src/locales/th/th.json` | Add vocab card i18n keys |
| `src/locales/vi/vi.json` | Add vocab card i18n keys |
| `src/features/lessons/__tests__/lesson.types.test.ts` | May need updates for changed types |
| `src/features/lessons/__tests__/SectionRenderer.test.tsx` | Update test data for new type shapes |
| `src/features/lessons/__tests__/data.test.ts` | Update for new content shapes |
| `e2e/lessons.spec.ts` | Update vocab test selectors |

---

## Task 1: getLearnerLanguage Helper + Types

**Files:**
- Create: `src/features/lessons/utils/learnerLanguage.ts`
- Test: `src/features/lessons/utils/__tests__/learnerLanguage.test.ts`

- [ ] **Step 1: Write tests**

```ts
// src/features/lessons/utils/__tests__/learnerLanguage.test.ts
import { describe, it, expect } from "vitest";
import { getLearnerLanguage, SUPPORTED_LEARNER_LANGUAGES } from "../learnerLanguage";

describe("getLearnerLanguage", () => {
  it("maps 'th' to 'th'", () => {
    expect(getLearnerLanguage("th")).toBe("th");
  });

  it("maps 'vi' to 'vi'", () => {
    expect(getLearnerLanguage("vi")).toBe("vi");
  });

  it("maps 'zh-CN' to 'zh-CN'", () => {
    expect(getLearnerLanguage("zh-CN")).toBe("zh-CN");
  });

  it("maps 'zh' to 'zh-CN'", () => {
    expect(getLearnerLanguage("zh")).toBe("zh-CN");
  });

  it("returns null for 'en'", () => {
    expect(getLearnerLanguage("en")).toBeNull();
  });

  it("returns null for unsupported languages", () => {
    expect(getLearnerLanguage("fr")).toBeNull();
    expect(getLearnerLanguage("ja")).toBeNull();
    expect(getLearnerLanguage("")).toBeNull();
  });
});

describe("SUPPORTED_LEARNER_LANGUAGES", () => {
  it("contains exactly th, vi, zh-CN", () => {
    expect(SUPPORTED_LEARNER_LANGUAGES).toEqual(["th", "vi", "zh-CN"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/lessons/utils/__tests__/learnerLanguage.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

```ts
// src/features/lessons/utils/learnerLanguage.ts

export type LearnerLanguage = "th" | "vi" | "zh-CN";

export const SUPPORTED_LEARNER_LANGUAGES: LearnerLanguage[] = ["th", "vi", "zh-CN"];

export function getLearnerLanguage(appLanguage: string): LearnerLanguage | null {
  if (appLanguage === "th") return "th";
  if (appLanguage === "vi") return "vi";
  if (appLanguage === "zh-CN" || appLanguage === "zh") return "zh-CN";
  return null;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/features/lessons/utils/__tests__/learnerLanguage.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/lessons/utils/
git commit -m "feat(lessons): add getLearnerLanguage helper and LearnerLanguage type"
```

---

## Task 2: Update Content Model Types

**Files:**
- Modify: `src/features/lessons/lesson.types.ts`
- Modify: `src/features/lessons/__tests__/lesson.types.test.ts`

- [ ] **Step 1: Update lesson.types.ts**

Replace the three content item types. Keep everything else unchanged.

Replace `ExampleItem` (lines 54-58):
```ts
export type ExampleItem = {
  id: string;
  english: string;
  translations: Partial<Record<LearnerLanguage, string>>;
  note?: string;
};
```

Replace `VocabItem` (lines 60-66):
```ts
export type VocabItem = {
  id: string;
  word: string;
  phonetic?: string;
  translations: Partial<Record<LearnerLanguage, string>>;
  audioUrl?: string;
};
```

Replace `DialogueLine` (lines 68-73):
```ts
export type DialogueLine = {
  id: string;
  speaker: string;
  text: string;
  translations: Partial<Record<LearnerLanguage, string>>;
  audioUrl?: string;
};
```

Add the import at the top of the file:
```ts
import type { LearnerLanguage } from "./utils/learnerLanguage";
```

Also re-export `LearnerLanguage` for convenience:
```ts
export type { LearnerLanguage } from "./utils/learnerLanguage";
```

- [ ] **Step 2: Run typecheck**

Run: `npm run type-check`
Expected: FAIL — data files and components still use old shape. That's expected; we'll fix them in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add src/features/lessons/lesson.types.ts
git commit -m "feat(lessons): update content types with id fields and translations map"
```

---

## Task 3: Migrate Unit 1 Content Data

**Files:**
- Modify: `src/features/lessons/data/sections/unit-1/vocabulary.ts`
- Modify: `src/features/lessons/data/sections/unit-1/overview.ts`
- Modify: `src/features/lessons/data/sections/unit-1/grammar.ts`
- Modify: `src/features/lessons/data/sections/unit-1/dialogues.ts`

- [ ] **Step 1: Update vocabulary.ts**

```ts
// src/features/lessons/data/sections/unit-1/vocabulary.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const vocabulary: Section = {
  id: "u1-vocabulary",
  unitSlug: "unit-1",
  key: "vocabulary",
  title: "Vocabulary",
  blocks: [
    { id: "u1-vocab-1", type: "heading", content: "Key words for introductions" },
    {
      id: "u1-vocab-2",
      type: "text",
      content: "Learn these common words and phrases used when meeting people for the first time.",
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

- [ ] **Step 2: Update overview.ts**

Replace the examples block (the `items` array in the block with `id: "u1-ov-7"`):

```ts
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
```

- [ ] **Step 3: Update grammar.ts**

Replace the examples block (the `items` array in the block with `id: "u1-gr-3"`):

```ts
{
  id: "u1-gr-3",
  type: "examples",
  items: [
    { id: "u1-ex-i-happy", english: "I am happy.", translations: { th: "ฉันมีความสุข" } },
    { id: "u1-ex-you-tall", english: "You are tall.", translations: { th: "คุณสูง" } },
    { id: "u1-ex-he-japan", english: "He is from Japan.", translations: { th: "เขามาจากญี่ปุ่น" } },
  ],
},
```

- [ ] **Step 4: Update dialogues.ts**

```ts
// src/features/lessons/data/sections/unit-1/dialogues.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const dialogues: Section = {
  id: "u1-dialogues",
  unitSlug: "unit-1",
  key: "dialogues",
  title: "Dialogues",
  blocks: [
    { id: "u1-dl-1", type: "heading", content: "Meeting someone new" },
    {
      id: "u1-dl-2",
      type: "text",
      content: "Read through this conversation between two people meeting for the first time.",
    },
    {
      id: "u1-dl-3",
      type: "dialogue",
      lines: [
        { id: "u1-d-1", speaker: "Anna", text: "Hello! My name is Anna.", translations: { th: "สวัสดี! ฉันชื่ออันนา" } },
        { id: "u1-d-2", speaker: "Somchai", text: "Hi Anna. I am Somchai.", translations: { th: "สวัสดีอันนา ผมชื่อสมชาย" } },
        { id: "u1-d-3", speaker: "Anna", text: "Nice to meet you. Are you a student?", translations: { th: "ยินดีที่ได้รู้จัก คุณเป็นนักเรียนหรือ?" } },
        { id: "u1-d-4", speaker: "Somchai", text: "Yes, I am. I am from Thailand.", translations: { th: "ใช่ครับ ผมมาจากประเทศไทย" } },
        { id: "u1-d-5", speaker: "Anna", text: "That is great! I am from Germany.", translations: { th: "ดีมาก! ฉันมาจากเยอรมนี" } },
      ],
    },
  ],
};

registerSection(dialogues);
export default dialogues;
```

- [ ] **Step 5: Run typecheck**

Run: `npm run type-check`
Expected: FAIL — block components still use old `.translation` property. Expected at this point.

- [ ] **Step 6: Commit**

```bash
git add src/features/lessons/data/sections/unit-1/
git commit -m "feat(lessons): migrate Unit 1 content to localized translations model"
```

---

## Task 4: Update Block Components

**Files:**
- Modify: `src/features/lessons/components/blocks/VocabListBlock.tsx`
- Modify: `src/features/lessons/components/blocks/ExamplesBlock.tsx`
- Modify: `src/features/lessons/components/blocks/DialogueBlock.tsx`
- Test: `src/features/lessons/__tests__/VocabListBlock.test.tsx`
- Test: `src/features/lessons/__tests__/ExamplesBlock.test.tsx`
- Test: `src/features/lessons/__tests__/DialogueBlock.test.tsx`

- [ ] **Step 1: Write VocabListBlock tests**

```tsx
// src/features/lessons/__tests__/VocabListBlock.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VocabListBlock from "../components/blocks/VocabListBlock";
import type { VocabItem } from "../lesson.types";

// Mock i18next
const mockLanguage = { current: "th" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const keys: Record<string, string> = {
        "lessons.vocab.revealAnswer": "Reveal answer",
      };
      return keys[key] ?? key;
    },
    i18n: { language: mockLanguage.current },
  }),
}));

const items: VocabItem[] = [
  { id: "v1", word: "hello", phonetic: "heh-loh", translations: { th: "สวัสดี", vi: "xin chào", "zh-CN": "你好" } },
  { id: "v2", word: "name", phonetic: "neym", translations: { th: "ชื่อ" } },
];

describe("VocabListBlock", () => {
  beforeEach(() => {
    mockLanguage.current = "th";
  });

  it("shows native language word on front for Thai learner", () => {
    render(<VocabListBlock items={items} />);
    expect(screen.getByText("สวัสดี")).toBeInTheDocument();
    expect(screen.getByText("ชื่อ")).toBeInTheDocument();
  });

  it("shows English word and phonetic on back after flip", async () => {
    const user = userEvent.setup();
    render(<VocabListBlock items={items} />);
    await user.click(screen.getByText("สวัสดี").closest("button")!);
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("/heh-loh/")).toBeInTheDocument();
  });

  it("shows Vietnamese translation for Vietnamese learner", () => {
    mockLanguage.current = "vi";
    render(<VocabListBlock items={items} />);
    expect(screen.getByText("xin chào")).toBeInTheDocument();
  });

  it("shows zh-CN translation for Chinese learner", () => {
    mockLanguage.current = "zh-CN";
    render(<VocabListBlock items={items} />);
    expect(screen.getByText("你好")).toBeInTheDocument();
  });

  it("shows English word in muted style when translation missing", () => {
    mockLanguage.current = "zh-CN";
    render(<VocabListBlock items={[{ id: "v3", word: "test", translations: {} }]} />);
    const fallback = screen.getByText("test");
    expect(fallback).toBeInTheDocument();
    expect(fallback.className).toContain("opacity");
  });

  it("shows English-only mode for unsupported language", () => {
    mockLanguage.current = "en";
    render(<VocabListBlock items={items} />);
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.queryByText("สวัสดี")).not.toBeInTheDocument();
  });

  it("does not show example sentences", () => {
    render(<VocabListBlock items={items} />);
    expect(screen.queryByText(/how are you/i)).not.toBeInTheDocument();
  });

  it("shows 'Reveal answer' prompt", () => {
    render(<VocabListBlock items={items} />);
    expect(screen.getAllByText("Reveal answer").length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/lessons/__tests__/VocabListBlock.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement VocabListBlock**

```tsx
// src/features/lessons/components/blocks/VocabListBlock.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { VocabItem } from "../../lesson.types";
import { getLearnerLanguage } from "../../utils/learnerLanguage";

function VocabCard({ item, learnerLang }: { item: VocabItem; learnerLang: ReturnType<typeof getLearnerLanguage> }) {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);

  const nativeText = learnerLang ? item.translations[learnerLang] : null;
  const hasFront = nativeText !== null && nativeText !== undefined;

  const frontLabel = hasFront
    ? `Flip card to reveal English for ${nativeText}`
    : "Flip card to reveal answer";
  const backLabel = "Flip card back to translation";

  return (
    <button
      type="button"
      onClick={() => setFlipped(!flipped)}
      aria-label={flipped ? backLabel : frontLabel}
      className="w-full text-left card card-interactive p-4 min-h-[100px] flex flex-col justify-center"
    >
      {!flipped ? (
        <>
          {hasFront ? (
            <p className="text-lg font-semibold text-semantic-text">{nativeText}</p>
          ) : learnerLang ? (
            <p className="text-lg font-semibold text-semantic-text opacity-50">{item.word}</p>
          ) : (
            <p className="text-lg font-semibold text-semantic-text">{item.word}</p>
          )}
          <p className="text-xs text-semantic-text-muted mt-2">{t("lessons.vocab.revealAnswer")}</p>
        </>
      ) : (
        <>
          <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">{item.word}</p>
          {item.phonetic && (
            <p className="text-xs text-semantic-subtle mt-1">/{item.phonetic}/</p>
          )}
        </>
      )}
    </button>
  );
}

type Props = { items: VocabItem[] };

export default function VocabListBlock({ items }: Props) {
  const { i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <VocabCard key={item.id} item={item} learnerLang={learnerLang} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run VocabListBlock tests**

Run: `npx vitest run src/features/lessons/__tests__/VocabListBlock.test.tsx`
Expected: PASS (8 tests)

- [ ] **Step 5: Write ExamplesBlock tests**

```tsx
// src/features/lessons/__tests__/ExamplesBlock.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ExamplesBlock from "../components/blocks/ExamplesBlock";
import type { ExampleItem } from "../lesson.types";

const mockLanguage = { current: "th" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: mockLanguage.current },
  }),
}));

const items: ExampleItem[] = [
  { id: "e1", english: "I am happy.", translations: { th: "ฉันมีความสุข", vi: "Tôi vui." } },
  { id: "e2", english: "She is a teacher.", translations: { th: "เธอเป็นครู" } },
];

describe("ExamplesBlock", () => {
  beforeEach(() => {
    mockLanguage.current = "th";
  });

  it("shows English text and Thai translation", () => {
    render(<ExamplesBlock items={items} />);
    expect(screen.getByText("I am happy.")).toBeInTheDocument();
    expect(screen.getByText("ฉันมีความสุข")).toBeInTheDocument();
  });

  it("shows Vietnamese translation when language is vi", () => {
    mockLanguage.current = "vi";
    render(<ExamplesBlock items={items} />);
    expect(screen.getByText("Tôi vui.")).toBeInTheDocument();
  });

  it("omits translation line when missing for learner language", () => {
    mockLanguage.current = "zh-CN";
    render(<ExamplesBlock items={items} />);
    expect(screen.getByText("I am happy.")).toBeInTheDocument();
    // No Chinese translation exists, so no translation line rendered
    expect(screen.queryByText("ฉันมีความสุข")).not.toBeInTheDocument();
  });

  it("shows English-only mode for unsupported language", () => {
    mockLanguage.current = "en";
    render(<ExamplesBlock items={items} />);
    expect(screen.getByText("I am happy.")).toBeInTheDocument();
    expect(screen.queryByText("ฉันมีความสุข")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Implement ExamplesBlock**

```tsx
// src/features/lessons/components/blocks/ExamplesBlock.tsx
import { useTranslation } from "react-i18next";
import type { ExampleItem } from "../../lesson.types";
import { getLearnerLanguage } from "../../utils/learnerLanguage";

type Props = { items: ExampleItem[] };

export default function ExamplesBlock({ items }: Props) {
  const { i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);

  return (
    <div className="rounded-lg bg-semantic-surface-2 p-4 space-y-3">
      {items.map((item) => {
        const translation = learnerLang ? item.translations[learnerLang] : undefined;
        return (
          <div key={item.id} className="space-y-0.5">
            <p className="text-base text-semantic-text">{item.english}</p>
            {translation && (
              <p className="text-sm text-semantic-text-muted">{translation}</p>
            )}
            {item.note && (
              <p className="text-xs text-semantic-subtle italic">{item.note}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 7: Run ExamplesBlock tests**

Run: `npx vitest run src/features/lessons/__tests__/ExamplesBlock.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 8: Write DialogueBlock tests**

```tsx
// src/features/lessons/__tests__/DialogueBlock.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DialogueBlock from "../components/blocks/DialogueBlock";
import type { DialogueLine } from "../lesson.types";

const mockLanguage = { current: "th" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: mockLanguage.current },
  }),
}));

const lines: DialogueLine[] = [
  { id: "d1", speaker: "Anna", text: "Hello!", translations: { th: "สวัสดี!" } },
  { id: "d2", speaker: "Somchai", text: "Hi Anna.", translations: { th: "สวัสดีอันนา" } },
];

describe("DialogueBlock", () => {
  beforeEach(() => {
    mockLanguage.current = "th";
  });

  it("shows speaker, English text, and Thai translation", () => {
    render(<DialogueBlock lines={lines} />);
    expect(screen.getByText("Anna")).toBeInTheDocument();
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.getByText("สวัสดี!")).toBeInTheDocument();
  });

  it("omits translation when missing for learner language", () => {
    mockLanguage.current = "zh-CN";
    render(<DialogueBlock lines={lines} />);
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.queryByText("สวัสดี!")).not.toBeInTheDocument();
  });

  it("shows English-only for unsupported language", () => {
    mockLanguage.current = "en";
    render(<DialogueBlock lines={lines} />);
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.queryByText("สวัสดี!")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 9: Implement DialogueBlock**

```tsx
// src/features/lessons/components/blocks/DialogueBlock.tsx
import { useTranslation } from "react-i18next";
import { clsx } from "clsx";
import type { DialogueLine } from "../../lesson.types";
import { getLearnerLanguage } from "../../utils/learnerLanguage";

type Props = { lines: DialogueLine[] };

export default function DialogueBlock({ lines }: Props) {
  const { i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);

  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        const translation = learnerLang ? line.translations[learnerLang] : undefined;
        return (
          <div
            key={line.id}
            className={clsx(
              "max-w-[85%] rounded-lg p-3",
              i % 2 === 0 ? "bg-primary-500/10 mr-auto" : "bg-semantic-surface-2 ml-auto",
            )}
          >
            <p className="text-xs font-semibold text-semantic-text-muted mb-1">{line.speaker}</p>
            <p className="text-base text-semantic-text">{line.text}</p>
            {translation && (
              <p className="text-sm text-semantic-text-muted mt-1">{translation}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 10: Run DialogueBlock tests**

Run: `npx vitest run src/features/lessons/__tests__/DialogueBlock.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 11: Run typecheck**

Run: `npm run type-check`
Expected: PASS — all data files and components now use the new types

- [ ] **Step 12: Commit**

```bash
git add src/features/lessons/components/blocks/VocabListBlock.tsx src/features/lessons/components/blocks/ExamplesBlock.tsx src/features/lessons/components/blocks/DialogueBlock.tsx src/features/lessons/__tests__/VocabListBlock.test.tsx src/features/lessons/__tests__/ExamplesBlock.test.tsx src/features/lessons/__tests__/DialogueBlock.test.tsx
git commit -m "feat(lessons): update block components for localized content with learner language support"
```

---

## Task 5: Fix Existing Tests

**Files:**
- Modify: `src/features/lessons/__tests__/SectionRenderer.test.tsx`
- Modify: `src/features/lessons/__tests__/data.test.ts`

- [ ] **Step 1: Update SectionRenderer test data**

The test uses an `ExampleItem` with the old shape. Update it to the new shape:

In `src/features/lessons/__tests__/SectionRenderer.test.tsx`, find:
```ts
{ id: "b3", type: "examples", items: [{ english: "Hello", translation: "สวัสดี" }] },
```

Replace with:
```ts
{ id: "b3", type: "examples", items: [{ id: "test-ex", english: "Hello", translations: { th: "สวัสดี" } }] },
```

Also add a mock for react-i18next at the top of the file (after imports):
```ts
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "th" },
  }),
}));
```

And add `vi` to the vitest import:
```ts
import { describe, it, expect, vi } from "vitest";
```

- [ ] **Step 2: Run SectionRenderer tests**

Run: `npx vitest run src/features/lessons/__tests__/SectionRenderer.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 3: Run all unit tests**

Run: `npm test`
Expected: PASS — all 306+ tests pass

- [ ] **Step 4: Commit**

```bash
git add src/features/lessons/__tests__/
git commit -m "test(lessons): fix existing tests for new content type shapes"
```

---

## Task 6: zh-CN Locale + Language Switcher

**Files:**
- Create: `src/locales/zh-CN/zh-CN.json`
- Modify: `src/lib/i18n.ts`
- Modify: `src/components/LanguageSwitcher.tsx`
- Modify: `src/locales/en/en.json`
- Modify: `src/locales/th/th.json`
- Modify: `src/locales/vi/vi.json`

- [ ] **Step 1: Create zh-CN locale file**

Create `src/locales/zh-CN/zh-CN.json` with full Simplified Chinese translations matching the en.json key structure. This is a large file — copy the en.json structure and translate all values to Simplified Chinese.

The file must include all top-level keys from en.json: `hero`, `features`, `cta`, `common`, `flashcards`, `contact`, `about`, `auth`, `dashboard`, `lessons`, `settings`.

For the new vocab key, add under `lessons`:
```json
"vocab": {
  "revealAnswer": "显示答案"
}
```

- [ ] **Step 2: Add vocab i18n keys to en/th/vi locale files**

Add to `src/locales/en/en.json` inside the `lessons` object:
```json
"vocab": {
  "revealAnswer": "Reveal answer"
}
```

Add to `src/locales/th/th.json` inside the `lessons` object:
```json
"vocab": {
  "revealAnswer": "เฉลยคำตอบ"
}
```

Add to `src/locales/vi/vi.json` inside the `lessons` object:
```json
"vocab": {
  "revealAnswer": "Xem đáp án"
}
```

- [ ] **Step 3: Register zh-CN in i18n config**

Update `src/lib/i18n.ts`:

```ts
// src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en/en.json';
import th from '../locales/th/th.json';
import vi from '../locales/vi/vi.json';
import zhCN from '../locales/zh-CN/zh-CN.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'th', 'vi', 'zh-CN'],
    nonExplicitSupportedLngs: true,
    resources: {
      en: { translation: en },
      th: { translation: th },
      vi: { translation: vi },
      'zh-CN': { translation: zhCN },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

- [ ] **Step 4: Update LanguageSwitcher**

In `src/components/LanguageSwitcher.tsx`, update the language list and metadata:

Replace:
```ts
const UI_LANGUAGES = ['en', 'th', 'vi'] as const;
type UILang = typeof UI_LANGUAGES[number];

const LANG_META: Record<UILang, { native: string; short: string }> = {
  en: { native: 'English',    short: 'EN' },
  th: { native: 'ไทย',        short: 'TH' },
  vi: { native: 'Tiếng Việt', short: 'VI' },
};
```

With:
```ts
const UI_LANGUAGES = ['en', 'th', 'vi', 'zh-CN'] as const;
type UILang = typeof UI_LANGUAGES[number];

const LANG_META: Record<UILang, { native: string; short: string }> = {
  en:      { native: 'English',    short: 'EN' },
  th:      { native: 'ไทย',        short: 'TH' },
  vi:      { native: 'Tiếng Việt', short: 'VI' },
  'zh-CN': { native: '中文',       short: 'ZH' },
};
```

Also update the language normalization logic. Replace:
```ts
const rawLang = i18n.language.split('-')[0].toLowerCase();
const currentLang: UILang = (UI_LANGUAGES as readonly string[]).includes(rawLang)
  ? (rawLang as UILang)
  : 'en';
```

With:
```ts
const rawLang = i18n.language;
const currentLang: UILang = (UI_LANGUAGES as readonly string[]).includes(rawLang)
  ? (rawLang as UILang)
  : rawLang.split('-')[0].toLowerCase() === 'zh'
    ? 'zh-CN'
    : (UI_LANGUAGES as readonly string[]).includes(rawLang.split('-')[0].toLowerCase())
      ? (rawLang.split('-')[0].toLowerCase() as UILang)
      : 'en';
```

- [ ] **Step 5: Run typecheck**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/locales/zh-CN/ src/lib/i18n.ts src/components/LanguageSwitcher.tsx src/locales/en/en.json src/locales/th/th.json src/locales/vi/vi.json
git commit -m "feat(i18n): add zh-CN locale, update language switcher, add vocab card i18n keys"
```

---

## Task 7: Update E2E Tests + Full Validation

**Files:**
- Modify: `e2e/lessons.spec.ts`

- [ ] **Step 1: Update vocab e2e test**

In `e2e/lessons.spec.ts`, replace the vocab test:

```ts
test("vocabulary section renders vocab cards", async ({ page }) => {
  await page.goto("/lessons/unit-1/vocabulary");
  // Default test language is English — English-only mode shows the English word on front
  await expect(page.getByText("hello")).toBeVisible();
  await expect(page.getByText("Reveal answer").first()).toBeVisible();
});
```

- [ ] **Step 2: Run typecheck**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Run unit tests**

Run: `npm test`
Expected: PASS — all tests

- [ ] **Step 4: Run e2e tests**

Run: `npx playwright test e2e/lessons.spec.ts`
Expected: PASS — all 16 tests

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 6: Fix any failures and rerun**

If any test or lint failure, fix and rerun. Do not skip.

- [ ] **Step 7: Commit if fixes were needed**

```bash
git add -A
git commit -m "fix: address test/lint issues from content localization"
```
