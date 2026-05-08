# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gain English** is a full-stack English learning platform with:
- **Frontend:** React 19 + TypeScript + Vite SPA at `/src/`
- **Backend:** FastAPI + Python at `/backend/`
- **Database/Auth:** Supabase (PostgreSQL + Auth)

The backend was added to secure the Supabase service role key — it must never be exposed to the frontend.

## Development Commands

### Frontend
```bash
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
npm run type-check   # TypeScript type checking only
npm test             # Run Vitest tests
npm run test:watch   # Tests in watch mode
npm run format       # Prettier format
```

### Backend
```bash
cd backend
source venv/bin/activate
python run.py        # Dev server on localhost:8000 (with --reload)
# Docs: http://localhost:8000/docs
```

### Running a single test
```bash
npm test -- path/to/test.spec.ts   # Frontend: single file
```

## Architecture

### Frontend → Backend → Supabase Flow

- **Frontend** uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (safe, limited permissions)
- **Backend** uses `SUPABASE_SECRET_KEY` (the new `sb_secret_…` format from Project Settings → API; never exposed to frontend)
- All privileged operations (user creation, profile writes) go through the FastAPI backend

API base: `VITE_API_BASE_URL` (defaults to `http://localhost:8000/api/v1`)

Frontend API clients live under `src/lib/api/`:
- `auth.ts` — exports `authAPI` (an instance of class `AuthAPI`) with typed request/response interfaces; private `makeRequest` sets `Content-Type: application/json` and lets callers pass `Authorization` explicitly per call
- `progress.ts` — exports `ProgressAPI` (instance of `ProgressAPIClass`) for the authenticated `/me/progress/*` endpoints (`completeSection`, `attemptExercise`, `reviewFlashcard`, `getSummary`); private `authedFetch` helper resolves the Supabase session, returns `null` when none exists, throws on non-2xx, and forces `Authorization: Bearer <jwt>` + `Content-Type: application/json` over caller-supplied headers. Write methods catch and log errors and return `null` so callers can degrade gracefully; `getSummary` deliberately propagates errors so its hook can render an error state.

Add new clients alongside these following the same pattern: one module per `<feature>API`, a private `authedFetch`-style helper that injects the bearer token, and try/catch wrappers on write methods that log + return `null`.

### Auth Flow

1. **AppInitializer** (`src/components/AppInitializer.tsx`) restores the Supabase session on app start. It calls `supabase.auth.getSession()` once for initial hydration and subscribes to `onAuthStateChange`; the subscriber explicitly skips `INITIAL_SESSION` (to avoid double-firing with `getSession()`). On both code paths, if a session exists it calls `fetchProfile()` and then `captureTimezoneIfMissing()`; if not, it calls `clearProfile()`. This means profile re-hydration also runs on token refresh and other non-INITIAL auth events — not only on `SIGNED_IN`.
2. **Zustand store** (`src/stores/useUserStore.ts`) holds global user profile/auth state
3. **`RequireAuth`** (`src/features/auth/RequireAuth.tsx`) wraps the authenticated route block in `App.tsx`; `RequireGuest` mirrors it for `/login` and `/register`. There is no separate `UserLayout` — auth is enforced at the route element via `<RequireAuth><AuthLayout /></RequireAuth>`.
4. Registration goes through FastAPI → backend creates Supabase user + `profiles` + `user_stats` rows
5. Login calls `supabase.auth.signInWithPassword()` directly and navigates on success — profile hydration happens asynchronously via the `AppInitializer` auth-state subscriber; `UserMenu` shows a spinner during that window

### State Management

Zustand (`src/stores/useUserStore.ts`) is the single source of truth for user state. It syncs with Supabase auth session.

### Routing

React Router DOM v7. Pages are lazy-loaded with `Suspense`. Three layout buckets, defined in `src/App.tsx`:

