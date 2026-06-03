# Lesson Image Icon + Photo Sourcing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Leonardo image source in the lesson-image pipeline with automatic Twemoji-icon resolution + a Pixabay photo fallback, self-hosted into the existing Supabase bucket, with zero frontend changes.

**Architecture:** Keep candidate enumeration, sidecar persistence, Supabase upload, and runtime hydration. Swap only the per-candidate image source: `resolveIcon(query) ?? resolvePhoto(query)`. Candidates gain a clean `query` noun (vocab word / pair word); the verbose Leonardo `prompt` field and the whole `lesson-image-config.ts` (style suffixes, prompt hashing, model id) are deleted. Icons (SVG) are rasterized to 512×512 transparent PNG via `@resvg/resvg-js` before upload so the bucket stays raster.

**Tech Stack:** TypeScript run via `tsx`, Vitest, Iconify API (`api.iconify.design`), Pixabay API, `@resvg/resvg-js`, Supabase storage client.

**Spec:** `docs/superpowers/specs/2026-06-03-lesson-image-icon-photo-sourcing-design.md`

---

## File Structure

- **Modify** `scripts/lib/lesson-image-candidates.ts` — drop `prompt`, add `query?: string`; stop importing config.
- **Modify** `scripts/__tests__/lesson-image-candidates.test.ts` — assert `query`, drop prompt/suffix assertions.
- **Delete** `scripts/lesson-image-config.ts` and `scripts/__tests__/lesson-image-config.test.ts` — fully unused after the swap.
- **Create** `scripts/lib/icon-resolver.ts` + `scripts/lib/__tests__/icon-resolver.test.ts` — Iconify lookup + rasterize.
- **Create** `scripts/lib/photo-resolver.ts` + `scripts/lib/__tests__/photo-resolver.test.ts` — Pixabay search + download.
- **Modify** `scripts/generate-lesson-images.ts` — swap Leonardo chain for the resolvers; new sidecar shape; new dry-run plan output; remove all `leonardo*` functions.
- **Modify** `CLAUDE.md` — document `PIXABAY_API_KEY`, mark `LEONARDO_API_KEY` dormant, update the "Lesson images" section.
- **Modify** the footer/about surface — add the Twemoji CC-BY credit line.
- **Modify** `package.json` — add `@resvg/resvg-js` dev dependency.

---

## Task 1: Candidate `query` field

**Files:**
- Modify: `scripts/lib/lesson-image-candidates.ts`
- Test: `scripts/__tests__/lesson-image-candidates.test.ts`

- [ ] **Step 1: Update the failing test for vocab + match-pair `query`**

In `scripts/__tests__/lesson-image-candidates.test.ts`, replace the prompt/suffix expectations. For the match-exercise test, change the per-pair assertion to:

```ts
const bookPair = candidates.find((c) => c.id === "u2-match-book");
expect(bookPair).toMatchObject({ kind: "match-pair", id: "u2-match-book", query: "book" });
expect(bookPair).not.toHaveProperty("prompt");
```

For the vocab test (around the existing line ~186 "falls back to templateVocabPrompt"), replace with:

```ts
const pencil = candidates.find((c) => c.id === "u2-v-pencil");
expect(pencil).toMatchObject({ kind: "vocab", query: "pencil" });
```

Remove any assertion referencing `OBJECT_STYLE_SUFFIX`, `prompt`, or `templateVocabPrompt`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/__tests__/lesson-image-candidates.test.ts`
Expected: FAIL — candidates still carry `prompt`, not `query`.

- [ ] **Step 3: Rewrite the candidate type + builder**

In `scripts/lib/lesson-image-candidates.ts`: delete the `import { templateVocabPrompt, templatePairPrompt } from "../lesson-image-config";` line. Change the type and emit sites:

```ts
export type Candidate = {
  kind: CandidateKind;
  id: string;
  /** Clean search term for icon/photo resolution. Undefined for slots
   *  with no single-noun referent (unit/section/dialogue/exercise) —
   *  those are reported as skipped, never resolved. */
  query?: string;
};
```

Emit sites:
```ts
// unit
out.push({ kind: "unit", id: sidecarKeyForUnit() });
// section
out.push({ kind: "section", id: sidecarKeyForSection(section.key) });
// vocab
out.push({ kind: "vocab", id: item.id, query: item.word });
// dialogue
out.push({ kind: "dialogue", id: block.id });
// exercise (block-level)
out.push({ kind: "exercise", id: block.id });
// match-pair
out.push({ kind: "match-pair", id: pair.id, query: pair.word });
```

Keep the existing guards (`item.noImage` skip, `block.imagePrompt` presence for dialogue/exercise, `pair.imagePrompt` presence for match-pair — these still decide *whether a slot exists*, even though the prompt text is no longer used). Update the surrounding comments to drop Leonardo/style-suffix references.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scripts/__tests__/lesson-image-candidates.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/lesson-image-candidates.ts scripts/__tests__/lesson-image-candidates.test.ts
git commit -m "refactor(lesson-images): candidates carry clean query, drop Leonardo prompt"
```

