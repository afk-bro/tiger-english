# Phase 1: Progress Tracking & Dashboard Real Data — Design

**Status:** Approved (brainstorm)
**Date:** 2026-05-03
**Branch:** `feat/phase-1-progress-tracking` off `main`.
**Phase:** 1 of 3 (CEFR dashboard initiative).

## Phase decomposition context

The user's vision is a CEFR-based dashboard with skill breakdown, weighted progression scoring, recommendation engine, and AI Speaking Practice integration. This is decomposed into three sequential phases, each independently shippable:

1. **Phase 1 (this spec).** Persistence foundation + dashboard real data. Make every metric in the existing dashboard real instead of mocked. No CEFR concepts yet, no XP formula.
2. **Phase 2.** CEFR levels + skill breakdown + recommendation engine. Adds `cefr_level` and `skill_scores` schema, weighted progression formula, redesigned dashboard with CEFR widget, 6-skill breakdown, "What should I study next?" card. Listening/Speaking skills sit at 0% until Phase 3.
3. **Phase 3.** AI Speaking Practice — voice IO, model integration, `ai_conversation_sessions` table, scoring rubric, dashboard AI card.

Phase 1 is the prerequisite both other phases need. No metric is real until persistence exists.

## Problem

The current dashboard at `src/pages/Dashboard.tsx` reads zero real data. It imports `mockDashboardData` (179 hardcoded lines: `level: 12`, `currentStreak: 12`, fake flashcard sets, fake words-learned counts) and renders a fully-mocked UI. Meanwhile, the `user_stats(xp, level, study_streak, last_login)` table exists in Postgres but has never been read or updated since the registration trigger created the row. Lesson section progress is tracked in-memory only (`useLessonProgressStore`), lost on page refresh. Exercise attempts aren't tracked at all — `MultipleChoice.tsx` / `FillBlank.tsx` fire `onCorrect()` but no data flows past the React tree. Flashcard reviews ARE persisted (`user_card_progress`) but the dashboard doesn't read them.

We need to:

1. Add three projection tables (`lesson_section_progress`, `exercise_attempts`, `flashcard_reviews`) and one event stream (`user_activity_log`) to capture every learner action.
2. Add a backend service layer with three domain functions (`complete_lesson_section`, `submit_exercise_attempt`, `review_flashcard`) and a read aggregator (`get_summary`). All writes go through these functions; nothing else writes to the new tables.
3. Add four FastAPI endpoints under `/me/progress/` that map 1:1 to the domain functions.
4. Wire the frontend's three trigger points (lesson section "Mark complete", exercise answer submission, flashcard known/unknown click) to call the new endpoints.
5. Replace the dashboard's mock data with a real fetch via `GET /me/progress/summary`. Replace the XP/level widget with a "Your Progress" activity card. Drop the redundant `StudyStats` and `FlashcardGroups` widgets (Phase 2 will reintroduce per-skill breakdowns).

All in a single PR (Approach 1 from brainstorm) so the dashboard ships end-to-end.

## Architectural decisions

### Q1: Event log + projection table relationship

**Pattern B (dual-write inside a transaction)** with strict enforcement:

- All writes go through domain functions (`complete_lesson_section`, `submit_exercise_attempt`, `review_flashcard`). Frontend and other services never write tables directly.
- Each domain function performs both the projection insert AND the `user_activity_log` insert atomically inside a Postgres `BEGIN/COMMIT` block. The transaction boundary is implemented as a Postgres `FUNCTION` per domain action, called from Python via `supabase.rpc()`. This puts the transaction in Postgres where it belongs and gives us exactly one SQL function per write path.
- Each event row is **lossless**: it carries the full action context (e.g., `{ "unit_slug": "unit-2", "section_key": "grammar" }`), not just a type tag. Phase 2's recommendation engine will read events directly to derive new metrics without needing schema changes.
- Each event row is 1:1 with a projection write: the projection write must match the event metadata.
- An **idempotency key** is supported on event types where re-tries are possible. For Phase 1, only `lesson_section_completed` uses one (`${userId}:${unitSlug}:${sectionKey}:completed`). Exercise attempts and flashcard reviews are append-only (multi-attempt is meaningful) and don't need idempotency.

### Q2: Domain action surface

Three functions, each with a clear single-action contract:

| Domain function | Triggered by | Projection write | Event row |
|---|---|---|---|
| `complete_lesson_section(user, unit_slug, section_key)` | learner clicks "Mark complete" on a section | upsert `lesson_section_progress(user_id, unit_slug, section_key, completed_at)` | `{ type: "lesson_section_completed", payload: { unit_slug, section_key } }`, idempotency_key `${user}:${unit}:${section}:completed` |
| `submit_exercise_attempt(user, unit_slug, section_key, exercise_id, is_correct)` | every exercise answer (correct OR incorrect) | append `exercise_attempts(...)` | `{ type: "exercise_attempted", payload: { unit_slug, section_key, exercise_id, is_correct } }` — no idempotency |
| `review_flashcard(user, flashcard_id, status)` | learner marks card known/unknown | upsert existing `user_card_progress` + append `flashcard_reviews(user_id, flashcard_id, status, reviewed_at)` | `{ type: "flashcard_reviewed", payload: { flashcard_id, status } }` — no idempotency |

Section completion is **manual** (explicit "Mark complete" click), not auto-triggered by exercises. The `lessons.section.markComplete` i18n key already exists in the UI today.