- **`PublicLayout`** (Header + Footer): `/`, `/about`, `/contact`, `/login`, `/register`, `/u/:username` (public profile stub)
- **`FlashcardsLayout`** (auth-aware): `/flashcards` — picks `AuthLayout` when `useUserStore.profile` is non-null, `PublicLayout` otherwise. Anonymous users still get the preview path; logged-in users keep the sidebar
- **`AuthLayout` + `RequireAuth`** (sidebar + slim header): `/home`, `/dashboard`, `/lessons`, `/lessons/:unitSlug`, `/lessons/:unitSlug/:sectionKey`, `/practice` (hub), `/conversations`, `/conversations/:slug`, `/u/:username/conversations`, `/u/:username/conversations/scenarios`, `/u/:username/conversations/:sessionId`, `/review`, `/skills`, `/skills/:skillKey`, `/library`, `/study-groups`, `/notifications`, `/settings`, `/drag-drop`, `/ad-libs`, `/assessment/:level`, `/assessment/:level/results`, `/u/:username/assessment/:level`, `/u/:username/assessment/:level/results`, `/admin/orgs/:slug`, `/admin/orgs/:slug/billing`, `/admin/ai-usage`, plus `/teacher/*` (gated by an additional `RequireTeacher` wrapper inside `AuthLayout`): `/teacher`, `/teacher/classes`, `/teacher/classes/:classId`, `/teacher/students`, `/teacher/students/:studentId`
- **No layout wrapper**: `/auth/callback` (OAuth completion handler — top-level sibling route)

### Forms

React Hook Form + Zod schemas for all forms. Real-time username availability via `authAPI.checkUsernameAvailability()`.

### i18n

`react-i18next` with browser language detection. Supported locales: `en`, `vi`, `th`, `zh-CN`. Locale files at `src/locales/<lang>/<lang>.json`. `fallbackLng: 'en'` — any missing key falls back to English. Locale-keyed content (e.g. flashcard set titles, dashboard progress copy) lives under nested objects like `flashcards.sets.<slug>.title` and `dashboard.yourProgress.*`. When using `t(key, { defaultValue })` the default is returned if the key is missing in every locale (the `useSetCopy` hook is the canonical example — `src/features/flashcards/hooks/useSetCopy.ts`).

### Styling

Tailwind CSS with dark mode (class-based). Custom colors defined in `tailwind.config.js`:
- Primary blue: `#326de2`
- Accent gold: `#fcd34d`
- Custom 3D transform utilities for flashcard flip animations

### Backend Structure

```
backend/app/
├── api/v1/
│   ├── auth.py            # /register, /check-username, /logout, /profile (PATCH)
│   ├── progress.py        # /me/progress/{complete-section,attempt-exercise,review-flashcard,summary}
│   ├── ai_tutor.py        # /me/ai-tutor/{explain,correct,practice,writing-coach}
│   ├── conversations.py   # /me/conversations/{scenarios,turn,end} — AI roleplay sessions
│   ├── review.py          # /me/review/{due,count,{id}/rate} — SM-2 spaced repetition queue
│   ├── skills.py          # /me/skills/summary — 11-skill EWMA scores
│   ├── lessons.py         # lesson-data endpoints
│   └── admin.py           # /admin/* — gated by super_admin_user_ids env list
├── core/
│   ├── config.py          # Pydantic BaseSettings (reads backend/.env)
│   ├── security.py        # JWT helpers, password hashing, get_current_user dependency
│   └── supabase.py        # Supabase admin client (uses SUPABASE_SECRET_KEY)
├── models/
│   ├── auth.py            # Pydantic auth models (UpdateProfile validates timezone)
│   ├── progress.py        # Pydantic progress models (SectionKey Literal, regex-validated unit_slug + exercise_id)
│   ├── ai_tutor.py        # ExplainResponse, CorrectionResponse, PracticeItem/Response, WritingCoach* shapes
│   └── skills.py          # ALL_SKILL_KEYS, SkillSummary, scoring shapes
└── services/
    ├── auth_service.py        # create user, verify credentials
    ├── progress_service.py    # complete_lesson_section, submit_exercise_attempt, review_flashcard, get_summary
    ├── ai_tutor_service.py    # Anthropic SDK wrapper; raises AiDisabledException when no key
    ├── skill_scoring_service.py  # EWMA per-skill score updates
    └── sm2_service.py         # SM-2 spaced repetition algorithm

backend/tests/             # pytest infrastructure; tests are mock-based — real DB verification happens in manual walkthroughs
```

**Top-level routes:**
- `GET /health` — lightweight liveness probe (no I/O), used by Railway healthcheck
- `GET /api/v1/health` — application-level readiness. Checks DB connectivity (one `profiles` SELECT) and reports `ai_tutor_enabled` from settings (i.e. *configured*, not an outbound Anthropic call) and `ai_voice_enabled`.
- `GET /` — version banner

Note: there is no `/auth/login` HTTP endpoint. `login_user()` exists on `AuthService` for future internal use (org membership checks, invite-only flows, admin tooling) but is not exposed as a route.

