# Lesson Image Generation Design Spec

## Overview

Add an author-time image generation pipeline for lesson content. Vocab cards, dialogues, exercises, section headers, and unit hero art can each carry an optional Leonardo-generated illustration. Generation runs as a CLI script the author invokes locally; the resulting URLs are committed alongside lesson data and served from Supabase Storage. The Leonardo API key never leaves the server side.

## Goals

- One pipeline that handles all image categories on the lesson surface (vocab, dialogue, exercise, section header, unit hero).
- Author-time generation (idempotent batch script), not runtime — learners only ever load pre-rendered CDN URLs.
- Secrets stay behind the backend boundary: Leonardo API key in `backend/.env`, never in any `VITE_`-prefixed var.
- Templated prompts for high-volume vocab cards; explicit `imagePrompt` for everything else.
- Cheap iteration: editing a prompt regenerates exactly that one image on the next run via prompt-hash diffing.

## Non-Goals

- Runtime / on-demand image generation. Out of scope.
- Per-learner personalization of images. Out of scope.
- Audio generation. Out of scope.
- Test coverage for the script itself in this PR; we'll add integration tests later if maintenance demands it.
- Removing existing `VITE_`-prefixed Supabase secrets (`VITE_SUPABASE_DB_PASSWORD`, `VITE_SUPABASE_PAT`, `VITE_SUPABASE_CONNECTION_STRING`) — flagged for a follow-up cleanup, not part of this work.

## Architecture

Two paths — author-time and runtime — and they don't overlap.

### Author-time

```
npm run lesson-images -- --unit unit-2
       │
       ▼
scripts/generate-lesson-images.ts (Node + tsx)
  ├─ loads backend/.env via dotenv
  │  (LEONARDO_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  ├─ imports the unit's lesson data + sections
  ├─ for each image-eligible item missing or stale:
  │    1. resolve prompt: imagePrompt ?? template(item)
  │    2. compute promptHash = sha256(prompt + model + styleSuffix)
  │    3. POST Leonardo /generations → poll → download PNG
  │    4. upload to Supabase Storage at lesson-images/<unit>/<id>.png
  │    5. record { url, promptHash, model, generatedAt } in sidecar
  └─ persist sidecar JSON in one fsync at end
```

Output: `src/features/lessons/data/images/unit-N.images.json`, committed to git.

### Runtime

```
Lesson data (unit-N.ts + section files)  +  unit-N.images.json
        │
        └─► sectionRegistry.registerSection() hydrates `imageUrl`
              onto each item whose id appears in the sidecar.
        │
        ▼
Components branch on (item.imageUrl ?? null) and render <img> when present.
```

The runtime path makes zero Leonardo calls. The frontend never imports the API key, never holds the service role key.

## Type changes (`src/features/lessons/lesson.types.ts`)

Optional fields, additive — existing data continues to type-check unchanged.

```ts
type VocabItem = {
  // ...existing fields
  imagePrompt?: string;    // hand-authored override
  imageUrl?: string;       // hydrated at runtime from sidecar; never authored
};

// SectionBlock variants for "dialogue" and "exercise" each gain:
//   imagePrompt?: string;
//   imageUrl?: string;

type Section = {
  // ...existing fields
  imagePrompt?: string;
  imageUrl?: string;
};

type Unit = {
  // ...existing fields
  imagePrompt?: string;
  imageUrl?: string;
};
```

`imagePrompt` is hand-authored. `imageUrl` is *never* checked into the `.ts` data files — it's hydrated at runtime from the per-unit sidecar.

## Sidecar JSON

One file per unit: `src/features/lessons/data/images/unit-N.images.json`.

```json
{
  "u2-v-classroom": {
    "url": "https://<project>.supabase.co/storage/v1/object/public/lesson-images/unit-2/u2-v-classroom.png",
    "promptHash": "9f2a…",
    "model": "leonardo-phoenix-1.0",
    "generatedAt": "2026-05-02T05:14:00Z"
  },
  "__unit__": {
    "url": "https://…/lesson-images/unit-2/__unit__.png",
    "promptHash": "…",
    "model": "leonardo-phoenix-1.0",
    "generatedAt": "…"
  }
}
```

Reserved key `__unit__` carries the unit-level hero image; section-level images use `__section__:<sectionKey>` (e.g., `__section__:vocabulary`). Item-level images use the item's existing `id`.

## Templating

Defined in `scripts/lesson-image-config.ts`:

```ts
export const STYLE_SUFFIX = "flat vector illustration, soft pastel palette, simple background, friendly characters, ESL textbook style";
export const MODEL_ID = "leonardo-phoenix-1.0";  // confirmed at implementation time against Leonardo's current model lineup
export const IMAGE_DIM = { width: 1024, height: 1024 };
```

- **Vocab items only** auto-template: `${vocab.word}, ${STYLE_SUFFIX}`.
- **Dialogue, exercise, section, unit** require an explicit `imagePrompt`. Items missing both `imagePrompt` and a templating rule are skipped silently.

The style suffix and model id are inputs to the prompt hash, so changing either invalidates every existing image in the next run.

## CLI surface (the script)

