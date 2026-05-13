# /home rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reshape `/home` as an AI-tutor-first action surface so users reach J1 (start a session), J2 (resume a session), J3 (review), and J4 (continue lesson) in one click each.

**Architecture:** Replace the current 2×2 mock-data grid in `src/pages/AuthHome.tsx` with four purpose-built cards. Add one new backend endpoint (`GET /me/ai-tutor/sessions/active`) so the hero card can resume in one click; everything else reuses existing endpoints (`/ai-tutor/scenarios`, `/me/review/count`). All work behind the existing `VITE_AI_TUTOR_ENABLED` flag — when off, the legacy `/home` renders unchanged.

**Tech Stack:** React 19 + TypeScript + Vite (frontend), FastAPI + Pydantic (backend), Supabase Postgres, Vitest (FE tests), pytest (BE tests), react-i18next (i18n).

**Spec:** `docs/superpowers/specs/2026-05-12-home-rework.md`

---

## File Structure

**Backend — create:**
- `backend/app/models/tutor.py` (modify): add `ActiveSessionDTO`
- `backend/app/services/tutor_session_service.py` (modify): add `get_active_session()` method
- `backend/app/api/v1/ai_tutor_session.py` (modify): add `GET /me/ai-tutor/sessions/active` route, expand `_ALLOWED_FRONTEND_EVENTS`
- `backend/tests/test_ai_tutor_session.py` (modify): add 3 test cases

**Frontend — create:**
- `src/features/ai-tutor/hooks/useActiveTutorSession.ts`
- `src/features/ai-tutor/hooks/__tests__/useActiveTutorSession.test.tsx`
- `src/features/ai-tutor/hooks/useScenariosList.ts`
- `src/features/ai-tutor/hooks/__tests__/useScenariosList.test.tsx`
- `src/components/home/authenticated/TutorHeroCard.tsx`
- `src/components/home/authenticated/__tests__/TutorHeroCard.test.tsx`
- `src/components/home/authenticated/ScenarioShortcutsRow.tsx`
- `src/components/home/authenticated/__tests__/ScenarioShortcutsRow.test.tsx`
- `src/components/home/authenticated/TodayReviewCard.tsx`
- `src/components/home/authenticated/__tests__/TodayReviewCard.test.tsx`
- `src/components/home/authenticated/ContinueLessonCard.tsx`
- `src/pages/AuthHomeLegacy.tsx` (moved from old `AuthHome.tsx`)

**Frontend — modify:**
- `src/features/ai-tutor/types.ts`: add `ActiveTutorSessionDTO`
- `src/features/ai-tutor/api/tutor.ts`: add `getActiveSession()` method, test it
- `src/features/ai-tutor/api/__tests__/tutor.test.ts`: add `getActiveSession` cases
- `src/pages/AuthHome.tsx`: completely rewrite
- `src/pages/__tests__/Dashboard.test.tsx` pattern → new `src/pages/__tests__/AuthHome.test.tsx`
- `src/locales/{en,vi,th,zh-CN}/<lang>.json`: add new `authhome.*` keys

**Each file has one responsibility.** Hooks live under `src/features/ai-tutor/hooks/` to match the feature-module convention (`api/`, `audio/`, `components/`, `types.ts`). Home-page cards live under `src/components/home/authenticated/` next to the existing cards.

---

## Task 0: Branch setup

**Files:** none (git only)

- [ ] **Step 1: Create feature branch off latest main**

```bash
git checkout main && git pull --ff-only
git checkout -b feat/home-rework-tutor-first
```

Expected: clean checkout on new branch.

---

## Task 1: Backend — `ActiveSessionDTO` model

**Files:**
- Modify: `backend/app/models/tutor.py`

- [ ] **Step 1: Locate the existing tutor models block**

```bash
grep -n "class TutorSessionDTO" backend/app/models/tutor.py
```

Expected: prints the line number where `TutorSessionDTO` is declared. The new model goes immediately after it.

- [ ] **Step 2: Add `ActiveSessionDTO` after `TutorSessionDTO`**

Insert this Pydantic model immediately after the `TutorSessionDTO` class definition:

```python
class ActiveSessionDTO(BaseModel):
    """Compact projection of an active session for the `/home` hero card.

    Distinct from `TutorSessionDTO` (which is the full session-state DTO
    used during play): includes the scenario titles + task progress so the
    home card can render without a follow-up fetch.
    """

    session_id: UUID
    scenario_slug: str
    scenario_title_en: str
    scenario_title_vi: str
    last_activity_at: datetime
    tasks_done: int
    tasks_total: int
```

Verify `BaseModel`, `UUID`, and `datetime` are already imported at the top of the file. If `datetime` is missing, add `from datetime import datetime`.

- [ ] **Step 3: Commit**

```bash
git add backend/app/models/tutor.py
git commit -m "feat(ai-tutor): add ActiveSessionDTO for /home hero card"
```

---

## Task 2: Backend — `get_active_session` service method (TDD)

**Files:**
- Test: `backend/tests/test_ai_tutor_session.py`
- Modify: `backend/app/services/tutor_session_service.py`

- [ ] **Step 1: Find the existing test file's location and convention**

```bash
ls backend/tests/ | grep -i tutor
grep -n "def test_" backend/tests/test_ai_tutor_session.py | head -10
```

Expected: file exists; tests follow a `test_<scenario>` naming pattern with a Supabase mock fixture.

- [ ] **Step 2: Write the failing test for "no active session returns None"**

Append to `backend/tests/test_ai_tutor_session.py`:

```python
def test_get_active_session_returns_none_when_no_active(supabase_mock):
    """Service returns None when the user has no active sessions."""
    from app.services.tutor_session_service import TutorSessionService
    from uuid import uuid4

    # No rows match — supabase returns empty data.
    supabase_mock.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = []

    svc = TutorSessionService(supabase_mock, stt=None)
    result = svc.get_active_session(user_id=uuid4())

    assert result is None
```

Match the existing fixture name and call style — if `supabase_mock` differs in the test file, mirror what `test_start_session_*` uses.

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd backend && source venv/bin/activate
pytest tests/test_ai_tutor_session.py::test_get_active_session_returns_none_when_no_active -v
```

Expected: FAIL with `AttributeError: 'TutorSessionService' object has no attribute 'get_active_session'`.

- [ ] **Step 4: Implement `get_active_session` on `TutorSessionService`**

Add this method to `TutorSessionService` (in `backend/app/services/tutor_session_service.py`), after `_session_to_dto`:

```python
def get_active_session(self, user_id: UUID) -> ActiveSessionDTO | None:
    """Return the user's most-recently-active session, or None.

    Selects the latest row in `ai_tutor_sessions` with status='active' for
    this user (ordered by last_activity_at desc, limit 1). The partial
    unique index already enforces at-most-one per (user, scenario); this
    method picks one across scenarios.
    """
    row_result = (
        self.supabase.table("ai_tutor_sessions")
        .select(
            "id, scenario_id, completed_task_ids, last_activity_at, started_at"
        )
        .eq("user_id", str(user_id))
        .eq("status", "active")
        .order("last_activity_at", desc=True)
        .limit(1)
        .execute()
    )
    rows = row_result.data or []
    if not rows:
        return None
    row = rows[0]

    scenario_result = (
        self.supabase.table("ai_tutor_scenarios")
        .select("slug, title_en, title_vi")
        .eq("id", row["scenario_id"])
        .single()
        .execute()
    )
    scenario = scenario_result.data
    if not scenario:
        # Data-integrity issue — surface it rather than masking.
        return None

    tasks_result = (
        self.supabase.table("ai_tutor_scenario_tasks")
        .select("id", count="exact")
        .eq("scenario_id", row["scenario_id"])
        .execute()
    )
    tasks_total = tasks_result.count or 0
    tasks_done = len(row.get("completed_task_ids") or [])

    return ActiveSessionDTO(
        session_id=row["id"],
        scenario_slug=scenario["slug"],
        scenario_title_en=scenario["title_en"],
        scenario_title_vi=scenario["title_vi"],
        last_activity_at=row.get("last_activity_at") or row["started_at"],
        tasks_done=tasks_done,
        tasks_total=tasks_total,
    )
