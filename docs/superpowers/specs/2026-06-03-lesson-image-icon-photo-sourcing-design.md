# Lesson Image Sourcing: Icons + Photo Fallback (replacing Leonardo)

**Date:** 2026-06-03
**Status:** Design — pending implementation
**Supersedes the image *source*** of `docs/superpowers/specs/2026-05-02-lesson-image-generation-design.md` (candidate enumeration, sidecar, upload, and runtime hydration from that spec are retained).

## Problem

The lesson-image pipeline generates illustrations with Leonardo (Flux Schnell). For the
content we actually have — almost entirely concrete A1–A2 classroom nouns (pencil, chair,
wall clock, ruler, bookshelf, world map) — generative art is the wrong tool. Prompts have
to fight the model's weaknesses (e.g. the ruler prompt carries "no digits, no numerals, no
characters, no letters" because Flux hallucinates numbers), output is stylistically
inconsistent, and per-image quality is a lottery. The pipeline has never been run in
production; every `*.images.json` sidecar is `{}` (or stale test data in `unit-2`).

## Goal

Replace the **image source** with a deterministic, human-drawn source that is reliable for
concrete nouns, while keeping the rest of the pipeline (candidate enumeration, sidecar
format, Supabase upload, runtime hydration, `srcSetFor`) intact.

## Decisions (locked)

- **Source:** curated **icons** with a **stock-photo fallback** for nouns the icon set
  lacks.
- **Resolution:** **fully automatic** — no per-image review gate. The dry-run *prints*
  every match for visibility, but never blocks a run.
- **Icon style:** a single **colorful emoji-illustration set** (Twemoji, CC-BY 4.0).
  Pinning one set gives automatic style consistency; colorful glyphs are easier to tell
  apart in a match grid and friendlier for A1–A2 beginners than monochrome line icons.
  Coverage of everyday/classroom nouns is excellent. Requires a one-line credit (see
  Attribution).
- **Photo fallback:** **Pixabay** — its license requires **no per-image attribution**, so
  no credits UI is needed. (Openverse is the alternative if Pixabay coverage disappoints;
  same attribution-free posture for the Pixabay-sourced subset.)
- **Hosting:** **self-host** into the existing `lesson-images` Supabase bucket. No new
  runtime dependency on third-party CDNs; URLs can't rot; reuses existing upload code.

## Why the runtime needs no changes

`src/lib/storageImage.ts` (`resizedStorageUrl`/`srcSetFor`) only rewrites Supabase
*object* URLs and **passes every other URL through unchanged**. Components consume a plain
`imageUrl` string hydrated from the sidecar `url` field. Because we self-host into the same
bucket, the resulting URLs are ordinary `lesson-images` object URLs — identical in shape to
today's Leonardo PNGs. **No frontend change is required.**

Note on SVG vs raster: Twemoji icons are SVG. We **rasterize each icon to a 512×512 PNG on a
transparent background** at build time (via `@resvg/resvg-js`) before upload, so:
- the bucket stays raster-only (consistent with `srcSetFor`'s render-transform assumption,
  should `VITE_SUPABASE_IMAGE_TRANSFORMS` ever be enabled — the render endpoint does not
  transform SVG);
- alt-text / sizing behavior in existing components is unchanged.
Photos are downloaded and uploaded as-is (JPEG).

## Components

### 1. Candidate enumeration — add a clean `query` term
`scripts/lib/lesson-image-candidates.ts`