---

## Task 2: Delete the now-unused config module

**Files:**
- Delete: `scripts/lesson-image-config.ts`
- Delete: `scripts/__tests__/lesson-image-config.test.ts`

> Note: `scripts/generate-lesson-images.ts` still imports this module and will not type-check until Task 5. That is expected — Task 5 removes the import. Do not run a full `npm run type-check` between Task 2 and Task 5; rely on the per-file unit tests.

- [ ] **Step 1: Delete the files**

```bash
git rm scripts/lesson-image-config.ts scripts/__tests__/lesson-image-config.test.ts
```

- [ ] **Step 2: Verify the candidate test still passes (it no longer imports config)**

Run: `npm test -- scripts/__tests__/lesson-image-candidates.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor(lesson-images): delete unused prompt/style config"
```

---

## Task 3: Icon resolver

**Files:**
- Create: `scripts/lib/icon-resolver.ts`
- Test: `scripts/lib/__tests__/icon-resolver.test.ts`
- Modify: `package.json` (add `@resvg/resvg-js`)

- [ ] **Step 1: Add the rasterizer dependency**

Run: `npm install --save-dev @resvg/resvg-js`
Expected: `@resvg/resvg-js` appears under `devDependencies` in `package.json`.

- [ ] **Step 2: Write the failing test**

```ts
// scripts/lib/__tests__/icon-resolver.test.ts
import { describe, it, expect, vi } from "vitest";
import { resolveIcon, normalizeIconQuery } from "../icon-resolver";

describe("normalizeIconQuery", () => {
  it("lowercases, trims articles, hyphenates", () => {
    expect(normalizeIconQuery("  The World Map ")).toBe("world-map");
  });
});

describe("resolveIcon", () => {
  it("returns rasterized bytes on an icon hit", async () => {
    const fetchSvg = vi.fn().mockResolvedValue("<svg></svg>");
    const rasterize = vi.fn().mockReturnValue(Buffer.from("PNG"));
    const out = await resolveIcon("book", { fetchSvg }, rasterize);
    expect(fetchSvg).toHaveBeenCalledWith("twemoji", "book");
    expect(rasterize).toHaveBeenCalledWith("<svg></svg>");
    expect(out?.toString()).toBe("PNG");
  });

  it("applies the alias map before lookup", async () => {
    const fetchSvg = vi.fn().mockResolvedValue("<svg></svg>");
    await resolveIcon("world map", { fetchSvg }, () => Buffer.from("x"));
    expect(fetchSvg).toHaveBeenCalledWith("twemoji", "world-map");
  });

  it("returns null on a miss (no fetchSvg result)", async () => {
    const fetchSvg = vi.fn().mockResolvedValue(null);
    const rasterize = vi.fn();
    const out = await resolveIcon("flibbertigibbet", { fetchSvg }, rasterize);
    expect(out).toBeNull();
    expect(rasterize).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- scripts/lib/__tests__/icon-resolver.test.ts`
Expected: FAIL — `../icon-resolver` does not exist.

- [ ] **Step 4: Implement the resolver**

