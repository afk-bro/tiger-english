# Seed Migration Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate `supabase/migrations/20260322000001_seed_csv_sets.sql` from 17 CSV files via a TypeScript generator script.

**Architecture:** Three focused utility modules (`seed-utils`, `csv-parser`, `validator`) are tested with Vitest, then wired together in a thin orchestrator script (`generate-seed-migration.ts`). The orchestrator is the only file with I/O side effects; everything else is pure and unit-testable.

**Tech Stack:** TypeScript, tsx (runtime), Vitest (tests), papaparse (CSV parsing), Node crypto (SHA-256 UUIDs)

---

## Discovered Constraint

All standard CSVs have an empty `native_text` column — these are English cards without a native-language translation yet. Since `native_text` is `NOT NULL` in the schema, the generator must fall back to `english_text` whenever `native_text` is null after normalization. This applies to every CSV, not just the legacy file.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/data/seed/sets/meta.ts` | Create | Product metadata for all 17 sets |
| `scripts/lib/seed-utils.ts` | Create | Pure functions: normalize, UUID gen, SQL escaping |
| `scripts/lib/csv-parser.ts` | Create | CSV parsing + format detection |
| `scripts/lib/validator.ts` | Create | Metadata integrity + per-row validation |
| `scripts/lib/__tests__/seed-utils.test.ts` | Create | Unit tests for seed-utils |
| `scripts/lib/__tests__/csv-parser.test.ts` | Create | Unit tests for csv-parser |
| `scripts/lib/__tests__/validator.test.ts` | Create | Unit tests for validator |
| `scripts/generate-seed-migration.ts` | Create | Orchestrator: reads CSVs, emits SQL |
| `supabase/migrations/20260322000001_seed_csv_sets.sql` | Create (generated) | Output migration |

---

## Task 1: Install papaparse and create meta.ts

**Files:**
- Modify: `package.json`
- Create: `src/data/seed/sets/meta.ts`

- [ ] **Step 1: Install papaparse**

```bash
npm install --save-dev papaparse @types/papaparse tsx
```

Expected: papaparse added to devDependencies in package.json.

- [ ] **Step 2: Create meta.ts**

Create `src/data/seed/sets/meta.ts`:

```typescript
export interface SetMetaEntry {
  title: string;
  description: string;
  is_public?: boolean; // defaults to true
  sort_order: number;
}