```
npm run lesson-images -- --unit unit-2                        # default: generate missing/stale
npm run lesson-images -- --unit unit-2 --item u2-v-classroom  # single item
npm run lesson-images -- --unit unit-2 --force                # ignore sidecar hashes
npm run lesson-images -- --unit unit-2 --dry-run              # plan only; no API calls, no writes
npm run lesson-images -- --unit unit-2 --yes                  # skip cost-confirmation prompt
npm run lesson-images -- --unit unit-2 --bail                 # stop on first error
```

Per-item flow:

1. Resolve prompt. Skip if neither `imagePrompt` nor a template rule applies.
2. Compute `promptHash = sha256(resolvedPrompt + MODEL_ID + STYLE_SUFFIX)`.
3. Look up sidecar entry. If `entry.promptHash === promptHash` and `--force` is not set → skip.
4. `POST /api/rest/v1/generations` to Leonardo → poll `GET /api/rest/v1/generations/{id}` every 2 s until status is `COMPLETE` (timeout 60 s).
5. Download the PNG from the returned (expiring) Leonardo CDN URL.
6. Upload via `supabase-js` (with service role key) to `lesson-images/<unit>/<id>.png`. Public read; `content-type: image/png`.
7. Record `{ url, promptHash, model, generatedAt }` in the in-memory sidecar.

After the loop, persist the sidecar JSON in one write.

### Error handling

- Leonardo and Supabase calls retry 3× with exponential backoff (1 s, 2 s, 4 s).
- Per-item failures are logged and the run continues. End-of-run report: `N generated, M skipped, K failed`. Exit code is non-zero if any failed unless `--allow-fail` is passed.
- `--bail` stops on the first error if you want strict mode while iterating on prompts.

### Cost guardrail

Before any API calls: print a one-line summary `"<N> images to generate (estimated $X.XX at $0.04/image)"` and prompt `Continue? [y/N]` unless `--yes` or `--dry-run` is set.

## Backend config

Add `leonardo_api_key: str` to `backend/app/core/config.py`'s `Settings` class. The script imports nothing from the backend — it reads `backend/.env` directly via `dotenv` — but adding the field documents the secret's home for future runtime use.

`backend/.env` is created (was missing) with the keys it needs:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
LEONARDO_API_KEY=...
SECRET_KEY=...                       # existing FastAPI auth secret
ALLOWED_ORIGINS=["http://localhost:5173"]
ENVIRONMENT=development
```

The frontend `.env` entry `VITE_LEONARDO_API_KEY` is removed in this PR.

## Supabase Storage bucket

New migration `supabase/migrations/20260502000001_lesson_images_bucket.sql`:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-images', 'lesson-images', true);

CREATE POLICY "lesson_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'lesson-images');
-- No insert/update/delete policies. Only the service role (script) writes.
```

`public: true` plus the read policy means rendered URLs work without auth. The script bypasses RLS via the service role key.

## Loader hydration

A single index file imports each unit's sidecar:

```ts
// src/features/lessons/data/images/index.ts
import unit2 from "./unit-2.images.json";
// add more imports as units come online

export const unitImagesSidecars: Record<string, Record<string, { url: string }>> = {
  "unit-2": unit2,
};
```

`registerSection(section)` in `sectionRegistry.ts` is modified to walk the section once at registration time:

- Look up `unitImagesSidecars[section.unitSlug] ?? {}`.
- For every block / item (vocab list items, dialogue blocks, exercise blocks) whose `id` appears in the sidecar, write `imageUrl` onto that item.
- Look up `__section__:${section.key}` for the section header URL.

`getUnit()` is modified similarly to look up `__unit__` for the hero image.

This is one synchronous walk per section per app load — negligible cost. Items without sidecar entries simply have `imageUrl === undefined`.

## Component changes

Each affected component gets a small conditional. No structural changes.

| Component | Change |
|---|---|
| `VocabListBlock` | Render `<img src={item.imageUrl} alt={item.word} className="w-16 h-16 rounded" />` next to the word when `item.imageUrl` is present. |
| `DialogueBlock` | Render a banner `<img>` above the dialogue lines when `block.imageUrl` is present. |
| `ExerciseBlock` | Render an `<img>` above the exercise prompt when `block.imageUrl` is present. |
| `SectionPage` | Render a banner image at the top when `section.imageUrl` is present. |
| `UnitHub` | Render a hero image at the top when `unit.imageUrl` is present. |

Alt text comes from existing fields (`item.word`, `unit.title`, etc.). No new authoring required.

## Testing

In this PR:

- Hydration helper unit test: given a section + a sidecar, items get `imageUrl` set; items not in the sidecar stay `undefined`; `__section__:<key>` populates `section.imageUrl`.
- Component tests, one per affected component: when `imageUrl` is set, an `<img>` renders with the correct `src`; when it isn't, no image element renders.

Out of scope:

- Script integration tests. The script is a CLI hitting two external services; mock fixtures would be expensive to maintain. Defer until the script becomes a maintenance burden.

## Open decisions

These will be settled at implementation time, not in this spec:

- The exact Leonardo model id (`MODEL_ID` above). Phoenix 1.0 is the current default proposal; we'll confirm against Leonardo's live lineup when wiring the API call. Whatever we pick is the input to the prompt hash.
- Image dimensions. Default proposal: 1024×1024 for everything, scaled by CSS. Could tune later (e.g., 16:9 for dialogue scene banners) if visuals warrant it.