```ts
// scripts/lib/icon-resolver.ts
// Resolves a vocab noun to a rasterized Twemoji PNG. Pinning ONE icon
// set keeps every lesson image stylistically consistent; colorful
// emoji glyphs are easy to tell apart in a match grid. Pure + injectable
// so tests run without network or native rasterizer.
import { Resvg } from "@resvg/resvg-js";

export const ICON_SET = "twemoji";
export const ICON_PX = 512;

// Known vocab-word → Twemoji-name mismatches. Grow this as the dry-run
// surfaces UNRESOLVED items that DO have a sensible emoji.
const ALIASES: Record<string, string> = {
  "world-map": "world-map",
  bin: "wastebasket",
  "rubbish-bin": "wastebasket",
  rubber: "eraser",
};

export function normalizeIconQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .replace(/^(a|an|the)\s+/, "")
    .replace(/\s+/g, "-");
}

export type IconFetchers = {
  /** Returns SVG markup, or null when the set has no such icon. */
  fetchSvg: (set: string, name: string) => Promise<string | null>;
};

export function rasterizeSvg(svg: string): Buffer {
  const r = new Resvg(svg, { fitTo: { mode: "width", value: ICON_PX } });
  return r.render().asPng();
}

export async function resolveIcon(
  query: string,
  fetchers: IconFetchers,
  rasterize: (svg: string) => Buffer = rasterizeSvg,
): Promise<Buffer | null> {
  const norm = normalizeIconQuery(query);
  const name = ALIASES[norm] ?? norm;
  const svg = await fetchers.fetchSvg(ICON_SET, name);
  if (!svg) return null;
  return rasterize(svg);
}

// Real Iconify fetcher. The .svg endpoint 404s on missing icons, but
// can also 200 with a body that isn't an <svg>, so we check both.
export function makeIconifyFetchers(): IconFetchers {
  return {
    fetchSvg: async (set, name) => {
      const res = await fetch(`https://api.iconify.design/${set}/${name}.svg`);
      if (!res.ok) return null;
      const text = await res.text();
      return text.includes("<svg") ? text : null;
    },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- scripts/lib/__tests__/icon-resolver.test.ts`
Expected: PASS (3 tests + normalize test).

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/icon-resolver.ts scripts/lib/__tests__/icon-resolver.test.ts package.json package-lock.json
git commit -m "feat(lesson-images): Twemoji icon resolver with rasterization"
```

---

## Task 4: Photo resolver

**Files:**
- Create: `scripts/lib/photo-resolver.ts`
- Test: `scripts/lib/__tests__/photo-resolver.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// scripts/lib/__tests__/photo-resolver.test.ts
import { describe, it, expect, vi } from "vitest";
import { resolvePhoto } from "../photo-resolver";

describe("resolvePhoto", () => {
  it("downloads the top search hit", async () => {
    const search = vi.fn().mockResolvedValue("https://cdn/pic.jpg");
    const download = vi.fn().mockResolvedValue(Buffer.from("JPG"));
    const out = await resolvePhoto("bulletin board", { search, download });
    expect(search).toHaveBeenCalledWith("bulletin board");
    expect(download).toHaveBeenCalledWith("https://cdn/pic.jpg");
    expect(out?.toString()).toBe("JPG");
  });

  it("returns null when search finds nothing", async () => {
    const search = vi.fn().mockResolvedValue(null);
    const download = vi.fn();
    const out = await resolvePhoto("xyzzy", { search, download });
    expect(out).toBeNull();
    expect(download).not.toHaveBeenCalled();
  });

  it("returns null when download fails", async () => {
    const search = vi.fn().mockResolvedValue("https://cdn/pic.jpg");
    const download = vi.fn().mockResolvedValue(null);
    const out = await resolvePhoto("clock", { search, download });
    expect(out).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/lib/__tests__/photo-resolver.test.ts`
Expected: FAIL — `../photo-resolver` does not exist.

- [ ] **Step 3: Implement the resolver**