export const SET_META: Record<string, SetMetaEntry> = {
  'greetings_small_talk.csv': {
    title: 'Greetings & Small Talk',
    description: 'Everyday greetings, introductions, and casual conversation phrases',
    sort_order: 1,
  },
  'numbers_1_100.csv': {
    title: 'Numbers 1–100',
    description: 'Learn to read and write numbers from one to one hundred',
    sort_order: 2,
  },
  'numbers_1_100_words.csv': {
    title: 'Numbers 1–100 (Words)',
    description: 'Numbers one to one hundred written out as English words',
    sort_order: 3,
  },
  'numbers_1_100_phonetic.csv': {
    title: 'Numbers 1–100 (Phonetic)',
    description: 'Phonetic pronunciation guide for numbers one to one hundred',
    sort_order: 4,
  },
  'fruit_20_basic.csv': {
    title: 'Fruit',
    description: 'Common fruits for everyday vocabulary',
    sort_order: 5,
  },
  'vegetables_20_basic.csv': {
    title: 'Vegetables',
    description: 'Common vegetables for everyday vocabulary',
    sort_order: 6,
  },
  'food_single_words_basic.csv': {
    title: 'Food',
    description: 'Essential food vocabulary — single words for beginners',
    sort_order: 7,
  },
  'cutlery_china_10_basic.csv': {
    title: 'Cutlery & Tableware',
    description: 'Knives, forks, plates, and other table items',
    sort_order: 8,
  },
  'daily_life_20.csv': {
    title: 'Daily Life',
    description: 'Vocabulary for common everyday activities and routines',
    sort_order: 9,
  },
  'time_20.csv': {
    title: 'Time',
    description: 'Telling the time, days, months, and time expressions',
    sort_order: 10,
  },
  'shopping_money_20.csv': {
    title: 'Shopping & Money',
    description: 'Vocabulary for shopping, prices, and handling money',
    sort_order: 11,
  },
  'directions_transportation_20.csv': {
    title: 'Directions & Transportation',
    description: 'Asking for and giving directions, and transport vocabulary',
    sort_order: 12,
  },
  'accommodation_hotels_20.csv': {
    title: 'Accommodation & Hotels',
    description: 'Vocabulary for checking in, hotel facilities, and lodging',
    sort_order: 13,
  },
  'travel_essentials.csv': {
    title: 'Travel Essentials',
    description: 'Essential phrases and vocabulary for travelling',
    sort_order: 14,
  },
  'work_business_20.csv': {
    title: 'Work & Business',
    description: 'Professional vocabulary for the workplace and business settings',
    sort_order: 15,
  },
  'dating_social_20.csv': {
    title: 'Dating & Social',
    description: 'Vocabulary for socialising, dating, and meeting new people',
    sort_order: 16,
  },
  'emergencies_health_20.csv': {
    title: 'Emergencies & Health',
    description: 'Essential vocabulary for medical situations and emergencies',
    sort_order: 17,
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json src/data/seed/sets/meta.ts
git commit -m "feat(seed): add papaparse and SET_META for all 17 CSV sets"
```

---

## Task 2: TDD seed-utils.ts

**Files:**
- Create: `scripts/lib/__tests__/seed-utils.test.ts`
- Create: `scripts/lib/seed-utils.ts`

- [ ] **Step 1: Write failing tests**

Create `scripts/lib/__tests__/seed-utils.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  toUuid,
  sha256SetId,
  sha256CardId,
  sqlLiteral,
  normalizeText,
  normalizeCategory,
} from '../seed-utils';

describe('toUuid', () => {
  it('formats 32 hex chars as 8-4-4-4-12 UUID', () => {
    expect(toUuid('abcdef1234567890abcdef1234567890')).toBe(
      'abcdef12-3456-7890-abcd-ef1234567890'
    );
  });

  it('truncates input longer than 32 chars', () => {
    const result = toUuid('a'.repeat(40));
    expect(result).toBe('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  });
});

describe('sha256SetId', () => {
  it('returns a deterministic UUID for a filename', () => {
    const id1 = sha256SetId('fruit_20_basic.csv');
    const id2 = sha256SetId('fruit_20_basic.csv');
    expect(id1).toBe(id2);
  });

  it('returns different UUIDs for different filenames', () => {
    expect(sha256SetId('fruit_20_basic.csv')).not.toBe(
      sha256SetId('vegetables_20_basic.csv')
    );
  });

  it('returns a valid UUID format', () => {
    const uuid = sha256SetId('fruit_20_basic.csv');
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});

describe('sha256CardId', () => {
  it('returns deterministic UUID for same inputs', () => {
    const id1 = sha256CardId('fruit.csv', 'Apple', 'fruit', 1);
    const id2 = sha256CardId('fruit.csv', 'Apple', 'fruit', 1);
    expect(id1).toBe(id2);
  });

  it('differs from set ID for same filename', () => {
    expect(sha256CardId('fruit.csv', 'Apple', 'fruit', 1)).not.toBe(
      sha256SetId('fruit.csv')
    );
  });

  it('changes when sort_order changes', () => {
    expect(sha256CardId('fruit.csv', 'Apple', 'fruit', 1)).not.toBe(
      sha256CardId('fruit.csv', 'Apple', 'fruit', 2)
    );
  });

  it('handles null category', () => {
    const id = sha256CardId('fruit.csv', 'Apple', null, 1);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});

describe('sqlLiteral', () => {
  it('wraps a string in single quotes', () => {
    expect(sqlLiteral('hello')).toBe("'hello'");
  });

  it('escapes single quotes by doubling them', () => {
    expect(sqlLiteral("I'm fine")).toBe("'I''m fine'");
  });

  it('escapes embedded newlines as literal \\n', () => {
    expect(sqlLiteral('line1\nline2')).toBe("'line1\\nline2'");
  });

  it('escapes carriage returns as literal \\r', () => {
    expect(sqlLiteral('a\rb')).toBe("'a\\rb'");
  });

  it('returns NULL (unquoted) for null', () => {
    expect(sqlLiteral(null)).toBe('NULL');
  });

  it('returns NULL (unquoted) for undefined', () => {
    expect(sqlLiteral(undefined)).toBe('NULL');
  });
});

describe('normalizeText', () => {
  it('returns null for null input', () => {
    expect(normalizeText(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizeText('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(normalizeText('   ')).toBeNull();
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeText('  hello  ')).toBe('hello');
  });

  it('collapses internal whitespace to single space', () => {
    expect(normalizeText('hello   world')).toBe('hello world');
  });

  it('replaces left single curly quote', () => {
    expect(normalizeText('\u2018hello')).toBe("'hello");
  });

  it('replaces right single curly quote', () => {
    expect(normalizeText('it\u2019s')).toBe("it's");
  });

  it('replaces left double curly quote', () => {
    expect(normalizeText('\u201Chello')).toBe('"hello');
  });

  it('replaces right double curly quote', () => {
    expect(normalizeText('hello\u201D')).toBe('hello"');
  });
});

describe('normalizeCategory', () => {
  it('lowercases the category', () => {
    expect(normalizeCategory('Fruit')).toBe('fruit');
  });

  it('lowercases and trims', () => {
    expect(normalizeCategory('  FRUIT  ')).toBe('fruit');
  });

  it('returns null for null', () => {
    expect(normalizeCategory(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizeCategory('')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- scripts/lib/__tests__/seed-utils.test.ts
```

Expected: FAIL — `Cannot find module '../seed-utils'`

- [ ] **Step 3: Implement seed-utils.ts**

Create `scripts/lib/seed-utils.ts`:

```typescript
import { createHash } from 'crypto';

/** Formats first 32 hex characters of a SHA-256 digest as a UUID (8-4-4-4-12). */
export function toUuid(hex: string): string {
  const h = hex.slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

export function sha256SetId(filename: string): string {
  return toUuid(createHash('sha256').update(filename).digest('hex'));
}

export function sha256CardId(
  filename: string,
  englishText: string,
  category: string | null,
  sortOrder: number,
): string {
  const key = `${filename}:${englishText}:${category ?? ''}:${sortOrder}`;
  return toUuid(createHash('sha256').update(key).digest('hex'));
}

/** Returns a SQL string literal or the keyword NULL. */
export function sqlLiteral(value: string | null | undefined): string {
  if (value == null) return 'NULL';
  const escaped = value.replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  return `'${escaped}'`;
}

const CURLY_QUOTE_MAP: [RegExp, string][] = [
  [/[\u2018\u2019]/g, "'"],
  [/[\u201C\u201D]/g, '"'],
];

/** Normalizes a text field: replace curly quotes, trim, collapse internal whitespace, null-for-empty. */
export function normalizeText(value: string | null | undefined): string | null {
  if (value == null) return null;
  let s = value;
  for (const [pattern, replacement] of CURLY_QUOTE_MAP) {
    s = s.replace(pattern, replacement);
  }
  s = s.trim().replace(/\s+/g, ' ');
  return s.length === 0 ? null : s;
}

/** Like normalizeText but also lowercases (for category field). */
export function normalizeCategory(value: string | null | undefined): string | null {
  const s = normalizeText(value);
  return s === null ? null : s.toLowerCase();
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- scripts/lib/__tests__/seed-utils.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/seed-utils.ts scripts/lib/__tests__/seed-utils.test.ts
git commit -m "feat(seed): add seed-utils — normalize, UUID gen, SQL escaping"
```

---

## Task 3: TDD csv-parser.ts

**Files:**
- Create: `scripts/lib/__tests__/csv-parser.test.ts`
- Create: `scripts/lib/csv-parser.ts`

- [ ] **Step 1: Write failing tests**

Create `scripts/lib/__tests__/csv-parser.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { detectFormat, parseCsv } from '../csv-parser';

const V2_HEADER = 'native_text,english_text,category,part_of_speech,level,example_sentence,english_audio_url,native_audio_url,image_url,sort_order';
const LEGACY_HEADER = 'English Phrase,Category';

describe('detectFormat', () => {
  it('detects v2 format', () => {
    const headers = V2_HEADER.split(',');
    expect(detectFormat(headers)).toBe('v2');
  });

  it('detects legacy format', () => {
    expect(detectFormat(['English Phrase', 'Category'])).toBe('legacy');
  });

  it('throws on unrecognised headers', () => {
    expect(() => detectFormat(['foo', 'bar'])).toThrow('Unrecognised CSV headers');
  });
});

describe('parseCsv — v2 format', () => {
  const csv = [
    V2_HEADER,
    ',Apple,fruit,noun,basic,I like apple.,,,,1',
    ',Banana,fruit,noun,basic,I like banana.,,,,2',
  ].join('\n');

  it('parses rows into RawRow objects', () => {
    const rows = parseCsv(csv, 'fruit.csv');
    expect(rows).toHaveLength(2);
    expect(rows[0].english_text).toBe('Apple');
    expect(rows[0].category).toBe('fruit');
    expect(rows[0].sort_order).toBe(1);
  });

  it('returns null for empty native_text', () => {
    const rows = parseCsv(csv, 'fruit.csv');
    expect(rows[0].native_text).toBeNull();
  });

  it('handles CRLF line endings', () => {
    const crlfCsv = [V2_HEADER, ',Apple,fruit,noun,basic,,,,,1'].join('\r\n');
    const rows = parseCsv(crlfCsv, 'fruit.csv');
    expect(rows).toHaveLength(1);
    expect(rows[0].english_text).toBe('Apple');
  });

  it('strips UTF-8 BOM', () => {
    const bomCsv = '\uFEFF' + [V2_HEADER, ',Apple,fruit,noun,basic,,,,,1'].join('\n');
    const rows = parseCsv(bomCsv, 'fruit.csv');
    expect(rows).toHaveLength(1);
  });

  it('handles quoted fields containing commas', () => {
    const csvWithComma = [
      V2_HEADER,
      ',"Hello, world",greetings,phrase,basic,"Hi, there!",,,,1',
    ].join('\n');
    const rows = parseCsv(csvWithComma, 'test.csv');
    expect(rows[0].english_text).toBe('Hello, world');
    expect(rows[0].example_sentence).toBe('Hi, there!');
  });

  it('handles quoted fields containing embedded newlines', () => {
    const csvWithNewline = [
      V2_HEADER,
      ',"Line one\nLine two",greetings,phrase,basic,,,,,1',
    ].join('\n');
    const rows = parseCsv(csvWithNewline, 'test.csv');
    expect(rows[0].english_text).toBe('Line one\nLine two');
  });

  it('parses sort_order as a number', () => {
    const rows = parseCsv(csv, 'fruit.csv');
    expect(typeof rows[0].sort_order).toBe('number');
    expect(rows[0].sort_order).toBe(1);
  });
});

describe('parseCsv — legacy format', () => {
  const csv = [LEGACY_HEADER, 'Hello,Greeting', 'Goodbye,Farewell'].join('\n');

  it('maps English Phrase to english_text', () => {
    const rows = parseCsv(csv, 'travel_essentials.csv');
    expect(rows[0].english_text).toBe('Hello');
  });

  it('maps English Phrase to native_text as fallback', () => {
    const rows = parseCsv(csv, 'travel_essentials.csv');
    expect(rows[0].native_text).toBe('Hello');
  });

  it('maps Category to category', () => {
    const rows = parseCsv(csv, 'travel_essentials.csv');
    expect(rows[0].category).toBe('Greeting');
  });

  it('assigns 1-based sort_order from row position', () => {
    const rows = parseCsv(csv, 'travel_essentials.csv');
    expect(rows[0].sort_order).toBe(1);
    expect(rows[1].sort_order).toBe(2);
  });

  it('sets all other fields to null', () => {
    const rows = parseCsv(csv, 'travel_essentials.csv');
    expect(rows[0].part_of_speech).toBeNull();
    expect(rows[0].level).toBeNull();
    expect(rows[0].example_sentence).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- scripts/lib/__tests__/csv-parser.test.ts
```

Expected: FAIL — `Cannot find module '../csv-parser'`

- [ ] **Step 3: Implement csv-parser.ts**

Create `scripts/lib/csv-parser.ts`:

```typescript
import Papa from 'papaparse';

export type CsvFormat = 'v2' | 'legacy';

export interface RawRow {
  native_text: string | null;
  english_text: string | null;
  category: string | null;
  part_of_speech: string | null;
  level: string | null;
  example_sentence: string | null;
  english_audio_url: string | null;
  native_audio_url: string | null;
  image_url: string | null;
  sort_order: number;
}

const V2_REQUIRED = [
  'native_text', 'english_text', 'category', 'part_of_speech', 'level',
  'example_sentence', 'english_audio_url', 'native_audio_url', 'image_url', 'sort_order',
];
const LEGACY_REQUIRED = ['English Phrase', 'Category'];

export function detectFormat(headers: string[]): CsvFormat {
  const trimmed = headers.map((h) => h.trim());
  if (LEGACY_REQUIRED.every((h) => trimmed.includes(h))) return 'legacy';
  if (V2_REQUIRED.every((h) => trimmed.includes(h))) return 'v2';
  throw new Error(`Unrecognised CSV headers: ${JSON.stringify(headers)}`);
}

function str(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length === 0 ? null : s;
}

export function parseCsv(content: string, filename: string): RawRow[] {
  // Strip BOM
  const stripped = content.startsWith('\uFEFF') ? content.slice(1) : content;

  const result = Papa.parse<Record<string, string>>(stripped, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0) {
    throw new Error(`CSV parse error in ${filename}: ${result.errors[0].message}`);
  }

  if (result.data.length === 0) {
    throw new Error(`${filename} is empty`);
  }

  const headers = Object.keys(result.data[0]);
  const format = detectFormat(headers);

  return result.data.map((row, i) => {
    if (format === 'legacy') {
      const englishText = str(row['English Phrase']);
      return {
        native_text: englishText,
        english_text: englishText,
        category: str(row['Category']),
        part_of_speech: null,
        level: null,
        example_sentence: null,
        english_audio_url: null,
        native_audio_url: null,
        image_url: null,
        sort_order: i + 1,
      };
    }

    return {
      native_text: str(row['native_text']),
      english_text: str(row['english_text']),
      category: str(row['category']),
      part_of_speech: str(row['part_of_speech']),
      level: str(row['level']),
      example_sentence: str(row['example_sentence']),
      english_audio_url: str(row['english_audio_url']),
      native_audio_url: str(row['native_audio_url']),
      image_url: str(row['image_url']),
      sort_order: Number(row['sort_order']) || i + 1,
    };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- scripts/lib/__tests__/csv-parser.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/csv-parser.ts scripts/lib/__tests__/csv-parser.test.ts
git commit -m "feat(seed): add csv-parser — v2 and legacy format parsing"
```

---

## Task 4: TDD validator.ts

**Files:**
- Create: `scripts/lib/__tests__/validator.test.ts`
- Create: `scripts/lib/validator.ts`

- [ ] **Step 1: Write failing tests**

Create `scripts/lib/__tests__/validator.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { validateMeta, validateRows } from '../validator';
import type { SetMeta } from '../validator';

// validateMeta accepts meta + an explicit list of existing files for testability
const BASE_META: SetMeta = {
  'fruit.csv':  { title: 'Fruit',  description: 'Fruit', sort_order: 1 },
  'veggies.csv':{ title: 'Veggies',description: 'Veg',   sort_order: 2 },
};
const BASE_FILES = ['fruit.csv', 'veggies.csv'];

describe('validateMeta', () => {
  it('passes for valid meta with matching files', () => {
    expect(() => validateMeta(BASE_META, BASE_FILES)).not.toThrow();
  });

  it('throws on duplicate sort_order', () => {
    const meta: SetMeta = {
      'a.csv': { title: 'A', description: '', sort_order: 1 },
      'b.csv': { title: 'B', description: '', sort_order: 1 },
    };
    expect(() => validateMeta(meta, ['a.csv', 'b.csv'])).toThrow('Duplicate sort_order 1');
  });

  it('throws when a SET_META entry has no matching CSV file', () => {
    const meta: SetMeta = {
      'missing.csv': { title: 'Missing', description: '', sort_order: 1 },
    };
    expect(() => validateMeta(meta, [])).toThrow('missing.csv');
  });

  it('throws on blank title', () => {
    const meta: SetMeta = {
      'fruit.csv': { title: '   ', description: '', sort_order: 1 },
    };
    expect(() => validateMeta(meta, ['fruit.csv'])).toThrow('blank title');
  });

  it('throws on empty title', () => {
    const meta: SetMeta = {
      'fruit.csv': { title: '', description: '', sort_order: 1 },
    };
    expect(() => validateMeta(meta, ['fruit.csv'])).toThrow('blank title');
  });

  it('does not throw for CSV files with no SET_META entry (warns only)', () => {
    const meta: SetMeta = {
      'fruit.csv': { title: 'Fruit', description: '', sort_order: 1 },
    };
    // extra.csv exists on disk but not in meta — should not throw
    expect(() => validateMeta(meta, ['fruit.csv', 'extra.csv'])).not.toThrow();
  });
});

describe('validateRows', () => {
  it('passes for valid rows', () => {
    const rows = [
      { english_text: 'Apple', category: 'fruit', sort_order: 1 },
      { english_text: 'Banana', category: 'fruit', sort_order: 2 },
    ];
    expect(() => validateRows(rows, 'fruit.csv')).not.toThrow();
  });

  it('throws when english_text is null', () => {
    const rows = [{ english_text: null, category: 'fruit', sort_order: 1 }];
    expect(() => validateRows(rows, 'fruit.csv')).toThrow('english_text');
  });

  it('throws when english_text is empty string', () => {
    const rows = [{ english_text: '', category: 'fruit', sort_order: 1 }];
    expect(() => validateRows(rows, 'fruit.csv')).toThrow('english_text');
  });

  it('throws on duplicate sort_order', () => {
    const rows = [
      { english_text: 'Apple',  category: 'fruit', sort_order: 1 },
      { english_text: 'Banana', category: 'fruit', sort_order: 1 },
    ];
    expect(() => validateRows(rows, 'fruit.csv')).toThrow('duplicate sort_order 1');
  });

  it('throws on duplicate (english_text, category, sort_order) tuple', () => {
    const rows = [
      { english_text: 'Apple', category: 'fruit', sort_order: 1 },
      { english_text: 'Apple', category: 'fruit', sort_order: 1 },
    ];
    expect(() => validateRows(rows, 'fruit.csv')).toThrow('duplicate');
  });

  it('detects near-duplicates differing only by case — same sort_order', () => {
    // sort_order guard fires first, but the tuple check also catches it
    const rows = [
      { english_text: 'Apple', category: 'fruit', sort_order: 1 },
      { english_text: 'apple', category: 'fruit', sort_order: 1 },
    ];
    expect(() => validateRows(rows, 'fruit.csv')).toThrow();
  });

  it('detects near-duplicates differing only by case — different sort_orders', () => {
    // sort_order differs so sort_order guard does NOT fire;
    // tuple key is (english_text.toLowerCase() + ':' + category + ':' + sort_order)
    // apple:fruit:1 !== apple:fruit:2, so these two rows are legitimately distinct
    // This test verifies that case-folding happens and that Apple/apple with
    // SAME sort_order is caught regardless of which fires first
    const rows = [
      { english_text: 'Apple', category: 'fruit', sort_order: 1 },
      { english_text: 'apple', category: 'fruit', sort_order: 1 },
    ];
    expect(() => validateRows(rows, 'fruit.csv')).toThrow('duplicate');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- scripts/lib/__tests__/validator.test.ts
```

Expected: FAIL — `Cannot find module '../validator'`

- [ ] **Step 3: Implement validator.ts**

Create `scripts/lib/validator.ts`:

```typescript
export interface SetMetaEntry {
  title: string;
  description: string;
  is_public?: boolean;
  sort_order: number;
}

export type SetMeta = Record<string, SetMetaEntry>;

/**
 * Validates metadata integrity.
 * @param meta - The SET_META object
 * @param availableFiles - List of CSV filenames on disk (for testing; production passes readdirSync result)
 */
export function validateMeta(meta: SetMeta, availableFiles: string[]): void {
  const fileSet = new Set(availableFiles);

  // Duplicate sort_order check
  const sortOrders = Object.values(meta).map((m) => m.sort_order);
  const seen = new Set<number>();
  for (const s of sortOrders) {
    if (seen.has(s)) throw new Error(`Duplicate sort_order ${s} in SET_META`);
    seen.add(s);
  }

  // Per-entry checks
  for (const [filename, entry] of Object.entries(meta)) {
    if (!entry.title || !entry.title.trim()) {
      throw new Error(`blank title for "${filename}" in SET_META`);
    }
    if (!fileSet.has(filename)) {
      throw new Error(
        `SET_META entry "${filename}" has no matching CSV file on disk`,
      );
    }
  }

  // Warn about CSV files with no SET_META entry
  for (const file of availableFiles) {
    if (!(file in meta)) {
      console.warn(`Warning: ${file} has no SET_META entry — skipping`);
    }
  }
}

export interface ValidatableRow {
  english_text: string | null;
  category: string | null;
  sort_order: number;
}

/** Validates rows within a single CSV after normalization. */
export function validateRows(rows: ValidatableRow[], filename: string): void {
  const seenSortOrders = new Set<number>();
  const seenTuples = new Set<string>();

  for (const row of rows) {
    if (!row.english_text) {
      throw new Error(
        `${filename}: row with sort_order ${row.sort_order} has empty english_text`,
      );
    }

    if (seenSortOrders.has(row.sort_order)) {
      throw new Error(`${filename}: duplicate sort_order ${row.sort_order}`);
    }
    seenSortOrders.add(row.sort_order);

    const tuple = [
      (row.english_text ?? '').toLowerCase(),
      (row.category ?? '').toLowerCase(),
      row.sort_order,
    ].join(':');

    if (seenTuples.has(tuple)) {
      throw new Error(`${filename}: duplicate (english_text, category, sort_order) tuple: ${tuple}`);
    }
    seenTuples.add(tuple);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- scripts/lib/__tests__/validator.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/validator.ts scripts/lib/__tests__/validator.test.ts
git commit -m "feat(seed): add validator — metadata integrity and row-level checks"
```

---

## Task 5: Implement generator and run it

**Files:**
- Create: `scripts/generate-seed-migration.ts`
- Create (generated): `supabase/migrations/20260322000001_seed_csv_sets.sql`

No unit tests for the orchestrator (pure I/O wiring). Verified by running it and spot-checking the output.

- [ ] **Step 1: Implement generate-seed-migration.ts**

Create `scripts/generate-seed-migration.ts`:

```typescript
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { SET_META } from '../src/data/seed/sets/meta.js';
import { parseCsv } from './lib/csv-parser.js';
import {
  normalizeText,
  normalizeCategory,
  sha256SetId,
  sha256CardId,
  sqlLiteral,
} from './lib/seed-utils.js';
import { validateMeta, validateRows } from './lib/validator.js';

const CSV_DIR = 'src/data/seed/sets';
const OUTPUT = 'supabase/migrations/20260322000001_seed_csv_sets.sql';

// --- Validation ---
const csvFiles = readdirSync(CSV_DIR).filter((f) => f.endsWith('.csv'));
validateMeta(SET_META, csvFiles);

// --- Process sets in sort_order ---
const entries = Object.entries(SET_META).sort(([, a], [, b]) => a.sort_order - b.sort_order);

const lines: string[] = [
  '-- Generated by scripts/generate-seed-migration.ts — DO NOT EDIT BY HAND',
  '-- Regenerate with: npx tsx scripts/generate-seed-migration.ts',
  '-- Idempotency: ON CONFLICT (id) DO NOTHING — content changes need a new migration',
  '-- Spec: docs/superpowers/specs/2026-03-22-seed-migration-design.md',
  '',
];

let totalCards = 0;
let legacyAdapted = 0;

for (const [filename, meta] of entries) {
  const content = readFileSync(join(CSV_DIR, filename), 'utf-8');
  const rawRows = parseCsv(content, filename);

  // Normalize all text fields
  const rows = rawRows.map((row) => {
    const englishText = normalizeText(row.english_text);
    const nativeText = normalizeText(row.native_text) ?? englishText; // NOT NULL fallback
    return {
      native_text:        nativeText,
      english_text:       englishText,
      category:           normalizeCategory(row.category),
      part_of_speech:     normalizeText(row.part_of_speech),
      level:              normalizeText(row.level),
      example_sentence:   normalizeText(row.example_sentence),
      english_audio_url:  normalizeText(row.english_audio_url),
      native_audio_url:   normalizeText(row.native_audio_url),
      image_url:          normalizeText(row.image_url),
      sort_order:         row.sort_order,
    };
  });

  validateRows(rows, filename);

  // Track legacy files
  const isLegacy = rawRows.some((r) => r.native_text === r.english_text && r.part_of_speech === null);
  if (isLegacy) legacyAdapted++;

  const setId = sha256SetId(filename);
  const isPublic = meta.is_public ?? true;

  lines.push(`-- === ${meta.title} (${filename}) ===`);
  lines.push('');
  lines.push(`INSERT INTO flashcard_sets (id, title, description, is_public, created_by)`);
  lines.push(`VALUES (${sqlLiteral(setId)}, ${sqlLiteral(meta.title)}, ${sqlLiteral(meta.description)}, ${isPublic}, null)`);
  lines.push(`ON CONFLICT (id) DO NOTHING;`);
  lines.push('');
  lines.push(`INSERT INTO flashcards (`);
  lines.push(`  id, set_id, native_text, english_text, category,`);
  lines.push(`  part_of_speech, level, example_sentence,`);
  lines.push(`  english_audio_url, native_audio_url, image_url, sort_order`);
  lines.push(`) VALUES`);

  const valueLines = rows.map((row) => {
    const cardId = sha256CardId(filename, row.english_text!, row.category, row.sort_order);
    return [
      `  (`,
      `    ${sqlLiteral(cardId)}, ${sqlLiteral(setId)},`,
      `    ${sqlLiteral(row.native_text)}, ${sqlLiteral(row.english_text)}, ${sqlLiteral(row.category)},`,
      `    ${sqlLiteral(row.part_of_speech)}, ${sqlLiteral(row.level)}, ${sqlLiteral(row.example_sentence)},`,
      `    ${sqlLiteral(row.english_audio_url)}, ${sqlLiteral(row.native_audio_url)}, ${sqlLiteral(row.image_url)}, ${row.sort_order}`,
      `  )`,
    ].join('\n');
  });

  lines.push(valueLines.join(',\n'));
  lines.push(`ON CONFLICT (id) DO NOTHING;`);
  lines.push('');

  totalCards += rows.length;
}

// --- Write output ---
writeFileSync(OUTPUT, lines.join('\n'), 'utf-8');

console.log(`${entries.length} sets, ${totalCards} cards, ${legacyAdapted} legacy file${legacyAdapted !== 1 ? 's' : ''} adapted`);
console.log(`Written to ${OUTPUT}`);
```

- [ ] **Step 2: Run the generator**

```bash
npx tsx scripts/generate-seed-migration.ts
```

Expected output:
```
17 sets, 615 cards, 1 legacy file adapted
Written to supabase/migrations/20260322000001_seed_csv_sets.sql
```

- [ ] **Step 3: Spot-check the output SQL**

```bash
# Verify file exists and has content
wc -l supabase/migrations/20260322000001_seed_csv_sets.sql

# Check first set block looks correct
head -30 supabase/migrations/20260322000001_seed_csv_sets.sql

# Verify UUID format in output (should all match UUID pattern)
grep -E "^  \(" supabase/migrations/20260322000001_seed_csv_sets.sql | head -5

# Confirm ON CONFLICT appears for every set (should be 34 = 17 sets × 2 tables)
grep -c "ON CONFLICT" supabase/migrations/20260322000001_seed_csv_sets.sql

# Confirm no literal 'null' strings (should be SQL NULL keyword)
grep -c "'null'" supabase/migrations/20260322000001_seed_csv_sets.sql
```

Expected: 34 ON CONFLICT lines, 0 `'null'` strings.

- [ ] **Step 4: Run the full test suite to confirm nothing broke**

```bash
npm test
```

Expected: All existing tests PASS (generator tasks don't touch app code).

- [ ] **Step 5: Commit everything**

```bash
git add \
  scripts/generate-seed-migration.ts \
  supabase/migrations/20260322000001_seed_csv_sets.sql \
  src/data/seed/sets/*.csv
git commit -m "feat(seed): add generator script and CSV seed migration for 17 sets"
```

---

## Done

All 17 CSV sets are now in `supabase/migrations/20260322000001_seed_csv_sets.sql`.

Apply with:
```bash
supabase db push
# or for a clean reset:
supabase db reset
```