Today each `Candidate` carries a verbose `prompt` ("a tall wooden bookshelf with multiple
shelves…") suited to Leonardo but useless as an icon/photo search term. Add a `query: string`
field holding the bare noun:
- **vocab** → `item.word`
- **match-pair** → the pair's word/label (the left-column term)
- **dialogue / exercise / unit / section** → no clean single noun; `query` is `undefined`.
  These candidates have no icon/photo equivalent and are handled by §6.

`prompt` is retained (harmless; unused by the new source). `kind` is unchanged.

### 2. Icon resolver
New: `scripts/lib/icon-resolver.ts`

```
resolveIcon(query: string): Promise<Buffer | null>
```
- Normalize `query` (lowercase, singularize trivially, strip articles).
- Look up the term in the pinned set via the Iconify API
  (`https://api.iconify.design/twemoji.json?icons=<name>` / `/twemoji/<name>.svg`), trying
  the normalized term and a small alias map for known mismatches
  (e.g. `world map → world-map`, `bin → wastebasket`).
- On hit: fetch SVG bytes → rasterize to 512×512 transparent PNG via `@resvg/resvg-js` →
  return Buffer.
- On miss: return `null`.

Pure and unit-testable: inject the fetch + rasterize functions so tests can stub them.

### 3. Photo resolver
New: `scripts/lib/photo-resolver.ts`

```
resolvePhoto(query: string): Promise<Buffer | null>
```
- Query Pixabay (`GET https://pixabay.com/api/?key=<PIXABAY_API_KEY>&q=<query>&image_type=
  photo&per_page=3&safesearch=true`).
- Pick the top hit, download `webformatURL`, return JPEG bytes. `null` on no result / error.
- Reads `PIXABAY_API_KEY` from `backend/.env` (script-side only, never runtime).

### 4. Sidecar format — record provenance
`SidecarEntry` changes from
`{ url, promptHash, model, generatedAt }` to:

```ts
type SidecarEntry = {
  url: string;
  source: "icon" | "photo";
  ref: string;        // icon name (e.g. "twemoji:books") or photo query
  generatedAt: string;
};
```
- Drops `promptHash`/`model` (no prompt anymore). Idempotency key becomes **`source` +
  presence of `url`**: a re-run skips any candidate that already has a resolved entry unless
  `--force`. `--force` re-resolves and re-uploads.
- `unit-2.images.json` (stale Leonardo data) is regenerated on first `--force` run.

### 5. Generator wiring
`scripts/generate-lesson-images.ts`

Replace the Leonardo call chain (`leonardoStartGeneration` → `leonardoPoll` →
`leonardoStartNobg` → `leonardoPollNobg`) with, per candidate that has a `query`:

```
const bytes = (await resolveIcon(cand.query)) ?? (await resolvePhoto(cand.query));
if (!bytes) { record as unresolved; continue; }
const url = await uploadToStorage(supabase, unit, cand.id, bytes);  // unchanged
sidecar[cand.id] = { url, source, ref, generatedAt };
```

Retained unchanged: arg parsing (`--unit`, `--item`, `--force`, `--dry-run`, `--yes`),
`uploadToStorage`, sidecar read/write, the confirmation prompt, `withRetry`.

Dry-run output prints one line per candidate: `<id>  <query>  → <source>:<ref>` (or
`→ UNRESOLVED`) so the author can scan all matches and spot-fix outliers (via an alias-map
entry or by switching that item to a photo) — **without** a blocking review step.

`leonardo*` functions and `LEONARDO_API_KEY` plumbing are **removed from the call path** but
the env var documentation stays (marked dormant). `lesson-image-config.ts` style suffixes /
`computePromptHash` / `MODEL_ID` become unused and are deleted.

### 6. Items with no icon/photo equivalent
Dialogue and exercise scene blocks (verbose multi-subject prompts, no clean noun) get no
`query` and are **skipped** — left unset at runtime, where components already fall back to
their emoji glyph or render no image. The dry-run lists them as `SKIPPED (no query)` so the
author knows they were intentionally excluded (no silent truncation).

## Attribution

Twemoji is CC-BY 4.0 → add a single credit line to the existing about/credits surface
(e.g. footer or `/about`): "Emoji artwork by Twemoji (© Twitter, Inc. and contributors,
CC-BY 4.0)." Pixabay requires none. No per-image UI.

## Environment

Add to `backend/.env` (script-side only, documented in CLAUDE.md):
```
PIXABAY_API_KEY=     # used by scripts/generate-lesson-images.ts photo fallback; never read at runtime
```
`LEONARDO_API_KEY` stays documented but dormant.

## Dependencies

- **`@resvg/resvg-js`** (new dev dependency) — SVG→PNG rasterization for icons. Ships
  prebuilt platform binaries (no system libs / no native build step — safe on WSL), unlike
  `sharp`'s librsvg-dependent SVG path.
- No other new runtime or build deps. `tsx` already runs the script.

## Testing

- `icon-resolver` unit tests: hit, miss, alias-map redirect, rasterize call (stubbed fetch +
  sharp).
- `photo-resolver` unit tests: hit, no-result, API error (stubbed fetch).
- Generator: dry-run plan over a fixture unit asserts the printed plan and that no upload /
  network write occurs. (Consistent with existing pipeline tests being mock-based.)
- Manual: run `npm run lesson-images -- --unit unit-2 --dry-run`, eyeball the match plan,
  then execute and verify rendered images on `/lessons/unit-2`.

## Out of scope

- No runtime/frontend changes.
- No pronunciation, no AI generation, no Vietnamese-specific imagery.
- No author review gate (explicitly declined — fully automatic).
- Backfilling all units in one run — author runs per unit as before.

## Rollout

1. Land resolver modules + generator swap + tests behind no flag (author-time only).
2. Run `--unit unit-1 … unit-N` to populate sidecars; commit the generated JSON.
3. Add the Twemoji credit line.