```ts
// scripts/lib/photo-resolver.ts
// Fallback image source for nouns the icon set lacks. Pixabay is chosen
// because its license requires no per-image attribution — no credits UI.
// Pure + injectable; the real fetchers are built from an API key.

export type PhotoFetchers = {
  /** Returns a downloadable image URL, or null when no result. */
  search: (query: string) => Promise<string | null>;
  /** Returns image bytes, or null on HTTP failure. */
  download: (url: string) => Promise<Buffer | null>;
};

export async function resolvePhoto(
  query: string,
  fetchers: PhotoFetchers,
): Promise<Buffer | null> {
  const url = await fetchers.search(query);
  if (!url) return null;
  return fetchers.download(url);
}

export function makePixabayFetchers(apiKey: string): PhotoFetchers {
  return {
    search: async (query) => {
      const u = new URL("https://pixabay.com/api/");
      u.searchParams.set("key", apiKey);
      u.searchParams.set("q", query);
      u.searchParams.set("image_type", "photo");
      u.searchParams.set("per_page", "3"); // Pixabay minimum is 3
      u.searchParams.set("safesearch", "true");
      const res = await fetch(u);
      if (!res.ok) return null;
      const json = (await res.json()) as { hits?: { webformatURL?: string }[] };
      return json.hits?.[0]?.webformatURL ?? null;
    },
    download: async (url) => {
      const res = await fetch(url);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scripts/lib/__tests__/photo-resolver.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/photo-resolver.ts scripts/lib/__tests__/photo-resolver.test.ts
git commit -m "feat(lesson-images): Pixabay photo fallback resolver"
```

---

## Task 5: Wire the generator to the resolvers

**Files:**
- Modify: `scripts/generate-lesson-images.ts`

This task has no new unit test — the script is a CLI with network/FS side effects and (consistent with the existing pipeline) is verified by a manual dry-run, not Vitest. Each step is a concrete edit.

- [ ] **Step 1: Replace imports and the sidecar type**

At the top of the file, remove `import { computePromptHash, MODEL_ID, IMAGE_DIM } from "./lesson-image-config";` and add:

```ts
import { resolveIcon, makeIconifyFetchers } from "./lib/icon-resolver";
import { resolvePhoto, makePixabayFetchers } from "./lib/photo-resolver";
```

Replace the `SidecarEntry` type:

```ts
type SidecarEntry = {
  url: string;
  source: "icon" | "photo";
  ref: string; // icon name (the query that resolved) or photo query
  generatedAt: string;
};
```

- [ ] **Step 2: Delete the Leonardo functions**

Delete `LEONARDO_BASE`, `MODEL_ID` usages, and the functions `leonardoStartGeneration`, `leonardoPoll`, `leonardoStartNobg`, `leonardoPollNobg`, plus the `NEGATIVE_PROMPT` / `HASH_POSTPROCESS` constants if present. Keep `withRetry`, `uploadToStorage`, `readSidecar`, `confirm`, `parseArgs`, `requireEnv`.

- [ ] **Step 3: Replace the plan/idempotency loop in `main()`**

Replace the `toGenerate`/`skipped` build loop (the `computePromptHash` block) with source-presence idempotency:

```ts
const sidecar = readSidecar(args.unit);
const toGenerate: Candidate[] = [];
const skipped: Candidate[] = [];
const noQuery: Candidate[] = [];
for (const cand of candidates) {
  if (!cand.query) { noQuery.push(cand); continue; }
  if (!args.force && sidecar[cand.id]?.url) skipped.push(cand);
  else toGenerate.push(cand);
}

console.log(`[lesson-images] plan: resolve=${toGenerate.length} skip=${skipped.length} no-query=${noQuery.length}`);
for (const c of toGenerate) console.log(`  + ${c.kind} ${c.id}  "${c.query}"`);
for (const c of skipped) console.log(`  ↷ ${c.kind} ${c.id} (already resolved)`);
for (const c of noQuery) console.log(`  – ${c.kind} ${c.id} SKIPPED (no query)`);

if (args.dryRun) {
  console.log("[lesson-images] DRY RUN — no API calls, no writes. Exiting.");
  return;
}
```

- [ ] **Step 4: Replace the env block and cost notice**

```ts
const env = {
  pixabayKey: requireEnv("PIXABAY_API_KEY"),
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseSecretKey: requireEnv("SUPABASE_SECRET_KEY"),
};
console.log(`[lesson-images] ${toGenerate.length} items to resolve (icons free; Pixabay free tier).`);
```

Keep the existing `confirm()` gate unchanged.

- [ ] **Step 5: Replace the per-candidate generation body**