Section-level granularity, not unit-level. Unit completion is derived: a unit is "fully completed" when all 5 SectionKey values appear in `lesson_section_progress` for that user/unit (see `lesson.types.ts:8-13` for the canonical SectionKey union).

Flashcards: `user_card_progress` stays — it holds CURRENT state per card. The new `flashcard_reviews` table holds REVIEW HISTORY (append-only). `review_flashcard()` writes both in one transaction.

No `record_login`, no session tracking, no admin-style writes in Phase 1.

### Q3: XP scope — defer with "Your Progress" activity card

Phase 1 ships **no XP/level widget**. The XP `user_stats.xp` column stays at 0; the level concept is deferred entirely to Phase 2 (where CEFR semantics define what XP means and how it accrues).

In place of the XP widget, the dashboard shows a **"Your Progress"** card with grouped, actionable metrics:

- **Lessons completed:** N (count of fully-completed units)
- **Exercises:** N attempts (X% correct)
- **Flashcards reviewed:** N (M mastered)
- **Last studied:** today / yesterday / N days ago / never

No gamification (no XP bar, no level number, no trend lines) in Phase 1. Phase 2 swaps the layout to CEFR + XP bar, **reusing the same underlying data** — raw signals (exercise correctness, section completion, review status) are already captured by the schema, so the XP formula plugs in without backfill.

### Q4: Streak rule

A study day is **any local calendar day where the user generated at least one qualifying event** in `user_activity_log`. Streak = count of consecutive distinct study days ending today (or yesterday if no activity today yet). Day boundary in the user's local timezone (captured one-time on first authenticated session, stored on `profiles.timezone`, defaults to UTC if NULL). Strict reset; no grace period. Streak is **derived at read time** from the event log (or via a daily cron-recomputed cache on `user_stats.study_streak` later), not maintained as an incrementing counter — derivation guarantees consistency with the event log and avoids race conditions.

### Q5: API endpoint shape

Verb-oriented action endpoints under `/me/progress/`:

- `POST /me/progress/complete-section` — body `{ unit_slug, section_key }`
- `POST /me/progress/attempt-exercise` — body `{ unit_slug, section_key, exercise_id, is_correct }`
- `POST /me/progress/review-flashcard` — body `{ flashcard_id, status }`
- `GET  /me/progress/summary` — returns `ProgressSummaryResponse`

One endpoint per domain function, one service function per endpoint, one Postgres transaction per service function, one event row per transaction. Matches the single-write-path principle.

## File-level changes

### New files

- `supabase/migrations/<timestamp>_phase1_progress_tracking.sql` — 4 tables + `profiles.timezone` column + RLS policies + 3 transactional Postgres functions.
- `backend/app/services/progress_service.py` — `ProgressService` class with the 3 domain functions + `get_summary` + the streak derivation helper.
- `backend/app/api/v1/progress.py` — 4 endpoints, all using `Depends(get_current_user)`.
- `backend/app/models/progress.py` — Pydantic request/response models.
- `backend/tests/test_progress_service.py` — service-layer tests (transactions, idempotency, streak derivation, etc.).
- `backend/tests/test_progress_api.py` — endpoint tests (auth, validation, integration).
- `src/lib/api/progress.ts` — frontend API client singleton (`ProgressAPI`), mirrors `AuthAPI`'s pattern.
- `src/features/dashboard/useProgressSummary.ts` — React hook, fetch-on-mount.
- `src/components/dashboard/YourProgressCard.tsx` — the new activity widget.
- `src/lib/api/__tests__/progress.test.ts`, `src/features/dashboard/__tests__/useProgressSummary.test.tsx`, `src/components/dashboard/__tests__/YourProgressCard.test.tsx`, `src/components/dashboard/__tests__/Dashboard.test.tsx` — frontend tests.

### Modified files

