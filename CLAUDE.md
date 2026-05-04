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

Frontend API client: `src/lib/api/auth.ts` — `AuthAPI` singleton class with typed request/response interfaces.

### Auth Flow

1. **AppInitializer** (`src/components/AppInitializer.tsx`) restores Supabase session on app start — its `onAuthStateChange` handler is the single trigger for `fetchProfile()` on `SIGNED_IN`
2. **Zustand store** (`src/stores/useUserStore.ts`) holds global user profile/auth state
3. **UserLayout** (`src/routes/UserLayout.tsx`) guards `/u/:username` routes — redirects unauthenticated users
4. Registration goes through FastAPI → backend creates Supabase user + `profiles` + `user_stats` rows
5. Login calls `supabase.auth.signInWithPassword()` directly and navigates on success — profile hydration happens asynchronously via `onAuthStateChange`; `UserMenu` shows a spinner during that window

### State Management

Zustand (`src/stores/useUserStore.ts`) is the single source of truth for user state. It syncs with Supabase auth session.

### Routing

React Router DOM v7. Pages are lazy-loaded with Suspense.

- Public: `/`, `/register`, `/login`, `/about`, `/contact`, `/flashcards`, `/flashcard-test`
- Protected (requires auth): `/u/:username/*`

### Forms

React Hook Form + Zod schemas for all forms. Real-time username availability via `authAPI.checkUsernameAvailability()`.

### i18n

i18next with browser language detection. Supported: English (`en`), Thai (`th`). Locale files at `src/locales/{en,th}/`.

### Styling

Tailwind CSS with dark mode (class-based). Custom colors defined in `tailwind.config.js`:
- Primary blue: `#326de2`
- Accent gold: `#fcd34d`
- Custom 3D transform utilities for flashcard flip animations

### Backend Structure

```
backend/app/
├── api/v1/
│   ├── auth.py        # Auth endpoints: /register, /check-username, /logout, /profile (PATCH)
│   └── progress.py    # Progress endpoints under /me/progress/: complete-section, attempt-exercise, review-flashcard, summary (auth via get_current_user)
├── core/
│   ├── config.py      # Pydantic BaseSettings (reads backend/.env)
│   ├── security.py    # JWT helpers, password hashing, get_current_user dependency
│   └── supabase.py    # Supabase admin client (uses SUPABASE_SECRET_KEY)
├── models/
│   ├── auth.py        # Pydantic auth models (UpdateProfile validates timezone)
│   └── progress.py    # Pydantic progress models (SectionKey Literal, regex-validated unit_slug + exercise_id)
└── services/
    ├── auth_service.py     # Business logic: create user, verify credentials
    └── progress_service.py # Domain functions: complete_lesson_section, submit_exercise_attempt, review_flashcard, get_summary

backend/tests/         # pytest infrastructure; tests are mock-based — real DB verification happens in manual walkthroughs
```

Note: there is no `/auth/login` HTTP endpoint. `login_user()` exists on `AuthService` for future internal use (org membership checks, invite-only flows, admin tooling) but is not exposed as a route.

Note: All progress writes go through transactional Postgres functions (`complete_lesson_section_tx`, `submit_exercise_attempt_tx`, `review_flashcard_tx`) that do projection-table inserts and event-log inserts atomically. The functions are REVOKEd from PUBLIC/anon/authenticated and GRANTed only to `service_role`. Frontend never writes the new tables directly — all writes go through `services/progress_service.py`.

### Database Schema (Supabase)

- `profiles` — id (FK auth.users), first_name, last_name, email, username (unique), native_language, timezone
- `user_stats` — user_id (FK auth.users), xp, level, study_streak, last_login
- `flashcards` — in progress
- `user_activity_log` — single-source-of-truth event stream (lesson_section_completed, exercise_attempted, flashcard_reviewed)
- `lesson_section_progress` — projection: which sections each user has completed (idempotent on user/unit/section)
- `exercise_attempts` — projection: every exercise attempt (correct OR incorrect)
- `flashcard_reviews` — projection: flashcard known/unknown reviews

## Environment Variables

**Frontend** (`.env`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:8000/api/v1

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
LEONARDO_API_KEY=     # Used by scripts/generate-lesson-images.ts via dotenv (not yet read by FastAPI runtime)
```

## Git Workflow

Always work on a feature branch — never commit directly to `main`. Branch naming: `feat/<name>`, `fix/<name>`, `refactor/<name>`. Open a PR targeting `main` when the work is ready.

## Lesson images

Author-time pipeline that fills `src/features/lessons/data/images/<unit>.images.json` with Leonardo-generated illustrations and uploads them to the public Supabase Storage bucket `lesson-images`. Runtime hydrates `imageUrl` onto items via `lookupSection` / `getUnit`; lesson components branch on the field.

```bash
npm run lesson-images -- --unit unit-2 --dry-run    # plan only
npm run lesson-images -- --unit unit-2              # execute (asks for confirmation)
npm run lesson-images -- --unit unit-2 --force      # regenerate everything (ignore prompt-hash)
npm run lesson-images -- --unit unit-2 --item <id>  # regenerate one item
```

The Leonardo API key (`LEONARDO_API_KEY` in `backend/.env`) and Supabase secret key (`SUPABASE_SECRET_KEY`) are read server-side only by the script — never bundled into the client.

Spec: `docs/superpowers/specs/2026-05-02-lesson-image-generation-design.md`.
Plan: `docs/superpowers/plans/2026-05-02-lesson-image-generation.md`.

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