```ts
const supabase = createClient(env.supabaseUrl, env.supabaseSecretKey);
const iconFetchers = makeIconifyFetchers();
const photoFetchers = makePixabayFetchers(env.pixabayKey);
const failed: { id: string; error: string }[] = [];

for (const cand of toGenerate) {
  try {
    const query = cand.query as string; // toGenerate is filtered to query-bearing
    const iconBytes = await withRetry(() => resolveIcon(query, iconFetchers));
    const bytes = iconBytes ?? (await withRetry(() => resolvePhoto(query, photoFetchers)));
    if (!bytes) {
      failed.push({ id: cand.id, error: `no icon or photo for "${query}"` });
      console.error(`✗ ${cand.kind} ${cand.id}: UNRESOLVED "${query}"`);
      if (args.bail) break;
      continue;
    }
    const source: "icon" | "photo" = iconBytes ? "icon" : "photo";
    const publicUrl = await withRetry(() => uploadToStorage(supabase, args.unit, cand.id, bytes));
    sidecar[cand.id] = { url: publicUrl, source, ref: query, generatedAt: new Date().toISOString() };
    console.log(`✓ ${cand.kind} ${cand.id} [${source}] "${query}"`);
  } catch (e) {
    failed.push({ id: cand.id, error: (e as Error).message });
    console.error(`✗ ${cand.kind} ${cand.id}: ${(e as Error).message}`);
    if (args.bail) break;
  }
}
```

Leave the sidecar write + final summary block (`writeFileSync`, the `generated=… failed=…` line, the `process.exit(1)` on failure) unchanged.

- [ ] **Step 6: Type-check the script and the whole project**

Run: `npm run type-check`
Expected: PASS — no references to deleted Leonardo/config symbols remain.

- [ ] **Step 7: Manual dry-run verification**

Run: `npm run lesson-images -- --unit unit-2 --dry-run`
Expected: prints a plan listing each vocab/match-pair candidate with its `"query"`, skipped already-resolved entries, and `SKIPPED (no query)` lines for dialogue/exercise/unit/section slots. No network calls, no file writes.

- [ ] **Step 8: Commit**

```bash
git add scripts/generate-lesson-images.ts
git commit -m "feat(lesson-images): resolve icons + photos instead of Leonardo"
```

---

## Task 6: Docs + attribution

**Files:**
- Modify: `CLAUDE.md`
- Modify: the footer or `/about` surface (locate via search below)

- [ ] **Step 1: Update CLAUDE.md environment + pipeline docs**

In the **Backend `backend/.env`** block, add:
```
PIXABAY_API_KEY=     # photo fallback for scripts/generate-lesson-images.ts; NEVER read at runtime
```
and change the `LEONARDO_API_KEY` comment to note it is **dormant** (kept for history; the pipeline no longer calls Leonardo).

In the **## Lesson images** section, replace the Leonardo description with: the pipeline now resolves a Twemoji icon per vocab/match-pair word (rasterized to PNG via `@resvg/resvg-js`) and falls back to a Pixabay photo on a miss, uploading to the `lesson-images` bucket. The CLI flags (`--unit`, `--item`, `--force`, `--dry-run`) are unchanged. Point to the new spec/plan dates.

- [ ] **Step 2: Locate the credits surface**

Run: `grep -rniE "footer|about" src/components src/pages src/features --include=*.tsx -l | head`
Pick the footer component (or the About page) that renders site-wide attribution-style text.

- [ ] **Step 3: Add the Twemoji credit line**

Add one line to that component (follow the file's existing i18n/markup pattern — if it uses `t(...)`, add a key; otherwise plain text):
```
Emoji artwork by Twemoji (© Twitter, Inc. and contributors, licensed CC-BY 4.0).
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md src
git commit -m "docs(lesson-images): document icon/photo pipeline + Twemoji attribution"
```

---

## Final verification

- [ ] **Run the full unit suite**

Run: `npm test -- scripts/`
Expected: all candidate / icon-resolver / photo-resolver tests PASS; no reference to the deleted config test.

- [ ] **Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Optional live smoke (requires keys in `backend/.env`)**

Run: `npm run lesson-images -- --unit unit-2 --item u2-v-pencil`
Expected: resolves an icon, uploads, writes the sidecar entry with `source: "icon"`; the image renders on `/lessons/unit-2`.