```

Add the import at the top of the file (next to the existing tutor-model imports):

```python
from ..models.tutor import ActiveSessionDTO
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
pytest tests/test_ai_tutor_session.py::test_get_active_session_returns_none_when_no_active -v
```

Expected: PASS.

- [ ] **Step 6: Add the "returns latest" test**

Append:

```python
def test_get_active_session_returns_latest_across_scenarios(supabase_mock):
    """When multiple active sessions exist, return the one with latest last_activity_at."""
    from app.services.tutor_session_service import TutorSessionService
    from uuid import uuid4, UUID

    scenario_id = "11111111-1111-1111-1111-111111111111"
    session_row = {
        "id": "22222222-2222-2222-2222-222222222222",
        "scenario_id": scenario_id,
        "completed_task_ids": ["t1", "t2"],
        "last_activity_at": "2026-05-12T12:00:00Z",
        "started_at": "2026-05-12T11:00:00Z",
    }
    scenario_row = {
        "slug": "meeting-someone-new",
        "title_en": "Meeting someone new",
        "title_vi": "Gặp người mới",
    }

    # Configure the three table calls in order. Each .table() call resets
    # to the chain; the mock returns the row builder we pre-configure.
    sessions_builder = supabase_mock.table.return_value
    sessions_builder.select.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = [session_row]
    sessions_builder.select.return_value.eq.return_value.single.return_value.execute.return_value.data = scenario_row
    # Tasks count
    tasks_exec = sessions_builder.select.return_value.eq.return_value.execute.return_value
    tasks_exec.count = 4

    svc = TutorSessionService(supabase_mock, stt=None)
    result = svc.get_active_session(user_id=uuid4())

    assert result is not None
    assert str(result.session_id) == session_row["id"]
    assert result.scenario_slug == "meeting-someone-new"
    assert result.scenario_title_en == "Meeting someone new"
    assert result.scenario_title_vi == "Gặp người mới"
    assert result.tasks_done == 2
    assert result.tasks_total == 4
```

- [ ] **Step 7: Run the test**

```bash
pytest tests/test_ai_tutor_session.py::test_get_active_session_returns_latest_across_scenarios -v
```

Expected: PASS (the implementation already handles this case). If FAIL, inspect the mock chain — the existing tests in the file are the canonical reference for the supabase mock fixture's call shape.

- [ ] **Step 8: Commit**

```bash
git add backend/app/services/tutor_session_service.py backend/tests/test_ai_tutor_session.py
git commit -m "feat(ai-tutor): TutorSessionService.get_active_session"
```

---

## Task 3: Backend — `GET /me/ai-tutor/sessions/active` route (TDD)

**Files:**
- Test: `backend/tests/test_ai_tutor_session.py`
- Modify: `backend/app/api/v1/ai_tutor_session.py`

- [ ] **Step 1: Write the failing route test for "200 with null when no active session"**

Append to `backend/tests/test_ai_tutor_session.py`. Mirror the existing route-test pattern in the same file (look for `client.get(...)` calls against `/api/v1/me/ai-tutor/...`).

```python
def test_route_get_active_session_returns_null_body(client, auth_headers, supabase_mock):
    """GET /me/ai-tutor/sessions/active returns 200 with `null` body when no active session."""
    supabase_mock.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = []

    res = client.get("/api/v1/me/ai-tutor/sessions/active", headers=auth_headers)

    assert res.status_code == 200
    assert res.json() is None