- `backend/app/api/v1/__init__.py` (or main router) — register the new `/me/progress/*` routes.
- `backend/app/api/v1/auth.py` + `backend/app/services/auth_service.py` + `backend/app/models/auth.py` — extend `PATCH /auth/profile` to accept an optional `timezone` field (currently only accepts `native_language`).
- `src/features/lessons/useLessonProgressStore.ts` — extend `markCompleted(unit, section)` to also call `ProgressAPI.completeSection(unit, section)`. Store stays as in-memory cache layered over backend persistence.
- `src/components/exercises/MultipleChoice.tsx` and `src/components/exercises/FillBlank.tsx` — add optional `onAttempt?: (isCorrect: boolean) => void` prop, called on every answer submission (correct AND incorrect). Existing `onCorrect` callback unchanged.
- `src/features/lessons/components/blocks/ExerciseBlock.tsx` — accept `unitSlug` + `sectionKey` props, pass them through to renderers, and create the `onAttempt` closure that calls `ProgressAPI.attemptExercise(...)`.
- `src/features/lessons/pages/SectionPage.tsx` — pass `unitSlug` + `sectionKey` to `ExerciseBlock`.
- `src/features/flashcards/api/flashcards.ts` — replace direct `supabase.from('user_card_progress').upsert(...)` calls with `ProgressAPI.reviewFlashcard({ flashcardId, status })`. Backend transaction handles the dual write.
- `src/components/AppInitializer.tsx` (or wherever `SIGNED_IN` is handled) — on profile fetch, if `profile.timezone` is null, PATCH the profile with `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- `src/pages/Dashboard.tsx` — replace `mockDashboardData` import with `useProgressSummary()`. Render `<WelcomePanel>` (real streak), `<YourProgressCard>`, `<LogoutButton>`. Show skeleton while loading, error state on failure.
- `src/components/dashboard/WelcomePanel.tsx` — drop the `Level {{level}}` line (no level concept in Phase 1). Keep "Welcome back, {name}" + streak count. Phase 2 re-adds level with CEFR.
- `src/locales/en/en.json` and `src/locales/vi/vi.json` — add new dashboard keys (see "i18n" below).
- `src/stores/useUserStore.ts` — add `timezone` field to the `Profile` shape (optional, nullable).
- `CLAUDE.md` — append a short note documenting the new `/me/progress/*` API namespace and the event-log pattern.

### Deleted files

- `src/mocks/mockDashboardData.ts` — gone (179 lines of mocked dashboard data, no longer needed).
- `src/components/dashboard/XPProgress.tsx` — replaced by `YourProgressCard.tsx`. Phase 2 introduces a fresh CEFR widget rather than retrofitting this one.
- `src/components/dashboard/StudyStats.tsx` — its 4 cards are now redundant: words-learned ≈ flashcards_mastered (in YourProgressCard), accuracy is in YourProgressCard, day_streak is in WelcomePanel, time_today isn't tracked at all in Phase 1.
- `src/components/dashboard/FlashcardGroups.tsx` — per-set flashcard breakdown deferred to Phase 2; the aggregate `flashcards_reviewed`/`mastered` in YourProgressCard answers "did I make progress" sufficiently for now.

### Out of scope (deferred to Phase 2 or later)

- CEFR level + skill breakdown widgets.
- "What should I study next?" recommendation engine.
- AI Speaking Practice card + voice IO + `ai_conversation_sessions` table.
- Per-skill score tracking (vocab/grammar/listening/speaking/reading/writing).
- XP awards per action / level-up logic / level mapping curve.
- Per-set flashcard progress breakdown on the dashboard.
- Backfilling event log from existing `user_card_progress` rows (we start fresh; existing card progress is preserved as the projection but isn't replayed into events).
- Streak grace periods / freezes.
- React Query / SWR introduction (plain `useEffect` fetch-on-mount in Phase 1).
- Materialized view or `user_stats_cache` for the summary endpoint (Phase 2+ if measured pain).
- DELETE endpoints — progress isn't user-erasable in Phase 1.
- Batch endpoints (e.g., `POST /me/progress/exercise-attempts` for bulk).

## Schema

Migration file: `supabase/migrations/<timestamp>_phase1_progress_tracking.sql`. Four new tables + `profiles.timezone` column. All new tables have RLS enabled with a SELECT-own-rows policy as defense-in-depth (backend uses service role key per existing pattern, so writes bypass RLS).

### `user_activity_log`

Single source-of-truth event stream. Append-only.

```sql
CREATE TABLE user_activity_log (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN (
                    'lesson_section_completed',
                    'exercise_attempted',
                    'flashcard_reviewed'
                  )),
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key TEXT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_log_user_created
  ON user_activity_log (user_id, created_at DESC);

CREATE UNIQUE INDEX idx_activity_log_idempotency
  ON user_activity_log (user_id, type, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
```

The `CHECK` enforces the closed set of event types. Idempotency is enforced by the partial unique index. The `(user_id, created_at DESC)` index supports streak derivation. `payload` carries the lossless event body.

### `lesson_section_progress`

Current state of section completion. PK doubles as projection-level idempotency.

```sql
CREATE TABLE lesson_section_progress (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_slug    TEXT NOT NULL,
  section_key  TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, unit_slug, section_key)
);

CREATE INDEX idx_lsp_user ON lesson_section_progress (user_id);
```

`INSERT ... ON CONFLICT (user_id, unit_slug, section_key) DO NOTHING` makes re-completion a no-op.

### `exercise_attempts`

Append-only history of every answer.

```sql
CREATE TABLE exercise_attempts (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_slug    TEXT NOT NULL,
  section_key  TEXT NOT NULL,
  exercise_id  TEXT NOT NULL,
  is_correct   BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ea_user_attempted ON exercise_attempts (user_id, attempted_at DESC);
CREATE INDEX idx_ea_user_exercise  ON exercise_attempts (user_id, exercise_id);
```

No idempotency. Every attempt is meaningful (multi-attempt is the signal).

### `flashcard_reviews`

Append-only review history. Sits alongside the existing `user_card_progress` (which holds current state).

```sql
CREATE TABLE flashcard_reviews (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  status       TEXT NOT NULL CHECK (status IN ('known', 'unknown')),
  reviewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fr_user_reviewed ON flashcard_reviews (user_id, reviewed_at DESC);
```

Only `'known' | 'unknown'` — `'unseen'` is the default state of cards, not a learner action.

### `profiles` extension

```sql
ALTER TABLE profiles ADD COLUMN timezone TEXT;
```

Nullable. Frontend captures `Intl.DateTimeFormat().resolvedOptions().timeZone` on first authenticated session render and PATCHes if NULL. Streak derivation falls back to UTC for users who haven't been seen since the migration.

### RLS policies

For each new table:

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_<table>" ON <table>
  FOR SELECT USING (auth.uid() = user_id);
```

No INSERT/UPDATE/DELETE policies — those are intentionally absent so anonymous users and the anon Supabase key can never write. Only the backend service role bypasses RLS.

### Function permissions

All write functions (`complete_lesson_section_tx`, `submit_exercise_attempt_tx`, `review_flashcard_tx`) and the `user_study_days` helper are `REVOKE`d from `PUBLIC`, `anon`, and `authenticated`, then `GRANT`ed only to `service_role`. They are callable **exclusively from the FastAPI backend** via the Supabase service-role key. This matches the project's "secrets/writes behind the backend" pattern.

Without these REVOKE/GRANT statements, Postgres's default `GRANT EXECUTE TO PUBLIC` combined with Supabase automatically exposing every `public` schema function as a PostgREST RPC endpoint would let any authenticated user call:

```ts
supabase.rpc('review_flashcard_tx', { p_user_id: '<victim_uuid>', p_flashcard_id: '...', p_status: 'unknown' })
```

and corrupt another user's progress + streak data — bypassing the backend's auth + business logic entirely.

Each function is also defined with `SET search_path = public, pg_temp, auth` to mitigate `search_path` injection attacks against `SECURITY DEFINER` functions (matches the existing `handle_new_user` trigger function pattern in this repo).

The new tables also have `GRANT SELECT ... TO authenticated`, alongside the SELECT-own RLS policies. Without the GRANT, the RLS policies are dead code (Postgres rejects the read at the GRANT layer before RLS is even consulted). With the GRANT in place, any future direct-from-frontend read via the anon key would be filtered to the user's own rows by RLS — defense-in-depth that costs nothing today.

### Transactional Postgres functions

The migration defines three functions, one per domain action. Each does both the projection write AND the `user_activity_log` insert inside a single transaction. The Python service calls them via `.rpc()`.

For idempotency: the `lesson_section_completed` function uses `ON CONFLICT (user_id, type, idempotency_key) DO NOTHING` on the event log insert too (when `idempotency_key` is provided). Net behavior: re-sending the same call returns the existing projection row, no duplicates anywhere. This is what makes the rapid-double-click safe (see Tests § 7.5).

```sql
-- complete_lesson_section_tx — example shape
CREATE OR REPLACE FUNCTION complete_lesson_section_tx(
  p_user_id UUID,
  p_unit_slug TEXT,
  p_section_key TEXT,
  p_idempotency_key TEXT
) RETURNS lesson_section_progress
SET search_path = public, pg_temp, auth
AS $$
DECLARE
  result lesson_section_progress;
BEGIN
  INSERT INTO lesson_section_progress (user_id, unit_slug, section_key)
  VALUES (p_user_id, p_unit_slug, p_section_key)
  ON CONFLICT (user_id, unit_slug, section_key) DO NOTHING;

  INSERT INTO user_activity_log (user_id, type, payload, idempotency_key)
  VALUES (
    p_user_id,
    'lesson_section_completed',
    jsonb_build_object('unit_slug', p_unit_slug, 'section_key', p_section_key),
    p_idempotency_key
  )
  ON CONFLICT (user_id, type, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

  SELECT * INTO result FROM lesson_section_progress
  WHERE user_id = p_user_id AND unit_slug = p_unit_slug AND section_key = p_section_key;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- (REVOKE EXECUTE FROM PUBLIC, anon, authenticated; GRANT EXECUTE TO service_role
--  applied to every *_tx function — see "Function permissions" subsection above.)
```

(Equivalent functions for `submit_exercise_attempt_tx` and `review_flashcard_tx` follow the same pattern. `review_flashcard_tx` additionally upserts `user_card_progress`.)

A 4th helper function `user_study_days(p_user_id, p_tz)` returns distinct local-calendar days from the event log:

```sql
CREATE OR REPLACE FUNCTION user_study_days(p_user_id UUID, p_tz TEXT)
RETURNS TABLE(day DATE) AS $$
  SELECT DISTINCT (created_at AT TIME ZONE p_tz)::date AS day
  FROM user_activity_log
  WHERE user_id = p_user_id
  ORDER BY day DESC;
$$ LANGUAGE sql SECURITY DEFINER;
```

The Python service walks this output for streak + this-week derivation.

## Backend service + endpoints

### Service: `backend/app/services/progress_service.py`

`ProgressService` class with dependency-injected Supabase client (matches `AuthService`'s pattern). Four methods:

```python
class ProgressService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    def complete_lesson_section(
        self, user_id: UUID, unit_slug: str, section_key: str
    ) -> LessonSectionProgress:
        idem = f"{user_id}:{unit_slug}:{section_key}:completed"
        return self.supabase.rpc(
            "complete_lesson_section_tx",
            {
                "p_user_id": str(user_id),
                "p_unit_slug": unit_slug,
                "p_section_key": section_key,
                "p_idempotency_key": idem,
            },
        ).execute().data

    def submit_exercise_attempt(
        self, user_id: UUID, unit_slug: str, section_key: str,
        exercise_id: str, is_correct: bool,
    ) -> ExerciseAttempt:
        return self.supabase.rpc(
            "submit_exercise_attempt_tx",
            {
                "p_user_id": str(user_id),
                "p_unit_slug": unit_slug,
                "p_section_key": section_key,
                "p_exercise_id": exercise_id,
                "p_is_correct": is_correct,
            },
        ).execute().data

    def review_flashcard(
        self, user_id: UUID, flashcard_id: UUID, status: Literal["known", "unknown"],
    ) -> FlashcardReview:
        return self.supabase.rpc(
            "review_flashcard_tx",
            {
                "p_user_id": str(user_id),
                "p_flashcard_id": str(flashcard_id),
                "p_status": status,
            },
        ).execute().data

    def get_summary(self, user_id: UUID) -> ProgressSummaryResponse:
        # Fetch profile.timezone (default 'UTC')
        # Fetch sections_completed: SELECT * FROM lesson_section_progress WHERE user_id = ?
        # Aggregate exercise_attempts: SELECT COUNT(*), COUNT(*) FILTER (WHERE is_correct) FROM exercise_attempts WHERE user_id = ?
        # Aggregate flashcards_reviewed: SELECT COUNT(*) FROM flashcard_reviews WHERE user_id = ?
        # Aggregate flashcards_mastered: SELECT COUNT(*) FROM user_card_progress WHERE user_id = ? AND status = 'known'
        # Compute lessons_completed via SQL: count units with all 5 sections present
        # Derive streak + study_days_this_week from user_study_days(user_id, tz)
        # last_active_at: SELECT MAX(created_at) FROM user_activity_log WHERE user_id = ?
        ...
        return ProgressSummaryResponse(
            sections_completed=..., exercise_attempts=..., flashcards=...,
            streak=..., study_days_this_week=..., last_active_at=...,
            activity=ActivityCounts(
                lessons_completed=..., exercises_attempted=..., exercises_correct=...,
                flashcards_reviewed=..., flashcards_mastered=...,
            ),
        )
```

### Streak derivation helper

```python
def _derive_streak(self, study_days: list[date], tz_name: str) -> int:
    if not study_days:
        return 0
    # study_days arrives sorted DESC and deduped (SQL DISTINCT + ORDER BY)
    today = datetime.now(ZoneInfo(tz_name)).date()
    if study_days[0] not in (today, today - timedelta(days=1)):
        return 0  # streak broken
    streak = 1
    for prev, curr in zip(study_days, study_days[1:]):
        if (prev - curr).days == 1:
            streak += 1
        else:
            break
    return streak
```

**Critical correctness note:** `study_days` MUST arrive sorted DESC and deduped. Both invariants are enforced in the SQL function (`SELECT DISTINCT ... ORDER BY day DESC`). Don't break either.

### Computing `lessons_completed` without per-unit metadata

Every unit currently has the same 5 section keys (`overview`, `grammar`, `vocabulary`, `dialogues`, `activities`) — codified in `SectionKey` at `lesson.types.ts:8-13`. So "unit fully completed" = "5 distinct section_keys present for that unit_slug." Single SQL:

```sql
SELECT COUNT(*) FROM (
  SELECT unit_slug
  FROM lesson_section_progress
  WHERE user_id = $1
  GROUP BY unit_slug
  HAVING COUNT(DISTINCT section_key) = 5
) AS completed_units;
```

The constant `5` lives in a single named constant `REQUIRED_SECTIONS_PER_UNIT = 5` with a comment pointing at `lesson.types.ts:8-13` so anyone changing the section taxonomy knows to update both. If a future unit ever has a different section count, we'll need to introduce backend unit metadata — flagged as a Phase 2+ migration concern.

### Endpoints: `backend/app/api/v1/progress.py`

All 4 endpoints use a `Depends(get_current_user)` dependency that validates the Supabase JWT in the Authorization header and returns the user UUID. (Reuse the dependency pattern from `auth.py`.)

```python
router = APIRouter(prefix="/me/progress", tags=["progress"])

@router.post("/complete-section", response_model=LessonSectionProgressResponse)
def complete_section(
    body: LessonSectionCompletedRequest,
    user: User = Depends(get_current_user),
    service: ProgressService = Depends(get_progress_service),
):
    return service.complete_lesson_section(user.id, body.unit_slug, body.section_key)

@router.post("/attempt-exercise", response_model=ExerciseAttemptResponse)
def attempt_exercise(body: ExerciseAttemptRequest, ...): ...

@router.post("/review-flashcard", response_model=FlashcardReviewResponse)
def review_flashcard(body: FlashcardReviewRequest, ...): ...

@router.get("/summary", response_model=ProgressSummaryResponse)
def summary(user: User = Depends(get_current_user), service: ProgressService = Depends(get_progress_service)):
    return service.get_summary(user.id)
```

### Pydantic models: `backend/app/models/progress.py`

Request models:

```python
class LessonSectionCompletedRequest(BaseModel):
    unit_slug: str
    section_key: str

class ExerciseAttemptRequest(BaseModel):
    unit_slug: str
    section_key: str
    exercise_id: str
    is_correct: bool

class FlashcardReviewRequest(BaseModel):
    flashcard_id: UUID
    status: Literal["known", "unknown"]
```

Response models:

```python
class LessonSectionProgressResponse(BaseModel):
    unit_slug: str
    section_key: str
    completed_at: datetime

class ExerciseAttemptResponse(BaseModel):
    id: int
    attempted_at: datetime

class FlashcardReviewResponse(BaseModel):
    id: int
    reviewed_at: datetime

class CompletedSection(BaseModel):
    unit_slug: str
    section_key: str
    completed_at: datetime

class AttemptsSummary(BaseModel):
    total: int
    correct: int

class FlashcardsSummary(BaseModel):
    reviewed_total: int
    currently_known: int

class StreakSummary(BaseModel):
    current_days: int

class ActivityCounts(BaseModel):
    lessons_completed: int        # count of FULLY-completed units
    exercises_attempted: int      # mirrors exercise_attempts.total
    exercises_correct: int        # mirrors exercise_attempts.correct
    flashcards_reviewed: int      # mirrors flashcards.reviewed_total
    flashcards_mastered: int      # mirrors flashcards.currently_known

class ProgressSummaryResponse(BaseModel):
    sections_completed: List[CompletedSection]
    exercise_attempts: AttemptsSummary
    flashcards: FlashcardsSummary
    streak: StreakSummary
    study_days_this_week: int
    last_active_at: Optional[datetime]
    activity: ActivityCounts
```

The `activity` block duplicates fields from the breakdown blocks — intentional. The dashboard renders `summary.activity` directly; the breakdowns stay for future consumers needing raw granularity.

### Error handling

- All POST endpoints return 401 if not authenticated, 422 if body validation fails, 200 with the projection row on success.
- Idempotency: re-sending `complete_section` for an already-completed section returns 200 with the existing row (no error). The Postgres function uses `ON CONFLICT DO NOTHING ... RETURNING` and falls back to a SELECT if no row was returned.

## Frontend integration + dashboard rewire

### API client: `src/lib/api/progress.ts`

Singleton `ProgressAPI` matching `AuthAPI`'s pattern.

**Critical error semantics:**
- **Write methods** (`completeSection`, `attemptExercise`, `reviewFlashcard`) **swallow errors INSIDE the client and log via `console.error`. They return `null` on failure.** Call sites stay clean (no try/catch needed). Failures are visible in the console / future error reporting (Sentry).
- **Read method** (`getSummary`) DOES throw on error — the dashboard hook needs the error to render an error state.
- **Anonymous handling:** `authedFetch` reads the Supabase session; if no session, all methods silently return `null` (write methods never call the backend; the read method returns null which the hook treats as "no data"). The dashboard is auth-gated by `UserLayout` so the read-null case shouldn't appear in practice.

```ts
// Write method (internal pattern)
async attemptExercise(args) {
  try {
    return await this.authedFetch("/me/progress/attempt-exercise", {...});
  } catch (err) {
    console.error("attemptExercise failed", err);
    return null;
  }
}

// Read method
getSummary() {
  return this.authedFetch<ProgressSummary>("/me/progress/summary"); // throws on error
}
```

### Summary hook: `src/features/dashboard/useProgressSummary.ts`

Plain `useEffect` fetch-on-mount. Returns `{ data, isLoading, error }`. No SWR/React Query introduced. Refetch happens naturally on remount.

### Three write integration points

**1. Lesson section completion.** The existing "Mark complete" UI calls `useLessonProgressStore.markCompleted(unit, section)`. Update the store to also call `ProgressAPI.completeSection(unit, section)`. Store stays as in-memory cache; backend persistence is a side effect of the same action.

**2. Exercise attempt.** Extend `MultipleChoice.tsx` and `FillBlank.tsx` `Props` with optional `onAttempt?: (isCorrect: boolean) => void`. Call on every answer submission (correct AND incorrect). `ExerciseBlock.tsx` already knows `unitSlug`/`sectionKey` and creates the closure: `onAttempt={(isCorrect) => void ProgressAPI.attemptExercise({ unitSlug, sectionKey, exerciseId, isCorrect })}`. Existing `onCorrect` callback unchanged (orthogonal concern).

**3. Flashcard review.** `src/features/flashcards/api/flashcards.ts` currently calls `supabase.from('user_card_progress').upsert(...)` directly. Replace with `ProgressAPI.reviewFlashcard({ flashcardId, status })`. Backend transaction does the upsert + `flashcard_reviews` row + event log row atomically. **Optimistic UI:** all 3 write methods are fire-and-forget — local state updates immediately, the API call happens in the background, no `await` blocks UI. If a write fails, local state is "wrong" until the next refresh; acceptable trade-off for snappy feel.

### Timezone capture flow

On `AuthInitializer`'s `SIGNED_IN` handler (where `fetchProfile()` runs today), check if `profile.timezone` is null. If so, PATCH the profile with `Intl.DateTimeFormat().resolvedOptions().timeZone`. One-time per user. Extends the existing `PATCH /auth/profile` endpoint to also accept an optional `timezone` field.

### Dashboard page rewire

```tsx
// src/pages/Dashboard.tsx
function Dashboard() {
  const { profile } = useUserStore();
  const { data: summary, isLoading, error } = useProgressSummary();

  if (isLoading) return <DashboardSkeleton />;
  if (error || !summary) return <DashboardError />;

  return (
    <div className="...">
      <WelcomePanel name={profile.first_name} streak={summary.streak.current_days} />
      <YourProgressCard
        activity={summary.activity}
        lastActiveAt={summary.last_active_at}
        timezone={profile.timezone ?? "UTC"}
      />
      <LogoutButton />
    </div>
  );
}
```

### Existing widget decisions

- **`WelcomePanel`** — KEEP, simplify (drop `Level {{level}}` line). Phase 2 re-adds level with CEFR.
- **`XPProgress`** — DELETE. Replaced by `YourProgressCard`. Phase 2 introduces a fresh CEFR widget.
- **`StudyStats`** — DELETE. Its 4 cards are redundant with `YourProgressCard` / `WelcomePanel`; `time_today` isn't tracked at all in Phase 1.
- **`FlashcardGroups`** — DELETE in Phase 1. Per-set breakdown deferred to Phase 2.

### `YourProgressCard`

Renders 4 lines:

- *Lessons completed: {N}*
- *Exercises: {N} attempts ({P}% correct)* — accuracy `attempted > 0 ? Math.round(correct / attempted * 100) : 0` (never NaN).
- *Flashcards reviewed: {N} ({M} mastered)*
- *Last studied: today / yesterday / N days ago / never*

`relativeStudyLabel(lastActiveAt, tz, t)` helper computes the last-studied label by comparing local-day buckets in the user's timezone:

```ts
function relativeStudyLabel(lastActiveAt: string | null, tz: string, t: TFunction): string {
  if (!lastActiveAt) return t("dashboard.yourProgress.lastStudied.never");
  const last = new Date(lastActiveAt);
  const today = new Date();
  const lastLocalMidnight = floorToLocalDay(last, tz);
  const todayLocalMidnight = floorToLocalDay(today, tz);
  const diffDays = Math.floor((todayLocalMidnight.getTime() - lastLocalMidnight.getTime()) / 86400000);
  if (diffDays === 0) return t("dashboard.yourProgress.lastStudied.today");
  if (diffDays === 1) return t("dashboard.yourProgress.lastStudied.yesterday");
  return t("dashboard.yourProgress.lastStudied.daysAgo", { count: diffDays });
}
```

### i18n keys (en + vi)

```json
"dashboard": {
  "yourProgress": {
    "heading": "Your Progress",
    "lessonsCompleted": "Lessons completed: {{count}}",
    "exercises": "Exercises: {{attempts}} attempts ({{accuracy}}% correct)",
    "flashcards": "Flashcards reviewed: {{reviewed}} ({{mastered}} mastered)",
    "lastStudied": {
      "label": "Last studied: {{relative}}",
      "never": "never",
      "today": "today",
      "yesterday": "yesterday",
      "daysAgo": "{{count}} days ago"
    }
  },
  "loading": "Loading…",
  "error": "Couldn't load your progress. Try refreshing."
}
```

Vietnamese values authored alongside (content polish during implementation; the structure is what's locked in here).

## Tests & verification

### Backend tests (Python / pytest)

`backend/tests/test_progress_service.py`:

- `test_complete_lesson_section_writes_both_tables` — asserts row in `lesson_section_progress` AND row in `user_activity_log` with right type/payload/idempotency_key.
- `test_complete_lesson_section_is_idempotent` — calls twice with same args, asserts exactly 1 row in each table.
- `test_submit_exercise_attempt_appends` — calls 3× with mixed correct/incorrect, asserts 3 rows in `exercise_attempts` (no upsert) + 3 rows in `user_activity_log`.
- `test_review_flashcard_writes_three_tables` — asserts row in `user_card_progress` (upsert), `flashcard_reviews` (append), `user_activity_log` (append).
- **No transaction-rollback test.** Originally planned, but on closer inspection there's no clean way to force a mid-transaction error from outside the Postgres function: the `ON CONFLICT DO NOTHING` clauses on the idempotency-bearing inserts swallow conflicts (no error → no rollback), FK/CHECK violations on the inputs fire on the FIRST insert in the function (before the second one runs, so they don't test "second fails → first rolls back"), and a test-only broken function would test a test-only function rather than the real one. The `BEGIN/COMMIT` semantics inside `LANGUAGE plpgsql` are guaranteed by Postgres itself — it's not our atomicity to *prove*, just our atomicity to *use*. The idempotency tests + happy-path tests below already prove the function correctly USES the transaction (both inserts land together or neither does, observable from DB state).
- `test_get_summary_empty` — new user, no events: returns 0 across all activity counts, streak = 0, last_active_at = null, study_days_this_week = 0.
- `test_get_summary_lessons_completed_counts_full_units` — seed 5 sections for unit-1 (full) + 3 sections for unit-2 (partial), assert `activity.lessons_completed == 1`.
- `test_get_summary_accuracy` — seed 10 attempts (7 correct, 3 incorrect), assert `exercise_attempts == { total: 10, correct: 7 }` and `activity.exercises_correct == 7`.
- `test_streak_derivation_*` — table of cases:
  - no events → 0
  - today only → 1
  - today + yesterday → 2
  - today + 2-days-ago (gap) → 1
  - yesterday only (no activity today yet) → 1 (still counts)
  - 2-days-ago only → 0 (broken)
  - 5 consecutive days ending today → 5
- `test_streak_respects_timezone_boundary` — **the most likely real-world bug.** User tz = `Asia/Bangkok` (UTC+7). Event 1: `created_at = 2026-05-03T16:30:00Z` (= 23:30 Bangkok on 2026-05-03). Event 2: `created_at = 2026-05-03T17:30:00Z` (= 00:30 Bangkok on 2026-05-04). Both events fall in the same UTC day; in Bangkok local time they're 2 distinct calendar days. Assuming today in Bangkok is 2026-05-04, assert `streak == 2`.
- `test_study_days_this_week` — events Mon/Tue/Thu of current week, assert `study_days_this_week == 3`.

`backend/tests/test_progress_api.py`:

- For each of 4 endpoints: `test_<endpoint>_requires_auth` (401 without Bearer), `test_<endpoint>_validates_body` (422 on missing/wrong fields), `test_<endpoint>_happy_path` (200 + correct response shape).
- `test_complete_section_endpoint_is_idempotent` — calls the endpoint twice via `TestClient`, asserts exactly 1 row in each table. Catches wiring failures the service test wouldn't see.

### Frontend tests (TypeScript / Vitest)

`src/lib/api/__tests__/progress.test.ts`:

- `test_authedFetch_returns_null_for_anonymous` — mock `supabase.auth.getSession()` to return null session, assert all 4 methods resolve to `null` and never call `fetch`.
- `test_authedFetch_attaches_bearer_for_authed` — mock session with access_token, intercept `fetch`, assert `Authorization: Bearer <token>` header set.
- `test_completeSection_sends_correct_body` — assert POST to `/me/progress/complete-section` with `{ unit_slug, section_key }`.
- Same for `attemptExercise`, `reviewFlashcard`, `getSummary`.
- `test_write_methods_do_not_throw_on_error` — mock 500 response, assert each of the 3 write methods resolves to `null` (does NOT throw, internally caught + logged).
- `test_getSummary_throws_on_error` — mock 500 response, assert the read method's promise rejects.

`src/features/dashboard/__tests__/useProgressSummary.test.tsx`:

- `test_loads_then_returns_data` — mock resolution; assert `isLoading: true → false` with `data` populated.
- `test_loads_then_returns_error` — mock rejection; assert `error` populated.
- `test_anonymous_user_returns_null_data` — mock null session; assert hook ends in `isLoading: false, data: null, error: null`.

`src/components/dashboard/__tests__/YourProgressCard.test.tsx`:

- `test_renders_all_four_lines` — pass full `activity` + `last_active_at`, assert each label appears.
- `test_accuracy_zero_when_no_attempts` — pass `exercises_attempted: 0`, assert text contains "0%" and never "NaN".
- `test_last_studied_today` — `last_active_at` matching today; assert "today" label.
- `test_last_studied_yesterday` — yesterday's date; assert "yesterday."
- `test_last_studied_days_ago` — 5 days ago; assert "5 days ago."
- `test_last_studied_never` — pass null; assert "never."
- `test_renders_zero_state_cleanly` — all-zero `activity`, null `last_active_at`. Assert: "0%" appears (no NaN), "never" label appears, no broken layout, no `undefined` strings.

`src/components/dashboard/__tests__/Dashboard.test.tsx`:

- `test_renders_skeleton_while_loading` — mock hook in loading state, assert skeleton appears.
- `test_renders_error_state_on_failure` — mock hook with error, assert error message appears.
- `test_renders_widgets_with_real_data` — mock hook with summary, assert `WelcomePanel` (with name + streak) and `YourProgressCard` (with activity) both render.

### Pre-PR spot-checks

1. `cd backend && pytest` — all backend tests green.
2. Apply migration locally (`supabase db reset` or `supabase migration up`) — verify clean apply, no errors, all 4 tables + columns + indexes + RLS policies + Postgres functions exist.
3. `npm run type-check` — clean.
4. `npm run lint` — no new violations.
5. `npm test` — full frontend suite green.
6. `npm run build` — production build succeeds.
7. **Manual end-to-end walkthrough** in `npm run dev` + backend `python run.py`:
   - Log in as a test user.
   - Open `/lessons/unit-1/grammar`, click any exercise option (correct AND incorrect): verify Postgres has new rows in `exercise_attempts` AND `user_activity_log`, both with matching exercise_id / unit_slug / section_key, both within the same transaction (timestamps within ms of each other).
   - Click "Mark complete" on a section: verify `lesson_section_progress` + `user_activity_log` both have the row.
   - **Click "Mark complete" twice in rapid succession** (no debounce on frontend). Verify Postgres has exactly 1 row in `lesson_section_progress` and exactly 1 row in `user_activity_log` after both clicks settle. Validates idempotency_key + Postgres function's `ON CONFLICT DO NOTHING` on the event log insert.
   - Open flashcards, mark a card known: verify `user_card_progress` updated + `flashcard_reviews` appended + `user_activity_log` event row.
   - Navigate to `/u/<username>` (dashboard): verify `WelcomePanel` shows real streak, `YourProgressCard` shows real numbers (lessons completed, exercise count + accuracy, flashcards reviewed + mastered, last studied label).
   - Toggle language to Vietnamese: verify all dashboard text translates (heading, all 4 progress lines, "today/yesterday/days ago" label).
   - Toggle to Thai/Chinese: verify English fallback (no raw `dashboard.yourProgress.heading` keys leaking).
   - Sign out, hit the dashboard URL: confirm `UserLayout` redirects (no anon access).
   - As anon user, attempt an exercise on a public lesson page: confirm no errors thrown, no crash, just no event recorded.
8. **DB hygiene check:**

   ```sql
   SELECT count(*) FROM user_activity_log
   WHERE idempotency_key IS NOT NULL
     AND type = 'lesson_section_completed'
   GROUP BY user_id, type, idempotency_key
   HAVING count(*) > 1;
   ```

   Should return zero rows (no duplicate events from re-tries). Filter is redundant today (only `lesson_section_completed` uses idempotency_key) but explicit for future-proofing.

## Acceptance criteria for the PR

- [ ] Migration applies cleanly to a fresh DB and to the dev DB.
- [ ] All 4 tables, `profiles.timezone` column, RLS policies, and 4 Postgres functions exist after migration.
- [ ] All 4 endpoints return correct shapes; OpenAPI docs auto-generated by FastAPI render readable schemas.
- [ ] Full backend `pytest` green, including all idempotency, transaction-rollback, streak-derivation, and timezone-boundary tests.
- [ ] Full frontend `npm test` green.
- [ ] `mockDashboardData.ts`, `XPProgress.tsx`, `StudyStats.tsx`, `FlashcardGroups.tsx` deleted from tree (verified by `git status`).
- [ ] Dashboard renders real values for an authed user with at least one event in each domain.
- [ ] Dashboard renders zero state correctly for a brand-new user with zero activity (no NaN, no "undefined", no broken layout, "never" appears for last-studied).
- [ ] Anonymous users on lesson pages don't see errors and don't generate writes.
- [ ] Vietnamese translations present for all new dashboard strings; th/zh-CN fall back to English without breakage.
- [ ] Rapid double-click on "Mark complete" produces exactly 1 row in each table.
- [ ] Manual walkthrough of all checklist items (§7.5) passes.