Note: All progress writes go through transactional Postgres functions (`complete_lesson_section_tx`, `submit_exercise_attempt_tx`, `review_flashcard_tx`) that do projection-table inserts and event-log inserts atomically. The functions are REVOKEd from PUBLIC/anon/authenticated and GRANTed only to `service_role`. Frontend never writes the new tables directly — all writes go through `services/progress_service.py`.

### Database Schema (Supabase)

- `profiles` — id (FK auth.users), first_name, last_name, email, username (unique), native_language, timezone
- `user_stats` — user_id (FK auth.users), xp, level, study_streak, last_login
- `flashcards` — vocabulary cards, joined to per-language `flashcard_translations` for native-text rendering
- `flashcard_sets` — curated sets (17 seeded, `created_by IS NULL`) plus user-created sets; each curated set has a stable `slug` keyed into the locale files
- `flashcard_translations` — per-card translations for `th`, `vi`, `zh`
- `languages` — reference table for `language_code` (th/vi/zh)
- `user_activity_log` — single-source-of-truth event stream (lesson_section_completed, exercise_attempted, flashcard_reviewed)
- `lesson_section_progress` — projection: which sections each user has completed (idempotent on user/unit/section)
- `exercise_attempts` — projection: every exercise attempt (correct OR incorrect)
- `flashcard_reviews` — projection: flashcard known/unknown reviews
- `review_items` — SM-2 spaced repetition queue. Per-user, per-item rows with `ease_factor`, `interval_days`, `streak_correct`, `next_review_at`, etc. Backed by `/me/review/*` endpoints. RLS limits SELECT to the owner; writes go through `service_role` from the backend.

## Environment Variables