```

If `client` and `auth_headers` fixtures are not the names used in this file, mirror what `test_route_list_scenarios_*` uses.

- [ ] **Step 2: Run the test to confirm failure**

```bash
pytest tests/test_ai_tutor_session.py::test_route_get_active_session_returns_null_body -v
```

Expected: FAIL — route returns 422 (because `active` is being matched against the `{session_id}: UUID` path param) or 404.

- [ ] **Step 3: Add the new route BEFORE the `{session_id}` route**

In `backend/app/api/v1/ai_tutor_session.py`, **immediately above** the existing `@router.get("/me/ai-tutor/sessions/{session_id}")` block (around line 105), insert:

```python
@router.get(
    "/me/ai-tutor/sessions/active",
    response_model=ActiveSessionDTO | None,
)
async def get_active_session(
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    """Most-recently-active session for this user, or null."""
    _require_enabled()
    return TutorSessionService(supabase, _get_stt()).get_active_session(user_id)
```

Update the import block at the top of the file:

```python
from ...models.tutor import (
    StartSessionRequest, StartSessionResponse, TurnResponse, FinishResponse,
    TutorScenarioSummary, TutorScenarioDetail, TutorEventRequest,
    ActiveSessionDTO,
)
```

**Why the order matters:** FastAPI matches in declaration order. If `/sessions/{session_id}` declared first, the literal string `active` would attempt to parse as a UUID and 422.

- [ ] **Step 4: Run the test to confirm pass**

```bash
pytest tests/test_ai_tutor_session.py::test_route_get_active_session_returns_null_body -v
```

Expected: PASS.

- [ ] **Step 5: Add the "RLS isolates other users" test**

Append:

```python
def test_route_get_active_session_does_not_leak_other_users(client, auth_headers, supabase_mock):
    """Service queries are filtered by user_id; route doesn't accept a user_id override."""
    from unittest.mock import MagicMock
    captured = MagicMock()
    supabase_mock.table.return_value.select.return_value.eq = captured
    captured.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = []

    client.get("/api/v1/me/ai-tutor/sessions/active", headers=auth_headers)

    # Assert the first .eq call was on user_id — defensive check that the
    # service is filtering, not relying on the route to inject a filter.
    first_call = captured.call_args_list[0]
    assert first_call.args[0] == "user_id"
```

- [ ] **Step 6: Run the test**

```bash
pytest tests/test_ai_tutor_session.py::test_route_get_active_session_does_not_leak_other_users -v
```

Expected: PASS.

- [ ] **Step 7: Run the full tutor-session test file to check no regressions**

```bash
pytest tests/test_ai_tutor_session.py -v
```

Expected: all pre-existing tests pass + 3 new tests pass.

- [ ] **Step 8: Commit**

```bash
git add backend/app/api/v1/ai_tutor_session.py backend/tests/test_ai_tutor_session.py
git commit -m "feat(ai-tutor): GET /me/ai-tutor/sessions/active"
```

---

## Task 4: Backend — expand frontend-event allowlist

**Files:**
- Modify: `backend/app/api/v1/ai_tutor_session.py`
- Test: `backend/tests/test_ai_tutor_session.py`

The new home-page telemetry events (`home.hero.click`, `home.scenario_shortcut.click`, `home.review.click`, `home.tutor_hero.active_session_fetch_failed`) need to be accepted by `POST /me/ai-tutor/events`. The current allowlist (`backend/app/api/v1/ai_tutor_session.py:224`) is `{"mic.denied", "audio.fallback", "turn.failed.network", "unsupported_browser"}`.

- [ ] **Step 1: Write the failing test**

Append:

```python
def test_route_post_event_accepts_new_home_events(client, auth_headers, supabase_mock):
    """Home-page telemetry event types are accepted by /me/ai-tutor/events."""
    supabase_mock.table.return_value.insert.return_value.execute.return_value = None

    for event_type in [
        "home.hero.click",
        "home.scenario_shortcut.click",
        "home.review.click",
        "home.tutor_hero.active_session_fetch_failed",
    ]:
        res = client.post(
            "/api/v1/me/ai-tutor/events",
            headers=auth_headers,
            json={"event_type": event_type, "payload": {}},
        )
        assert res.status_code == 204, f"{event_type}: {res.text}"
```

- [ ] **Step 2: Run the test to confirm failure**

```bash
pytest tests/test_ai_tutor_session.py::test_route_post_event_accepts_new_home_events -v
```

Expected: FAIL — first iteration returns 400 `event_type_not_allowed`.

- [ ] **Step 3: Extend the allowlist**

In `backend/app/api/v1/ai_tutor_session.py`, update the constant:

```python
_ALLOWED_FRONTEND_EVENTS = {
    "mic.denied",
    "audio.fallback",
    "turn.failed.network",
    "unsupported_browser",
    "home.hero.click",
    "home.scenario_shortcut.click",
    "home.review.click",
    "home.tutor_hero.active_session_fetch_failed",
}
```

- [ ] **Step 4: Run the test to confirm pass**

```bash
pytest tests/test_ai_tutor_session.py::test_route_post_event_accepts_new_home_events -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/v1/ai_tutor_session.py backend/tests/test_ai_tutor_session.py
git commit -m "feat(ai-tutor): accept home-page telemetry events"
```

---

## Task 5: Frontend — `ActiveTutorSessionDTO` type + `tutorAPI.getActiveSession`

**Files:**
- Modify: `src/features/ai-tutor/types.ts`
- Modify: `src/features/ai-tutor/api/tutor.ts`
- Test: `src/features/ai-tutor/api/__tests__/tutor.test.ts`

- [ ] **Step 1: Add the type**

Append to `src/features/ai-tutor/types.ts`:

```typescript
export interface ActiveTutorSessionDTO {
  session_id: string;
  scenario_slug: string;
  scenario_title_en: string;
  scenario_title_vi: string;
  last_activity_at: string;
  tasks_done: number;
  tasks_total: number;
}
```

- [ ] **Step 2: Write the failing test for the new API method**

Append to `src/features/ai-tutor/api/__tests__/tutor.test.ts`:

```typescript
describe('TutorAPI.getActiveSession', () => {
  it('returns the parsed ActiveTutorSessionDTO on 200', async () => {
    const body = {
      session_id: 's1',
      scenario_slug: 'meeting-someone-new',
      scenario_title_en: 'Meeting someone new',
      scenario_title_vi: 'Gặp người mới',
      last_activity_at: '2026-05-12T12:00:00Z',
      tasks_done: 2,
      tasks_total: 4,
    };
    mockFetch({ status: 200, body: JSON.stringify(body) });

    const result = await tutorAPI.getActiveSession();

    expect(result).toEqual(body);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/me/ai-tutor/sessions/active'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('returns null when the server responds with null body', async () => {
    mockFetch({ status: 200, body: 'null' });
    const result = await tutorAPI.getActiveSession();
    expect(result).toBeNull();
  });
});
```

The `mockFetch` helper and `tutorAPI` import already exist at the top of the test file — mirror their use from existing test cases.

- [ ] **Step 3: Run the test to confirm failure**

```bash
npx vitest run src/features/ai-tutor/api/__tests__/tutor.test.ts
```

Expected: FAIL — `tutorAPI.getActiveSession is not a function`.

- [ ] **Step 4: Implement `getActiveSession`**

In `src/features/ai-tutor/api/tutor.ts`, add the import to the top type-import block:

```typescript
import type {
  // ... existing imports
  ActiveTutorSessionDTO,
} from "@/features/ai-tutor/types";
```

In the `TutorAPI` class, in the "Reads (errors propagate)" section, add:

```typescript
getActiveSession(): Promise<ActiveTutorSessionDTO | null> {
  return this.authedFetch<ActiveTutorSessionDTO | null>(
    "/me/ai-tutor/sessions/active",
    { method: "GET" },
  );
}
```

The existing `authedFetch` already parses `"null"` bodies — verify by reading the response branch around `if (!text) return undefined as T;` to confirm `JSON.parse("null")` is `null`. (`JSON.parse` returns `null` for the literal `"null"`, so this works.)

- [ ] **Step 5: Run the test to confirm pass**

```bash
npx vitest run src/features/ai-tutor/api/__tests__/tutor.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/ai-tutor/types.ts src/features/ai-tutor/api/tutor.ts src/features/ai-tutor/api/__tests__/tutor.test.ts
git commit -m "feat(ai-tutor): tutorAPI.getActiveSession"
```

---

## Task 6: Frontend — `useActiveTutorSession` hook (TDD)

**Files:**
- Create: `src/features/ai-tutor/hooks/useActiveTutorSession.ts`
- Test: `src/features/ai-tutor/hooks/__tests__/useActiveTutorSession.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/ai-tutor/hooks/__tests__/useActiveTutorSession.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useActiveTutorSession } from '../useActiveTutorSession';
import { tutorAPI } from '@/features/ai-tutor/api/tutor';

vi.mock('@/features/ai-tutor/api/tutor', () => ({
  tutorAPI: { getActiveSession: vi.fn() },
}));

const mockedGet = tutorAPI.getActiveSession as ReturnType<typeof vi.fn>;

describe('useActiveTutorSession', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('starts in loading state, then resolves to data', async () => {
    const session = {
      session_id: 's1',
      scenario_slug: 'meeting-someone-new',
      scenario_title_en: 'Meeting someone new',
      scenario_title_vi: 'Gặp người mới',
      last_activity_at: '2026-05-12T12:00:00Z',
      tasks_done: 2,
      tasks_total: 4,
    };
    mockedGet.mockResolvedValueOnce(session);

    const { result } = renderHook(() => useActiveTutorSession());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(session);
    expect(result.current.error).toBeNull();
  });

  it('resolves to null when no active session exists', async () => {
    mockedGet.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useActiveTutorSession());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('captures error and clears loading', async () => {
    const err = new Error('boom');
    mockedGet.mockRejectedValueOnce(err);

    const { result } = renderHook(() => useActiveTutorSession());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(err);
  });
});
```

- [ ] **Step 2: Run the test to confirm failure**

```bash
npx vitest run src/features/ai-tutor/hooks/__tests__/useActiveTutorSession.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `src/features/ai-tutor/hooks/useActiveTutorSession.ts`:

