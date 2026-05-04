# Docs cleanup: README Tech Stack + CLAUDE.md Phase 1 surface — design

**Status:** approved (spec under review)
**Author:** afk-bro
**Last updated:** 2026-05-04

## Problem

Two reference docs got stale during Phase 1 (PR #107) and weren't updated as part of that PR's scope:

- **`README.md` Tech Stack (line 20)** still says `**Backend:** Supabase (Auth + Database)`. The FastAPI backend has been load-bearing since the service-role key was moved server-side; the README is misleading for new contributors who'd otherwise expect a Supabase-only stack.
- **`CLAUDE.md` Backend Structure (lines 86-99)** lists only the auth files (`api/v1/auth.py`, `models/auth.py`, `services/auth_service.py`). Phase 1 added `api/v1/progress.py`, `models/progress.py`, `services/progress_service.py`, plus a new `tests/` directory. None of that's documented.
- **`CLAUDE.md` Database Schema bullet list (lines 101-105)** lists `profiles`, `user_stats`, and `flashcards`. Phase 1 added 4 tables (`user_activity_log`, `lesson_section_progress`, `exercise_attempts`, `flashcard_reviews`) and a `profiles.timezone` column. The earlier translations PR added `profiles.native_language`. None of those reflect in the doc.

## Goals

1. README's Tech Stack accurately names FastAPI as part of the backend.
2. CLAUDE.md's Backend Structure tree shows the files Phase 1 added, plus a brief note explaining the transactional-Postgres-function pattern and grant-locked permissions used for progress writes.
3. CLAUDE.md's Database Schema bullets list every Phase 1 table plus the new columns on `profiles` (both `native_language` and `timezone`).
4. No code changes. Pure documentation update.

## Non-goals

- Auditing whether `user_stats` is still in use (its fields look like remnants of the pre-Phase-1 XP system, but verifying that requires code grep + DB inspection, out of scope here).
- Updating README's Features section staleness (XP bullet, language list claiming "English and Thai" only). That's marketing copy and deserves its own pass.
- Updating other CLAUDE.md sections (Auth Flow, State Management, Routing, etc.) unless they directly reference structures we're touching.
- Updating `flashcards — in progress` to reflect current state. Adjacent staleness, but doesn't block what we're fixing.
- Documenting the per-set `slug` column on `flashcard_sets` from PR #110 (also adjacent; could be added later).

## Approach

Three localized edits across two files. No restructuring of the docs.

### `README.md` — single line

```diff
- - **Backend:** Supabase (Auth + Database)
+ - **Backend:** FastAPI + Supabase (PostgreSQL + Auth)
```

### `CLAUDE.md` — Backend Structure tree

Replace the existing tree with the expanded version:

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

Add a parallel "Note" paragraph immediately after the existing one about `/auth/login`:

> Note: All progress writes go through transactional Postgres functions (`complete_lesson_section_tx`, `submit_exercise_attempt_tx`, `review_flashcard_tx`) that do projection-table inserts and event-log inserts atomically. The functions are REVOKEd from PUBLIC/anon/authenticated and GRANTed only to `service_role`. Frontend never writes the new tables directly — all writes go through `services/progress_service.py`.

### `CLAUDE.md` — Database Schema bullet list

Update the `profiles` line to include both new columns, and append the Phase 1 tables. Existing `user_stats` and `flashcards` lines stay verbatim:

```
- `profiles` — id (FK auth.users), first_name, last_name, email, username (unique), native_language, timezone
- `user_stats` — user_id (FK auth.users), xp, level, study_streak, last_login
- `flashcards` — in progress
- `user_activity_log` — single-source-of-truth event stream (lesson_section_completed, exercise_attempted, flashcard_reviewed)
- `lesson_section_progress` — projection: which sections each user has completed (idempotent on user/unit/section)
- `exercise_attempts` — projection: every exercise attempt (correct OR incorrect)
- `flashcard_reviews` — projection: flashcard known/unknown reviews
```

The `flashcards — in progress` line is stale (cards do have translations and curated sets exist) but updating it expands scope beyond Phase 1. Defer to a separate doc-cleanup pass.

## Components touched

| File | Change |
|---|---|
| `README.md` | One-line update to Tech Stack `**Backend:**` bullet |
| `CLAUDE.md` | Backend Structure tree expansion + new Note paragraph + Database Schema bullet additions |

No code, no tests, no migrations, no locale files. Pure documentation.

## Testing

Documentation-only PR. Verification:

- `git diff main...HEAD` shows only the two files modified.
- A grep for `FastAPI` in README returns at least one hit (the new Tech Stack line).
- A grep for `progress_service` in CLAUDE.md returns at least one hit (the new tree entry).
- A grep for `user_activity_log` in CLAUDE.md returns at least one hit (the Database Schema bullet).
- No CI surface change expected; the existing `npm run lint`, `npm run type-check`, etc., are unaffected.

## Acceptance criteria

- [ ] README.md Tech Stack Backend line includes "FastAPI".
- [ ] CLAUDE.md Backend Structure shows the four progress files + the tests directory.
- [ ] CLAUDE.md has a paragraph explaining the transactional `*_tx` function pattern and the service_role-only grant.
- [ ] CLAUDE.md Database Schema bullet list includes all 4 Phase 1 tables and both new `profiles` columns.
- [ ] No code or test files modified.