**Frontend** (`.env`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_AI_CONVERSATION_ENABLED=  # set to "true" to expose the AI Conversation card on /practice; falls back to "Coming soon"

# Playwright e2e (loaded by playwright.config.ts via vite's loadEnv)
E2E_TESTER_EMAIL=
E2E_TESTER_PASSWORD=
```

**Backend** (`backend/.env`):
```
SUPABASE_URL=
SUPABASE_SECRET_KEY=
SECRET_KEY=
ALLOWED_ORIGINS=["http://localhost:5173"]
ENVIRONMENT=development
ANTHROPIC_API_KEY=    # required for /me/ai-tutor/* and /me/conversations/turn; absent → 503 ai_disabled
LEONARDO_API_KEY=     # used by scripts/generate-lesson-images.ts via dotenv (not yet read by FastAPI runtime)
```

In production these are set on the host platform (Vercel for frontend, Railway for backend), not in `.env` files. See `## Production deployment` below.

## Git Workflow

Always work on a feature branch — never commit directly to `main`. Branch naming: `feat/<name>`, `fix/<name>`, `refactor/<name>`. Open a PR targeting `main` when the work is ready.

## Production deployment

**Frontend → Vercel.** Built from `main` on every push; previews on every PR branch. Env vars live in the Vercel dashboard (NOT in `.env` files in the repo) — Vite bakes `VITE_*` env vars in at build time, so changing one requires a redeploy with cache disabled.

**Backend → Railway.** Built via Nixpacks from `backend/` (Root Directory set to `backend` in service settings). `backend/railway.toml` defines the start command (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`), the `/health` healthcheck path, and a restart-on-failure policy (3 retries). `/health` is intentionally lightweight (no DB I/O) — `/api/v1/health` is the application-level readiness probe.

Production frontend talks to production backend via `VITE_API_BASE_URL` (set in Vercel) → `https://<railway-domain>/api/v1`. Vercel preview branches (which get a fresh subdomain per branch) are allowed via `ALLOWED_ORIGIN_REGEX` on Railway, applied alongside the exact-match `ALLOWED_ORIGINS` list. Set it to `^https://tiger-english-[a-z0-9-]+\.vercel\.app$` (or whatever pattern matches the project's preview URLs) so authed calls from preview deploys don't get blocked by CORS.

## /practice and the three-mode product structure

The app is organized around **Lessons / Practice / Review**:

- **Lessons** (`/lessons`) — short, completable, beginner-safe. **Deterministic** — no AI in the completion path. The `output-task` and `ai-mission` `SectionBlock` variants were removed in PR #137; AI/open-ended blocks are not allowed in lesson section data.
- **Practice** (`/practice`) — applies what's been learned. Currently surfaces an AI Conversation card (links to `/conversations` when `VITE_AI_CONVERSATION_ENABLED === "true"`, otherwise renders as "Coming soon") and a Guided Writing card (always "Coming soon" for now).
- **Review** (`/review`) — spaced repetition; backed by `review_items` and the `/me/review/*` endpoints.

## Lesson images

Author-time pipeline that fills `src/features/lessons/data/images/<unit>.images.json` with Leonardo-generated illustrations and uploads them to the public Supabase Storage bucket `lesson-images`. Runtime hydrates `imageUrl` onto items via `lookupSection` / `getUnit`; lesson components branch on the field.

```bash
npm run lesson-images -- --unit unit-2 --dry-run    # plan only
npm run lesson-images -- --unit unit-2              # execute (asks for confirmation)
npm run lesson-images -- --unit unit-2 --force      # regenerate everything (ignore prompt-hash)
npm run lesson-images -- --unit unit-2 --item <id>  # regenerate one item
```

The Leonardo API key (`LEONARDO_API_KEY` in `backend/.env`) and Supabase secret key (`SUPABASE_SECRET_KEY`) are read server-side only by the script — never bundled into the client.

`buildCandidates` enumerates: unit-level, section-level, vocab-list items, dialogue blocks, and exercise blocks. **Match exercises (`MatchExercise.pairs[]`) are not yet enumerated** — per-pair Leonardo generation is a queued follow-up. Until then, match exercises render with `fallback` emoji glyphs from the pair data.

Image URLs are served via Supabase Storage's `/storage/v1/render/image/public/` transform endpoint. The `srcSetFor()` helper in `src/lib/storageImage.ts` rewrites `/object/public/` URLs to the render endpoint and emits a `srcSet` with 1× and 2× density variants. Used by VocabListBlock, ExerciseBlock, DialogueBlock, and MatchPairs. External (non-Supabase) URLs pass through unchanged via a path-based check, so callers can apply it blindly.

**Image alt-text convention** on the dialogue and exercise variants of `SectionBlock`:
- omit / empty `imageAlt` → `alt=""` (decorative; screen readers skip)
- non-empty `imageAlt` → `alt="<text>"` (informative; described to screen readers)
Image-prompt exercises ("choose what's in the picture") MUST set `imageAlt` so the question stays answerable for SR users.

Spec: `docs/superpowers/specs/2026-05-02-lesson-image-generation-design.md`.
Plan: `docs/superpowers/plans/2026-05-02-lesson-image-generation.md`.

## Exercises

Three exercise types live under `src/components/exercises/`:
- **`MultipleChoice`** — single-correct option select. Data: `McqExercise`.
- **`FillBlank`** — text input with `correctAnswer` + optional `acceptableAnswers`. Data: `FillBlankExercise`.
- **`MatchPairs`** — mobile-first tap-to-pair word↔image matching. Two columns (words left, images right). Tile sizes ≥56/88 px clear WCAG 2.5.5. Data: `MatchExercise` with `pairs: MatchPair[]`. Each pair carries `imagePrompt` for pipeline generation, `imageAlt` for accessibility, and a `fallback` glyph rendered when no `imageUrl` is set yet.

`ExerciseBlock` (in `src/features/lessons/components/blocks/`) dispatches by `exerciseType` against an `exerciseMap` of pre-imported data. Add a new exercise: define the data in `src/features/lessons/data/exercises/unit-N.ts`, add it to the map in `ExerciseBlock`, and reference it from a section block with `type: "exercise"`, `exerciseType`, and `exerciseId`.

## Flashcard sets

The 17 curated sets are seeded by `supabase/migrations/20260322000001_seed_csv_sets.sql` and given stable slugs in `20260504000003_flashcard_set_slugs.sql`. Set titles and descriptions are translated via `src/locales/<lang>/<lang>.json` keyed by slug — see `flashcards.sets.<slug>.{title,description}`.

Adding a new curated set is a three-place change:

1. Add the seed `INSERT INTO flashcard_sets (...)` (and the cards) in a new migration.
2. In the same or next migration, `UPDATE flashcard_sets SET slug = '<new_slug>' WHERE id = '<uuid>'`.
3. Add `flashcards.sets.<new_slug>.{title,description}` to all four locale files (`en`, `vi`, `th`, `zh-CN`).

`useSetCopy` (`src/features/flashcards/hooks/useSetCopy.ts`) falls back to the DB raw column when a locale key is missing, so a new slug without locale entries renders the seed-migration's English text rather than the key path — but step 3 is still required for translation to actually happen.

User-created sets keep `slug = NULL` and render the user-typed title; the helper short-circuits without touching i18n.

## Path Aliases

`@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.json`).