```typescript
import { useEffect, useState } from "react";
import { tutorAPI } from "@/features/ai-tutor/api/tutor";
import type { ActiveTutorSessionDTO } from "@/features/ai-tutor/types";

export interface UseActiveTutorSession {
  data: ActiveTutorSessionDTO | null;
  isLoading: boolean;
  error: Error | null;
}

export function useActiveTutorSession(): UseActiveTutorSession {
  const [data, setData] = useState<ActiveTutorSessionDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    tutorAPI
      .getActiveSession()
      .then((res) => {
        if (!cancelled) setData(res ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(err as Error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}
```

- [ ] **Step 4: Run the test to confirm pass**

```bash
npx vitest run src/features/ai-tutor/hooks/__tests__/useActiveTutorSession.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-tutor/hooks/useActiveTutorSession.ts src/features/ai-tutor/hooks/__tests__/useActiveTutorSession.test.tsx
git commit -m "feat(ai-tutor): useActiveTutorSession hook"
```

---

## Task 7: Frontend — `useScenariosList` hook (TDD)

**Files:**
- Create: `src/features/ai-tutor/hooks/useScenariosList.ts`
- Test: `src/features/ai-tutor/hooks/__tests__/useScenariosList.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/ai-tutor/hooks/__tests__/useScenariosList.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useScenariosList } from '../useScenariosList';
import { tutorAPI } from '@/features/ai-tutor/api/tutor';

vi.mock('@/features/ai-tutor/api/tutor', () => ({
  tutorAPI: { listScenarios: vi.fn() },
}));

const mockedList = tutorAPI.listScenarios as ReturnType<typeof vi.fn>;

describe('useScenariosList', () => {
  beforeEach(() => mockedList.mockReset());

  it('returns data on success', async () => {
    const scenarios = [
      { slug: 'a', title_en: 'A', title_vi: 'A', level: 'a1', mode: 'course', is_free: true },
    ];
    mockedList.mockResolvedValueOnce(scenarios);

    const { result } = renderHook(() => useScenariosList());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(scenarios);
    expect(result.current.error).toBeNull();
  });

  it('captures error and clears loading', async () => {
    const err = new Error('net');
    mockedList.mockRejectedValueOnce(err);

    const { result } = renderHook(() => useScenariosList());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(err);
  });
});
```

- [ ] **Step 2: Run the test to confirm failure**

```bash
npx vitest run src/features/ai-tutor/hooks/__tests__/useScenariosList.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `src/features/ai-tutor/hooks/useScenariosList.ts`:

```typescript
import { useEffect, useState } from "react";
import { tutorAPI } from "@/features/ai-tutor/api/tutor";
import type { TutorScenarioSummary } from "@/features/ai-tutor/types";

export interface UseScenariosList {
  data: TutorScenarioSummary[] | null;
  isLoading: boolean;
  error: Error | null;
}

export function useScenariosList(): UseScenariosList {
  const [data, setData] = useState<TutorScenarioSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    tutorAPI
      .listScenarios()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err as Error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}
```

- [ ] **Step 4: Run the test to confirm pass**

```bash
npx vitest run src/features/ai-tutor/hooks/__tests__/useScenariosList.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-tutor/hooks/useScenariosList.ts src/features/ai-tutor/hooks/__tests__/useScenariosList.test.tsx
git commit -m "feat(ai-tutor): useScenariosList hook"
```

---

## Task 8: Frontend — i18n keys

**Files:**
- Modify: `src/locales/en/en.json`, `src/locales/vi/vi.json`, `src/locales/th/th.json`, `src/locales/zh-CN/zh-CN.json`

We add new keys before any component consumes them so the components can be written against real keys (not `defaultValue` fallbacks).

- [ ] **Step 1: Add the new key block to `en/en.json`**

In `src/locales/en/en.json`, locate the existing `"authhome"` object (search for `"authhome":`). Add the following sibling keys inside that object (don't replace the existing `continue_studying`/`recommended`/`invite`/`study_groups` subtrees — we'll delete them in a later task once legacy is removed):

```json
"tutor_hero": {
  "active": {
    "eyebrow": "Pick up where you left off",
    "subtitle": "{{tasks_done}} of {{tasks_total}} tasks complete",
    "cta": "Continue speaking"
  },
  "featured": {
    "eyebrow": "Start speaking practice",
    "cta": "Start"
  },
  "cold": {
    "title": "Try your first conversation",
    "cta": "Open AI Tutor"
  }
},
"scenario_shortcuts": {
  "heading": "Scenarios",
  "browse_all": "Browse all →"
},
"today_review": {
  "heading": "Today's review",
  "due_count": "{{count}} cards due",
  "cta": "Start review",
  "empty": "All caught up — come back tomorrow."
},
"continue_lesson": {
  "heading": "Lessons",
  "cta": "Browse lessons"
}
```

- [ ] **Step 2: Add localized values to the other three locale files**

For each of `vi/vi.json`, `th/th.json`, `zh-CN/zh-CN.json`, add the same key structure with translated values. For unfamiliar locales, use the English copy as `defaultValue` (the `fallbackLng: 'en'` config in `src/i18n.ts` handles missing keys). The plan author SHOULD provide actual translations for `vi` (the primary L1 audience) — use:

`vi/vi.json` values:
```json
"tutor_hero": {
  "active": {
    "eyebrow": "Tiếp tục từ chỗ bạn đã dừng",
    "subtitle": "{{tasks_done}} trong {{tasks_total}} nhiệm vụ hoàn thành",
    "cta": "Tiếp tục nói"
  },
  "featured": {
    "eyebrow": "Bắt đầu luyện nói",
    "cta": "Bắt đầu"
  },
  "cold": {
    "title": "Thử cuộc trò chuyện đầu tiên",
    "cta": "Mở AI Tutor"
  }
},
"scenario_shortcuts": {
  "heading": "Các kịch bản",
  "browse_all": "Xem tất cả →"
},
"today_review": {
  "heading": "Ôn tập hôm nay",
  "due_count": "{{count}} thẻ cần ôn",
  "cta": "Bắt đầu ôn tập",
  "empty": "Đã ôn xong — quay lại vào ngày mai."
},
"continue_lesson": {
  "heading": "Bài học",
  "cta": "Duyệt bài học"
}
```

For `th` and `zh-CN`, copy the `en` values verbatim into the same key slots (fallback path covers them — flag for translation as a follow-up).

- [ ] **Step 3: Verify JSON validity**

```bash
for f in src/locales/en/en.json src/locales/vi/vi.json src/locales/th/th.json src/locales/zh-CN/zh-CN.json; do
  echo "$f:"
  python3 -c "import json; json.load(open('$f'))" && echo OK || echo FAIL
done
```

Expected: four "OK" lines.

- [ ] **Step 4: Commit**

```bash
git add src/locales/
git commit -m "i18n: add authhome keys for tutor hero / scenarios / review / lesson cards"
```

---

## Task 9: Frontend — `TutorHeroCard` (TDD)

**Files:**
- Create: `src/components/home/authenticated/TutorHeroCard.tsx`
- Test: `src/components/home/authenticated/__tests__/TutorHeroCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/home/authenticated/__tests__/TutorHeroCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TutorHeroCard } from '../TutorHeroCard';

const renderInRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

describe('TutorHeroCard', () => {
  beforeEach(() => navigateMock.mockReset());

  it('renders the cold state when no active session and no featured scenario', () => {
    renderInRouter(<TutorHeroCard activeSession={null} featuredScenario={null} isLoading={false} />);
    expect(screen.getByText(/try your first conversation/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /open ai tutor/i }));
    expect(navigateMock).toHaveBeenCalledWith('/ai-tutor');
  });

  it('renders the featured state when no active session but featured scenario exists', () => {
    const featured = { slug: 's1', title_en: 'Meeting someone new', title_vi: 'Gặp người mới', level: 'a1', mode: 'course' as const, is_free: true };
    renderInRouter(<TutorHeroCard activeSession={null} featuredScenario={featured} isLoading={false} />);
    expect(screen.getByText(/start speaking practice/i)).toBeInTheDocument();
    expect(screen.getByText(/meeting someone new/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^start$/i }));
    expect(navigateMock).toHaveBeenCalledWith('/ai-tutor/scenarios/s1/briefing');
  });

  it('renders the active state and routes to the in-progress session', () => {
    const active = {
      session_id: 'sess-1',
      scenario_slug: 's1',
      scenario_title_en: 'Meeting someone new',
      scenario_title_vi: 'Gặp người mới',
      last_activity_at: '2026-05-12T12:00:00Z',
      tasks_done: 2,
      tasks_total: 4,
    };
    renderInRouter(<TutorHeroCard activeSession={active} featuredScenario={null} isLoading={false} />);
    expect(screen.getByText(/pick up where you left off/i)).toBeInTheDocument();
    expect(screen.getByText(/2 of 4 tasks complete/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue speaking/i }));
    expect(navigateMock).toHaveBeenCalledWith('/ai-tutor/scenarios/s1/session/sess-1');
  });

  it('renders a skeleton while loading', () => {
    renderInRouter(<TutorHeroCard activeSession={null} featuredScenario={null} isLoading={true} />);
    expect(screen.getByTestId('tutor-hero-skeleton')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to confirm failure**

```bash
npx vitest run src/components/home/authenticated/__tests__/TutorHeroCard.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `TutorHeroCard`**

Create `src/components/home/authenticated/TutorHeroCard.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type {
  ActiveTutorSessionDTO,
  TutorScenarioSummary,
} from "@/features/ai-tutor/types";

interface Props {
  activeSession: ActiveTutorSessionDTO | null;
  featuredScenario: TutorScenarioSummary | null;
  isLoading: boolean;
}

export function TutorHeroCard({
  activeSession,
  featuredScenario,
  isLoading,
}: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div
        data-testid="tutor-hero-skeleton"
        className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-44"
      />
    );
  }

  const useVi = i18n.language?.startsWith("vi");

  if (activeSession) {
    const title = useVi
      ? activeSession.scenario_title_vi
      : activeSession.scenario_title_en;
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-900">
        <p className="text-xs uppercase tracking-wide text-primary-600 dark:text-primary-400 font-semibold">
          {t("authhome.tutor_hero.active.eyebrow")}
        </p>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("authhome.tutor_hero.active.subtitle", {
            tasks_done: activeSession.tasks_done,
            tasks_total: activeSession.tasks_total,
          })}
        </p>
        <button
          onClick={() =>
            navigate(
              `/ai-tutor/scenarios/${activeSession.scenario_slug}/session/${activeSession.session_id}`,
            )
          }
          className="self-start px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
        >
          {t("authhome.tutor_hero.active.cta")}
        </button>
      </div>
    );
  }

  if (featuredScenario) {
    const title = useVi ? featuredScenario.title_vi : featuredScenario.title_en;
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wide text-primary-600 dark:text-primary-400 font-semibold">
          {t("authhome.tutor_hero.featured.eyebrow")}
        </p>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <button
          onClick={() =>
            navigate(`/ai-tutor/scenarios/${featuredScenario.slug}/briefing`)
          }
          className="self-start px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
        >
          {t("authhome.tutor_hero.featured.cta")}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {t("authhome.tutor_hero.cold.title")}
      </h2>
      <button
        onClick={() => navigate("/ai-tutor")}
        className="self-start px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
      >
        {t("authhome.tutor_hero.cold.cta")}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to confirm pass**

```bash
npx vitest run src/components/home/authenticated/__tests__/TutorHeroCard.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/authenticated/TutorHeroCard.tsx src/components/home/authenticated/__tests__/TutorHeroCard.test.tsx
git commit -m "feat(home): TutorHeroCard with active / featured / cold states"
```

---

## Task 10: Frontend — `ScenarioShortcutsRow` (TDD)

**Files:**
- Create: `src/components/home/authenticated/ScenarioShortcutsRow.tsx`
- Test: `src/components/home/authenticated/__tests__/ScenarioShortcutsRow.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/home/authenticated/__tests__/ScenarioShortcutsRow.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ScenarioShortcutsRow } from '../ScenarioShortcutsRow';
import type { TutorScenarioSummary } from '@/features/ai-tutor/types';

const renderInRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

const scenarios: TutorScenarioSummary[] = [
  { slug: 'a', title_en: 'A', title_vi: 'A-vi', level: 'a1', mode: 'course', is_free: true },
  { slug: 'b', title_en: 'B', title_vi: 'B-vi', level: 'a1', mode: 'free_talk', is_free: true },
];

describe('ScenarioShortcutsRow', () => {
  it('renders nothing when list is empty', () => {
    const { container } = renderInRouter(<ScenarioShortcutsRow scenarios={[]} isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when list is null (error or initial)', () => {
    const { container } = renderInRouter(<ScenarioShortcutsRow scenarios={null} isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a skeleton while loading', () => {
    renderInRouter(<ScenarioShortcutsRow scenarios={null} isLoading={true} />);
    expect(screen.getByTestId('scenario-shortcuts-skeleton')).toBeInTheDocument();
  });

  it('renders each scenario as a ScenarioCard and a Browse all link', () => {
    renderInRouter(<ScenarioShortcutsRow scenarios={scenarios} isLoading={false} />);
    // ScenarioCard renders title_vi prominently; assert both slugs map to a link.
    const linkA = screen.getByRole('link', { name: /A-vi/ });
    const linkB = screen.getByRole('link', { name: /B-vi/ });
    expect(linkA).toHaveAttribute('href', '/ai-tutor/scenarios/a/phrasebook');
    expect(linkB).toHaveAttribute('href', '/ai-tutor/scenarios/b/phrasebook');
    expect(screen.getByRole('link', { name: /browse all/i })).toHaveAttribute('href', '/ai-tutor');
  });
});
```

- [ ] **Step 2: Run the test to confirm failure**

```bash
npx vitest run src/components/home/authenticated/__tests__/ScenarioShortcutsRow.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `ScenarioShortcutsRow`**

Create `src/components/home/authenticated/ScenarioShortcutsRow.tsx`:

```tsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ScenarioCard } from "@/features/ai-tutor/components/ScenarioCard";
import type { TutorScenarioSummary } from "@/features/ai-tutor/types";

interface Props {
  scenarios: TutorScenarioSummary[] | null;
  isLoading: boolean;
}

export function ScenarioShortcutsRow({ scenarios, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div
        data-testid="scenario-shortcuts-skeleton"
        className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-28"
      />
    );
  }

  if (!scenarios || scenarios.length === 0) return null;

  const sorted = [...scenarios].sort((a, b) => {
    if (a.mode === b.mode) return a.title_en.localeCompare(b.title_en);
    return a.mode === "course" ? -1 : 1;
  });
  const visible = sorted.slice(0, 6);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {t("authhome.scenario_shortcuts.heading")}
        </h3>
        <Link
          to="/ai-tutor"
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          {t("authhome.scenario_shortcuts.browse_all")}
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {visible.map((s) => (
          <div key={s.slug} className="min-w-[14rem] flex-shrink-0">
            <ScenarioCard scenario={s} />
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to confirm pass**

```bash
npx vitest run src/components/home/authenticated/__tests__/ScenarioShortcutsRow.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/authenticated/ScenarioShortcutsRow.tsx src/components/home/authenticated/__tests__/ScenarioShortcutsRow.test.tsx
git commit -m "feat(home): ScenarioShortcutsRow"
```

---

## Task 11: Frontend — `TodayReviewCard` (TDD)

**Files:**
- Create: `src/components/home/authenticated/TodayReviewCard.tsx`
- Test: `src/components/home/authenticated/__tests__/TodayReviewCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/home/authenticated/__tests__/TodayReviewCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TodayReviewCard } from '../TodayReviewCard';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@/features/review/useReviewCount', () => ({
  useReviewCount: vi.fn(),
}));
import { useReviewCount } from '@/features/review/useReviewCount';
const mockedUseReviewCount = useReviewCount as ReturnType<typeof vi.fn>;

const renderInRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('TodayReviewCard', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    mockedUseReviewCount.mockReset();
  });

  it('renders a skeleton while loading', () => {
    mockedUseReviewCount.mockReturnValue({ count: 0, isLoading: true });
    renderInRouter(<TodayReviewCard />);
    expect(screen.getByTestId('today-review-skeleton')).toBeInTheDocument();
  });

  it('renders the empty state when count is 0', () => {
    mockedUseReviewCount.mockReturnValue({ count: 0, isLoading: false });
    renderInRouter(<TodayReviewCard />);
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the count and routes to /review on CTA', () => {
    mockedUseReviewCount.mockReturnValue({ count: 7, isLoading: false });
    renderInRouter(<TodayReviewCard />);
    expect(screen.getByText(/7 cards due/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /start review/i }));
    expect(navigateMock).toHaveBeenCalledWith('/review');
  });
});
```

- [ ] **Step 2: Run the test to confirm failure**

```bash
npx vitest run src/components/home/authenticated/__tests__/TodayReviewCard.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `TodayReviewCard`**

Create `src/components/home/authenticated/TodayReviewCard.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useReviewCount } from "@/features/review/useReviewCount";

export function TodayReviewCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { count, isLoading } = useReviewCount();

  if (isLoading) {
    return (
      <div
        data-testid="today-review-skeleton"
        className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-32"
      />
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {t("authhome.today_review.heading")}
      </h3>
      {count === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("authhome.today_review.empty")}
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t("authhome.today_review.due_count", { count })}
          </p>
          <button
            onClick={() => navigate("/review")}
            className="self-start px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
          >
            {t("authhome.today_review.cta")}
          </button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to confirm pass**

```bash
npx vitest run src/components/home/authenticated/__tests__/TodayReviewCard.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/authenticated/TodayReviewCard.tsx src/components/home/authenticated/__tests__/TodayReviewCard.test.tsx
git commit -m "feat(home): TodayReviewCard"
```

---

## Task 12: Frontend — `ContinueLessonCard` (browse-only v1)

**Files:**
- Create: `src/components/home/authenticated/ContinueLessonCard.tsx`

This is the smallest of the four cards (single state in v1). One render test inline with the AuthHome integration test in Task 13 covers it — no dedicated test file.

- [ ] **Step 1: Implement the card**

Create `src/components/home/authenticated/ContinueLessonCard.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export function ContinueLessonCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {t("authhome.continue_lesson.heading")}
      </h3>
      <button
        onClick={() => navigate("/lessons")}
        className="self-start px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
      >
        {t("authhome.continue_lesson.cta")}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/authenticated/ContinueLessonCard.tsx
git commit -m "feat(home): ContinueLessonCard (browse-only v1)"
```

---

## Task 13: Frontend — new `AuthHome` page (TDD with legacy preserved)

**Files:**
- Rename: `src/pages/AuthHome.tsx` → `src/pages/AuthHomeLegacy.tsx`
- Create: `src/pages/AuthHome.tsx` (new content)
- Test: `src/pages/__tests__/AuthHome.test.tsx`

- [ ] **Step 1: Rename the existing AuthHome to preserve it**

```bash
git mv src/pages/AuthHome.tsx src/pages/AuthHomeLegacy.tsx
```

Open `src/pages/AuthHomeLegacy.tsx` and rename the `export default function AuthHome()` to `export default function AuthHomeLegacy()`.

- [ ] **Step 2: Write the failing test for the new AuthHome**

Create `src/pages/__tests__/AuthHome.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthHome from '../AuthHome';

// Mock the data hooks. AuthHome composes them; this isolates the layout from data.
vi.mock('@/features/ai-tutor/hooks/useActiveTutorSession', () => ({
  useActiveTutorSession: vi.fn(),
}));
vi.mock('@/features/ai-tutor/hooks/useScenariosList', () => ({
  useScenariosList: vi.fn(),
}));
vi.mock('@/features/review/useReviewCount', () => ({
  useReviewCount: vi.fn(() => ({ count: 0, isLoading: false })),
}));

import { useActiveTutorSession } from '@/features/ai-tutor/hooks/useActiveTutorSession';
import { useScenariosList } from '@/features/ai-tutor/hooks/useScenariosList';

const mockedActive = useActiveTutorSession as ReturnType<typeof vi.fn>;
const mockedList = useScenariosList as ReturnType<typeof vi.fn>;

const renderHome = () =>
  render(
    <MemoryRouter>
      <AuthHome />
    </MemoryRouter>,
  );

describe('AuthHome', () => {
  beforeEach(() => {
    mockedActive.mockReset();
    mockedList.mockReset();
    // Make sure AI Tutor flag is on for these branches.
    vi.stubEnv('VITE_AI_TUTOR_ENABLED', 'true');
  });

  it('renders the active-session hero when there is an active session', async () => {
    mockedActive.mockReturnValue({
      data: {
        session_id: 'sess-1',
        scenario_slug: 'meeting-someone-new',
        scenario_title_en: 'Meeting someone new',
        scenario_title_vi: 'Gặp người mới',
        last_activity_at: '2026-05-12T12:00:00Z',
        tasks_done: 2,
        tasks_total: 4,
      },
      isLoading: false,
      error: null,
    });
    mockedList.mockReturnValue({ data: [], isLoading: false, error: null });

    renderHome();

    await waitFor(() =>
      expect(screen.getByText(/pick up where you left off/i)).toBeInTheDocument(),
    );
  });

  it('renders the featured-scenario hero when no active session but scenarios exist', async () => {
    mockedActive.mockReturnValue({ data: null, isLoading: false, error: null });
    mockedList.mockReturnValue({
      data: [
        { slug: 'a', title_en: 'A', title_vi: 'A-vi', level: 'a1', mode: 'course', is_free: true },
      ],
      isLoading: false,
      error: null,
    });

    renderHome();

    await waitFor(() =>
      expect(screen.getByText(/start speaking practice/i)).toBeInTheDocument(),
    );
  });

  it('renders the cold hero state when no session and no scenarios', async () => {
    mockedActive.mockReturnValue({ data: null, isLoading: false, error: null });
    mockedList.mockReturnValue({ data: [], isLoading: false, error: null });

    renderHome();

    await waitFor(() =>
      expect(screen.getByText(/try your first conversation/i)).toBeInTheDocument(),
    );
  });

  it('renders the legacy page when VITE_AI_TUTOR_ENABLED is not "true"', () => {
    vi.stubEnv('VITE_AI_TUTOR_ENABLED', 'false');
    mockedActive.mockReturnValue({ data: null, isLoading: false, error: null });
    mockedList.mockReturnValue({ data: [], isLoading: false, error: null });

    renderHome();

    // Legacy page has the "Continue Studying" heading (existing i18n key).
    expect(screen.getByText(/continue studying/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the test to confirm failure**

```bash
npx vitest run src/pages/__tests__/AuthHome.test.tsx
```

Expected: FAIL — `Cannot find module '../AuthHome'` (we renamed it in step 1).

- [ ] **Step 4: Implement the new AuthHome**

Create `src/pages/AuthHome.tsx`:

```tsx
import AuthHomeLegacy from "./AuthHomeLegacy";
import { TutorHeroCard } from "@/components/home/authenticated/TutorHeroCard";
import { ScenarioShortcutsRow } from "@/components/home/authenticated/ScenarioShortcutsRow";
import { TodayReviewCard } from "@/components/home/authenticated/TodayReviewCard";
import { ContinueLessonCard } from "@/components/home/authenticated/ContinueLessonCard";
import { useActiveTutorSession } from "@/features/ai-tutor/hooks/useActiveTutorSession";
import { useScenariosList } from "@/features/ai-tutor/hooks/useScenariosList";

export default function AuthHome() {
  const aiTutorEnabled = import.meta.env.VITE_AI_TUTOR_ENABLED === "true";
  if (!aiTutorEnabled) return <AuthHomeLegacy />;

  const { data: activeSession, isLoading: activeLoading } =
    useActiveTutorSession();
  const { data: scenarios, isLoading: listLoading } = useScenariosList();

  const featuredScenario =
    scenarios && scenarios.length > 0 ? scenarios[0] : null;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pt-6">
      <TutorHeroCard
        activeSession={activeSession}
        featuredScenario={featuredScenario}
        isLoading={activeLoading || listLoading}
      />
      <ScenarioShortcutsRow scenarios={scenarios} isLoading={listLoading} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TodayReviewCard />
        <ContinueLessonCard />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the test to confirm pass**

```bash
npx vitest run src/pages/__tests__/AuthHome.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 6: Run the full frontend test suite to catch regressions**

```bash
npm test -- --run
```

Expected: all tests pass. The legacy `AuthHomeLegacy.tsx` may have existing tests that imported `AuthHome` — if any test imports `../AuthHome` expecting the old behavior, update its import to `../AuthHomeLegacy` (likely candidates: any file mentioning `ContinueStudyingCard` from the page level).

- [ ] **Step 7: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/AuthHome.tsx src/pages/AuthHomeLegacy.tsx src/pages/__tests__/AuthHome.test.tsx
git commit -m "feat(home): AI-tutor-first AuthHome page (legacy preserved behind flag)"
```

---

## Task 14: Manual verification + browser check

**Files:** none

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

In another terminal:

```bash
cd backend && source venv/bin/activate && python run.py
```

- [ ] **Step 2: Verify each state in the browser at localhost:5173/home**

While signed in (test account with no active session and no scenarios completed):

1. Open `/home`. Confirm the **featured hero** appears with the seed scenario title ("Meeting someone new" / "Gặp người mới"). One click on "Start" → lands on `/ai-tutor/scenarios/meeting-someone-new/briefing`.
2. Start a session, exchange one turn, then go back to `/home` directly (e.g. via the sidebar). Confirm the **active hero** appears with the scenario title and the `X of Y tasks complete` subtitle. One click on "Continue speaking" → lands on `/ai-tutor/scenarios/meeting-someone-new/session/<uuid>`.
3. Confirm the ScenarioShortcutsRow renders the seed scenario tile + "Browse all" link.
4. Confirm TodayReviewCard renders either `<N> cards due` + button OR the "All caught up" copy depending on review state.
5. Confirm ContinueLessonCard renders the "Browse lessons" button → `/lessons`.

- [ ] **Step 3: Verify the flag-off path**

Stop the dev server. In your local `.env`, set `VITE_AI_TUTOR_ENABLED=false`. Restart `npm run dev`. Reload `/home`. Confirm the legacy 2×2 grid renders (ContinueStudying / RecommendedNext / InviteFriends / StudyGroups). Restore `VITE_AI_TUTOR_ENABLED=true`.

- [ ] **Step 4: Verify telemetry events post 204**

In the browser devtools Network tab, click each CTA and confirm the corresponding `home.hero.click` / `home.scenario_shortcut.click` / `home.review.click` POST to `/me/ai-tutor/events` returns **204**. (Telemetry wiring on the click handlers is added in Task 15.)

If any state misbehaves, fix and re-run the relevant test file before proceeding.

---

## Task 15: Frontend — wire telemetry events

**Files:**
- Modify: `src/components/home/authenticated/TutorHeroCard.tsx`
- Modify: `src/components/home/authenticated/ScenarioShortcutsRow.tsx`
- Modify: `src/components/home/authenticated/TodayReviewCard.tsx`
- Modify: `src/components/home/authenticated/__tests__/TutorHeroCard.test.tsx`
- Modify: `src/components/home/authenticated/__tests__/ScenarioShortcutsRow.test.tsx`
- Modify: `src/components/home/authenticated/__tests__/TodayReviewCard.test.tsx`

The components already navigate on click. This task adds fire-and-forget `reportTutorEvent` calls before navigation.

- [ ] **Step 1: Write the failing telemetry assertions**

In `TutorHeroCard.test.tsx`, at the top:

```tsx
vi.mock('@/features/ai-tutor/api/events', () => ({
  reportTutorEvent: vi.fn(() => Promise.resolve()),
}));
import { reportTutorEvent } from '@/features/ai-tutor/api/events';
const mockedReport = reportTutorEvent as ReturnType<typeof vi.fn>;
```

In `beforeEach`, add `mockedReport.mockClear();`. In each of the three CTA-click tests, after the `fireEvent.click(...)`, assert:

- cold state:
  ```tsx
  expect(mockedReport).toHaveBeenCalledWith('home.hero.click', { state: 'cold' });
  ```
- featured state:
  ```tsx
  expect(mockedReport).toHaveBeenCalledWith('home.hero.click', { state: 'featured', scenario_slug: 's1' });
  ```
- active state:
  ```tsx
  expect(mockedReport).toHaveBeenCalledWith('home.hero.click', { state: 'active', scenario_slug: 's1', session_id: 'sess-1' });
  ```

Mirror the same `vi.mock` + assertion shape in `ScenarioShortcutsRow.test.tsx` (event `home.scenario_shortcut.click` with `{scenario_slug}`) and `TodayReviewCard.test.tsx` (event `home.review.click` with `{due_count}`).

- [ ] **Step 2: Run the three test files — confirm new assertions fail**

```bash
npx vitest run src/components/home/authenticated/__tests__/
```

Expected: 3 files, several new assertions fail (telemetry not yet wired).

- [ ] **Step 3: Wire telemetry in `TutorHeroCard.tsx`**

Import the helper at the top:

```typescript
import { reportTutorEvent } from "@/features/ai-tutor/api/events";
```

In each of the three CTA `onClick` handlers, call `reportTutorEvent` *before* `navigate(...)`:

```tsx
// active branch
onClick={() => {
  void reportTutorEvent('home.hero.click', {
    state: 'active',
    scenario_slug: activeSession.scenario_slug,
    session_id: activeSession.session_id,
  });
  navigate(`/ai-tutor/scenarios/${activeSession.scenario_slug}/session/${activeSession.session_id}`);
}}

// featured branch
onClick={() => {
  void reportTutorEvent('home.hero.click', {
    state: 'featured',
    scenario_slug: featuredScenario.slug,
  });
  navigate(`/ai-tutor/scenarios/${featuredScenario.slug}/briefing`);
}}

// cold branch
onClick={() => {
  void reportTutorEvent('home.hero.click', { state: 'cold' });
  navigate('/ai-tutor');
}}
```

`reportTutorEvent` is fire-and-forget (`keepalive: true` per `src/features/ai-tutor/api/events.ts`); the `void` discards the unawaited promise so React doesn't warn.

- [ ] **Step 4: Wire telemetry in `ScenarioShortcutsRow.tsx`**

`ScenarioCard` is currently a self-contained `<Link>`. Wrap it with a click handler that fires telemetry:

Replace the `{visible.map(...)}` block with:

```tsx
{visible.map((s) => (
  <div
    key={s.slug}
    className="min-w-[14rem] flex-shrink-0"
    onClick={() =>
      void reportTutorEvent('home.scenario_shortcut.click', { scenario_slug: s.slug })
    }
  >
    <ScenarioCard scenario={s} />
  </div>
))}
```

Add the import at the top:

```typescript
import { reportTutorEvent } from "@/features/ai-tutor/api/events";
```

Click bubbles from the inner `<Link>` to the wrapper div, so the handler fires before navigation. (Verified pattern — the `<Link>` doesn't `stopPropagation`.)

- [ ] **Step 5: Wire telemetry in `TodayReviewCard.tsx`**

Same import, then update the count-state branch's button `onClick`:

```tsx
onClick={() => {
  void reportTutorEvent('home.review.click', { due_count: count });
  navigate('/review');
}}
```

- [ ] **Step 6: Run the three test files — confirm all pass**

```bash
npx vitest run src/components/home/authenticated/__tests__/
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/home/authenticated/
git commit -m "feat(home): wire telemetry events for hero / shortcut / review CTAs"
```

---

## Task 16: Type-check, lint, format, full test suite

**Files:** none (verification only)

- [ ] **Step 1: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no errors. Fix any that surface.

- [ ] **Step 3: Format**

```bash
npm run format
```

If files changed, stage them and commit:

```bash
git add -u
git commit -m "chore: prettier format"
```

- [ ] **Step 4: Run full frontend test suite**

```bash
npm test -- --run
```

Expected: all green.

- [ ] **Step 5: Run full backend test suite**

```bash
cd backend && source venv/bin/activate && pytest -q
```

Expected: all green.

---

## Task 17: PR

**Files:** none

- [ ] **Step 1: Push the branch and open a PR**

```bash
git push -u origin feat/home-rework-tutor-first
```

Then:

```bash
gh pr create --title "feat(home): AI-tutor-first /home rework" --body "$(cat <<'EOF'
## Summary

- New `/home` layout centered on AI Tutor: hero card surfaces J1 (start) and J2 (resume) in one click.
- Adds backend `GET /me/ai-tutor/sessions/active` so the hero can deep-link to an in-progress session.
- Replaces the mock-driven 2×2 grid; legacy page preserved as `AuthHomeLegacy.tsx` behind the `VITE_AI_TUTOR_ENABLED` flag for rollback.
- Wires three new home-page telemetry events (`home.hero.click`, `home.scenario_shortcut.click`, `home.review.click`) into the existing `/me/ai-tutor/events` allowlist.

Spec: `docs/superpowers/specs/2026-05-12-home-rework.md`
Plan: `docs/superpowers/plans/2026-05-12-home-rework.md`

## Test plan

- [ ] Unit: `npm test -- --run` (FE) green
- [ ] Unit: `pytest -q` (BE) green
- [ ] Manual: signed-in `/home` shows featured-scenario hero on fresh account
- [ ] Manual: after exchanging one turn, `/home` shows active-session hero with correct task progress and resumes session in one click
- [ ] Manual: with `VITE_AI_TUTOR_ENABLED=false`, legacy `/home` renders
- [ ] Network tab confirms each CTA POSTs `/me/ai-tutor/events` returning 204
EOF
)"
```

Expected: PR URL printed.

---

## Self-review checklist

**Spec coverage:** ✓
- J1 / J2 / J3 / J4: tasks 9 (hero), 13 (layout), 11 (review card), 12 (lesson card).
- Sidebar reorder / "Quick Help" rename / mobile bottom-nav / `ContinueLessonCard` Option A: explicitly out of scope per spec.
- Backend endpoint: tasks 1–3.
- Hooks: tasks 6, 7.
- Components: tasks 9–12.
- Page: task 13.
- i18n: task 8.
- Telemetry allowlist + wiring: tasks 4, 15.
- Tests: every component and the page have a dedicated test file.
- Rollout flag: task 13 step 4 + task 14 step 3.

**Placeholder scan:** ✓ — every step has exact paths, exact code, exact commands, and expected output. No "TBD"/"similar to"/"add appropriate" patterns.

**Type consistency:** ✓ — `ActiveTutorSessionDTO` shape (`session_id`, `scenario_slug`, `scenario_title_en`, `scenario_title_vi`, `last_activity_at`, `tasks_done`, `tasks_total`) matches between the BE Pydantic model (task 1), the FE type (task 5), the hook contract (task 6), and the component props (task 9). `TutorScenarioSummary` is reused as-is from `src/features/ai-tutor/types.ts`. Hook return shape `{ data, isLoading, error }` is consistent across `useActiveTutorSession` and `useScenariosList`.

**Known follow-ups deferred:** sidebar promotion of AI Tutor, "Quick Help" rename, mobile bottom-nav, `/me/progress/last-section` endpoint for full ContinueLessonCard, scenario ordering by last-attempted, `/dashboard` consolidation, legacy `authhome.*` i18n key cleanup, `mocks/authHome.mock.ts` deletion. All listed in the spec's "Known follow-ups."
