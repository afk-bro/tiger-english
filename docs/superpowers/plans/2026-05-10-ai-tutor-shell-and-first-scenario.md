# AI Tutor Shell + First Scenario Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the AI Tutor navigation shell + one polished end-to-end scenario ("Meeting someone new" / "Gặp người mới") behind a feature flag, with Groq STT, pre-generated TTS playback, browser SpeechSynthesis fallback, and a rule-based task evaluator. No LLM calls in this rollout.

**Architecture:** New `/ai-tutor/*` route tree under a fresh `TutorLayout` (top tabs + persistent footer nav), backed by a new FastAPI router (`/api/v1/ai-tutor/*` and `/api/v1/me/ai-tutor/*`) that wraps a Groq Whisper STT adapter, a deterministic rule-based evaluator, and three transactional Postgres functions (`start_tutor_session_tx`, `record_tutor_exchange_tx`, `complete_tutor_session_tx`). Single-scenario seed; XP/streak flow through existing `user_stats` + `user_activity_log`.

**Tech Stack:** Frontend — React 19, TypeScript, Vite, Tailwind, react-i18next, react-router v7, MediaRecorder + Web Audio APIs. Backend — FastAPI, Pydantic, Supabase (Postgres + Auth + Storage), Groq Whisper API. Tests — pytest (backend), Vitest + Testing Library (frontend), Playwright (e2e). Content scripts — TypeScript via tsx, ElevenLabs (free tier) for the seed audio.

**Source spec:** `docs/superpowers/specs/2026-05-10-ai-tutor-shell-and-first-scenario-design.md`

---

## Phase 1 — Database migration, storage bucket, seed content

**Files:**
- Create: `supabase/migrations/20260510000001_ai_tutor_schema.sql`
- Create: `supabase/migrations/20260510000002_ai_tutor_audio_bucket.sql`
- Create: `supabase/migrations/20260510000003_ai_tutor_seed_meeting_someone_new.sql`
- Modify: `src/lib/database.types.ts` (regenerate after migration)

### Task 1.1: Create the schema migration

- [ ] **Step 1: Create the migration file** at `supabase/migrations/20260510000001_ai_tutor_schema.sql` with the full schema from spec §5. Include: 5 new tables (`ai_tutor_scenarios`, `ai_tutor_scenario_tasks`, `ai_tutor_scenario_phrases`, `ai_tutor_sessions`, `ai_tutor_turns`, `ai_tutor_events`), the partial unique index `ai_tutor_sessions_user_scenario_active`, the `ai_tutor_turns_session` index, and the two `ai_tutor_events_*_recent` indexes. **Do NOT create `ai_tutor_review_items` — that is deferred to Spec 3.**

- [ ] **Step 2: Add RLS policies** at the bottom of the same file:

```sql
ALTER TABLE ai_tutor_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_scenario_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_scenario_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_scenarios" ON ai_tutor_scenarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_tasks" ON ai_tutor_scenario_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_phrases" ON ai_tutor_scenario_phrases FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_select_own_sessions" ON ai_tutor_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_select_own_turns" ON ai_tutor_turns FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- ai_tutor_events: no SELECT policy — diagnostic only

GRANT SELECT ON ai_tutor_scenarios, ai_tutor_scenario_tasks, ai_tutor_scenario_phrases TO authenticated;
GRANT SELECT ON ai_tutor_sessions, ai_tutor_turns TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
```

- [ ] **Step 3: Add the `tutor_session_completed` and `tutor_task_completed` event types to `user_activity_log`.** Inspect the existing constraint in `supabase/migrations/20260503000001_phase1_progress_tracking.sql` first. If it's a CHECK with an enum-style list, drop and recreate the CHECK to include the new values. If it's an enum type, `ALTER TYPE … ADD VALUE`. Use whichever pattern matches. Document the choice with a SQL comment.

- [ ] **Step 4: Apply the migration locally.**

Run: `supabase db reset` (clean slate) **or** `supabase migration up` (incremental).
Expected: completes without errors. Verify `\dt ai_tutor_*` shows all 6 tables.

- [ ] **Step 5: Commit.**

```bash
git add supabase/migrations/20260510000001_ai_tutor_schema.sql
git commit -m "feat(db): ai_tutor_* schema + RLS for scenarios, sessions, turns, events"
```

### Task 1.2: Create the four transactional functions

- [ ] **Step 1: In the same migration (or a follow-up `…_functions.sql`)**, create `start_tutor_session_tx(_user_id uuid, _scenario_id uuid, _mode text) RETURNS uuid` per spec §5. Behavior contract:
  - `_mode='continue'`: SELECT existing active session for `(user_id, scenario_id)`; if found, return its id; else create new active session (current_task_id = first task by sort_order) and INSERT `ai_tutor_events('session.started', {...})`.
  - `_mode='fresh'`: if existing active session, UPDATE its status to `'abandoned'` AND INSERT `ai_tutor_events('session.abandoned', {reason:'started_fresh'})`; then create new active session and INSERT `ai_tutor_events('session.started', {...})`.
  - All branches inside `BEGIN ... END`.

- [ ] **Step 2: Create `record_tutor_exchange_tx(...)`** with the full 11-arg signature from spec §5. Inside the function: read `current_task_id` from session row first, INSERT user turn (with `task_id = current_task_id`), conditionally INSERT AI turn, conditionally UPDATE session.completed_task_ids/current_task_id, conditionally INSERT user_activity_log row, conditionally bump mistake_count, always update `last_activity_at`.

- [ ] **Step 3: Create `complete_tutor_session_tx(_session_id uuid, _xp_awarded int)`** per spec §5. Reads scenario_slug + tasks_completed + mistake_count + duration from session row, UPDATEs session, increments `user_stats.xp`, INSERTs activity log row.

- [ ] **Step 4: Create `abandon_tutor_session_tx(_session_id uuid, _reason text)`.**

- [ ] **Step 5: Lock down the functions.**

```sql
REVOKE ALL ON FUNCTION start_tutor_session_tx(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION start_tutor_session_tx(uuid, uuid, text) TO service_role;
-- Repeat for the other three.
```

- [ ] **Step 6: Test the functions in psql.** Insert a fake user_id, scenario_id, task_id, then invoke each function and verify side effects. Document the test queries in a comment block at the bottom of the migration (commented out).

- [ ] **Step 7: Commit.**

```bash
git add supabase/migrations/20260510000001_ai_tutor_schema.sql
git commit -m "feat(db): transactional functions for tutor session lifecycle"
```

### Task 1.3: Create the storage bucket

- [ ] **Step 1: Create `supabase/migrations/20260510000002_ai_tutor_audio_bucket.sql`:**

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-tutor-audio', 'ai-tutor-audio', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read_tutor_audio" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'ai-tutor-audio');
CREATE POLICY "service_role_write_tutor_audio" ON storage.objects
  FOR INSERT TO service_role WITH CHECK (bucket_id = 'ai-tutor-audio');
CREATE POLICY "service_role_update_tutor_audio" ON storage.objects
  FOR UPDATE TO service_role USING (bucket_id = 'ai-tutor-audio');
```

Reference: `supabase/migrations/20260502000002_lesson_images_bucket.sql`.

- [ ] **Step 2: Apply and commit.**

```bash
supabase migration up
git add supabase/migrations/20260510000002_ai_tutor_audio_bucket.sql
git commit -m "feat(db): ai-tutor-audio storage bucket (public read)"
```

### Task 1.4: Seed the first scenario

- [ ] **Step 1: Create `supabase/migrations/20260510000003_ai_tutor_seed_meeting_someone_new.sql`** that INSERTs:
  - One `ai_tutor_scenarios` row: `slug='meeting-someone-new'`, `mode='free_talk'`, `level='A1'`, `is_free=true`, `title_vi='Gặp người mới'`, `title_en='Meeting someone new'`, `description_vi='Bạn đang nói chuyện với một người bạn mới. Hãy giới thiệu bản thân và hỏi một vài câu đơn giản.'`, `description_en='You are talking to a new friend. Introduce yourself and ask a few simple questions.'`, `goal_vi='Có một cuộc trò chuyện ngắn, thân thiện với người mới.'`, `goal_en='Have a short, friendly conversation with someone new.'`, `ai_persona='A friendly stranger you just met'`, `opening_line_en='Hi! Nice to meet you. What''s your name?'`, `opening_audio_path=NULL`.
  - Four `ai_tutor_scenario_tasks` rows (sort_order 1–4): `introduce_self`, `ask_how_are_you`, `say_where_from`, `ask_what_doing_today`. Use the `accept_patterns` and `correction_templates` JSONB shapes from spec §6 (one or two correction templates per task; e.g., `introduce_self` has `missing_be_verb_intro`).
  - Eight `ai_tutor_scenario_phrases` rows from spec §33 of the original brief.

- [ ] **Step 2: Apply and verify with `SELECT * FROM ai_tutor_scenarios WHERE slug='meeting-someone-new';`** plus tasks/phrases joins.

- [ ] **Step 3: Commit.**

```bash
git add supabase/migrations/20260510000003_ai_tutor_seed_meeting_someone_new.sql
git commit -m "feat(db): seed Meeting someone new scenario, 4 tasks, 8 phrases"
```

### Task 1.5: Regenerate TypeScript types

- [ ] **Step 1: Run** `npx supabase gen types typescript --local > src/lib/database.types.ts` (or whichever command is wired in this repo).

- [ ] **Step 2: `npm run type-check`** to confirm no breakage.

- [ ] **Step 3: Commit.**

```bash
git add src/lib/database.types.ts
git commit -m "chore(types): regenerate database types after ai_tutor migration"
```

---

## Phase 2 — Backend Pydantic models + STT provider abstraction

**Files:**
- Create: `backend/app/models/tutor.py`
- Create: `backend/app/services/stt_provider/__init__.py`
- Create: `backend/app/services/stt_provider/stub_provider.py`
- Create: `backend/app/services/stt_provider/groq_provider.py`
- Modify: `backend/app/core/config.py`
- Test: `backend/tests/test_stt_stub_provider.py`
- Test: `backend/tests/test_stt_groq_provider.py`

### Task 2.1: Pydantic models

- [ ] **Step 1: Create `backend/app/models/tutor.py`** with:

```python
"""Pydantic models for AI Tutor — request/response shapes + DB row shapes."""
from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class TutorScenarioSummary(BaseModel):
    slug: str
    title_en: str
    title_vi: str
    level: str
    mode: Literal['course', 'free_talk']
    is_free: bool


class TutorTask(BaseModel):
    id: UUID
    task_key: str
    title_en: str
    title_vi: str
    sort_order: int
    accept_patterns: list[Any]
    correction_templates: list[dict[str, Any]] = Field(default_factory=list)
    next_ai_line_en: str | None = None
    next_ai_line_audio_url: str | None = None  # resolved from path on response


class TutorPhrase(BaseModel):
    id: UUID
    phrase_en: str
    translation_vi: str
    audio_url: str | None = None
    sort_order: int


class TutorScenarioDetail(BaseModel):
    id: UUID
    slug: str
    mode: Literal['course', 'free_talk']
    level: str
    title_en: str
    title_vi: str
    description_en: str | None
    description_vi: str | None
    goal_en: str | None
    goal_vi: str | None
    ai_persona: str | None
    opening_line_en: str
    opening_audio_url: str | None
    is_free: bool
    tasks: list[TutorTask]
    phrases: list[TutorPhrase]
    existing_active_session_id: UUID | None = None


class TurnCorrection(BaseModel):
    corrected_en: str
    explanation_vi: str
    translation_vi: str | None = None
    severity: Literal['none', 'minor', 'major']
    explanation_key: str | None = None


class EvaluationResult(BaseModel):
    kind: Literal['evaluated', 'vi_spoken'] = 'evaluated'
    task_completed: bool = False
    severity: Literal['none', 'minor', 'major'] = 'none'
    correction: TurnCorrection | None = None
    should_advance: bool = False
    matched_pattern: str | None = None


class TutorTurnDTO(BaseModel):
    id: UUID
    speaker: Literal['ai', 'user']
    text_en: str | None
    audio_url: str | None
    correction: TurnCorrection | None = None
    task_completed: bool = False
    created_at: datetime


class TutorSessionDTO(BaseModel):
    id: UUID
    scenario_slug: str
    status: Literal['active', 'completed', 'abandoned']
    current_task_id: UUID | None
    completed_task_ids: list[UUID]
    mistake_count: int
    xp_awarded: int
    started_at: datetime
    last_activity_at: datetime
    completed_at: datetime | None


class StartSessionRequest(BaseModel):
    scenario_slug: str
    mode: Literal['fresh', 'continue']


class StartSessionResponse(BaseModel):
    session_id: UUID
    status: Literal['active']
    current_task_id: UUID
    opening_turn: TutorTurnDTO


class TurnResponse(BaseModel):
    transcript: str
    evaluation: EvaluationResult
    session: TutorSessionDTO
    new_turns: list[TutorTurnDTO]
    current_task_id: UUID | None
    end_lesson_detected: bool = False
    tasks_done: int | None = None
    tasks_total: int | None = None


class FinishResponse(BaseModel):
    session: TutorSessionDTO
    xp_awarded: int
    all_corrections: list[TurnCorrection] = Field(default_factory=list)


class TutorEventRequest(BaseModel):
    event_type: Literal[
        'mic.denied', 'audio.fallback', 'turn.failed.network', 'unsupported_browser'
    ]
    payload: dict[str, Any] = Field(default_factory=dict)
    session_id: UUID | None = None
```

- [ ] **Step 2: Commit.**

```bash
git add backend/app/models/tutor.py
git commit -m "feat(backend): tutor pydantic models"
```

### Task 2.2: Config additions

- [ ] **Step 1: In `backend/app/core/config.py`**, add inside the `Settings` class:

```python
ai_tutor_enabled: bool = False
groq_api_key: str | None = None
groq_stt_model: str = 'whisper-large-v3'
stt_provider: Literal['groq', 'stub'] = 'stub'
stt_timeout_seconds: int = 10
tutor_audio_bucket: str = 'ai-tutor-audio'
elevenlabs_api_key: str | None = None  # script-side only
```

(Add `from typing import Literal` import at the top if not present.)

- [ ] **Step 2: In `backend/app/main.py`**, add `"ai_tutor_enabled": bool(settings.ai_tutor_enabled and settings.groq_api_key)` to the `/api/v1/health` response payload, alongside the existing `voice_enabled` field.

- [ ] **Step 3: Commit.**

```bash
git add backend/app/core/config.py backend/app/main.py
git commit -m "feat(config): add ai_tutor and Groq STT settings; health reports ai_tutor_enabled"
```

### Task 2.3: STT provider Protocol + stub

- [ ] **Step 1: Write the failing test** at `backend/tests/test_stt_stub_provider.py`:

```python
import pytest

@pytest.mark.asyncio
async def test_stub_returns_canned_transcript():
    from app.services.stt_provider import StubSTTProvider, TranscriptResult
    provider = StubSTTProvider(canned_text="my name is tom")
    result = await provider.transcribe(b"\x00\x00", mime_type="audio/webm")
    assert isinstance(result, TranscriptResult)
    assert result.text == "my name is tom"

@pytest.mark.asyncio
async def test_stub_can_simulate_failure():
    from app.services.stt_provider import StubSTTProvider, STTFailureError
    provider = StubSTTProvider(simulate_failure=True)
    with pytest.raises(STTFailureError):
        await provider.transcribe(b"", mime_type="audio/webm")
```

Run: `pytest backend/tests/test_stt_stub_provider.py -v`. Expected: FAIL (module not found).

- [ ] **Step 2: Create `backend/app/services/stt_provider/__init__.py`:**

```python
"""STT provider abstraction.

Provides a Protocol so the runtime can swap between Groq, a stub for tests,
and any future provider (OpenAI Whisper API, Azure, self-hosted, etc.) without
changing the call site.
"""
from typing import Protocol
from pydantic import BaseModel


class TranscriptResult(BaseModel):
    text: str
    language: str | None = None      # advisory only; never used for VI detection
    confidence: float | None = None
    duration_ms: int | None = None


class STTFailureError(Exception):
    """Raised by any STTProvider when transcription cannot be produced."""
    def __init__(self, reason: str, *, http_status: int | None = None):
        super().__init__(reason)
        self.reason = reason
        self.http_status = http_status


class STTProvider(Protocol):
    async def transcribe(
        self,
        audio: bytes,
        mime_type: str,
        prompt: str | None = None,
    ) -> TranscriptResult: ...


# Re-exports for ergonomic imports
from .stub_provider import StubSTTProvider  # noqa: E402
from .groq_provider import GroqSTTProvider  # noqa: E402

__all__ = ["TranscriptResult", "STTFailureError", "STTProvider", "StubSTTProvider", "GroqSTTProvider"]
```

- [ ] **Step 3: Create `backend/app/services/stt_provider/stub_provider.py`:**

```python
from . import TranscriptResult, STTFailureError


class StubSTTProvider:
    """Deterministic stub for tests. Returns canned text or raises on demand."""

    def __init__(self, canned_text: str = "", simulate_failure: bool = False, language: str = "en"):
        self.canned_text = canned_text
        self.simulate_failure = simulate_failure
        self.language = language

    async def transcribe(self, audio: bytes, mime_type: str, prompt: str | None = None) -> TranscriptResult:
        if self.simulate_failure:
            raise STTFailureError("stub_simulated_failure", http_status=503)
        return TranscriptResult(text=self.canned_text, language=self.language, confidence=1.0)
```

- [ ] **Step 4: Run test, expect PASS.**

```bash
pytest backend/tests/test_stt_stub_provider.py -v
```

- [ ] **Step 5: Commit.**

```bash
git add backend/app/services/stt_provider/ backend/tests/test_stt_stub_provider.py
git commit -m "feat(stt): provider Protocol + stub for tests"
```

### Task 2.4: Groq STT provider

- [ ] **Step 1: Write failing tests** at `backend/tests/test_stt_groq_provider.py`. Cover: success returns `TranscriptResult`, 5xx raises `STTFailureError`, timeout raises `STTFailureError`, empty transcript (`""` or whitespace) raises `STTFailureError`, very-short transcript (length < 2 after strip) raises `STTFailureError`. Mock `httpx.AsyncClient.post` with `respx` or unittest.mock.

```python
import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_groq_success(monkeypatch):
    from app.services.stt_provider import GroqSTTProvider, TranscriptResult
    fake_resp = AsyncMock()
    fake_resp.status_code = 200
    fake_resp.json = lambda: {"text": "my name is tom", "language": "en", "duration": 1.4}
    fake_resp.raise_for_status = lambda: None
    fake_post = AsyncMock(return_value=fake_resp)
    with patch("httpx.AsyncClient.post", fake_post):
        provider = GroqSTTProvider(api_key="test", model="whisper-large-v3", timeout_s=10)
        out = await provider.transcribe(b"\x00\x00", mime_type="audio/webm", prompt="Introduce yourself")
    assert isinstance(out, TranscriptResult)
    assert out.text == "my name is tom"
    assert out.duration_ms == 1400

@pytest.mark.asyncio
async def test_groq_5xx_raises():
    from app.services.stt_provider import GroqSTTProvider, STTFailureError
    fake_resp = AsyncMock()
    fake_resp.status_code = 503
    fake_resp.raise_for_status = AsyncMock(side_effect=Exception("upstream"))
    with patch("httpx.AsyncClient.post", AsyncMock(return_value=fake_resp)):
        with pytest.raises(STTFailureError):
            await GroqSTTProvider("k", "whisper-large-v3", 10).transcribe(b"x", "audio/webm")

@pytest.mark.asyncio
async def test_groq_empty_transcript_raises():
    from app.services.stt_provider import GroqSTTProvider, STTFailureError
    fake_resp = AsyncMock()
    fake_resp.status_code = 200
    fake_resp.json = lambda: {"text": "  ", "language": "en"}
    fake_resp.raise_for_status = lambda: None
    with patch("httpx.AsyncClient.post", AsyncMock(return_value=fake_resp)):
        with pytest.raises(STTFailureError):
            await GroqSTTProvider("k", "whisper-large-v3", 10).transcribe(b"x", "audio/webm")
```

Run: expect FAIL.

- [ ] **Step 2: Create `backend/app/services/stt_provider/groq_provider.py`:**

```python
import httpx
from . import TranscriptResult, STTFailureError


GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions"


class GroqSTTProvider:
    """Groq Whisper API client. OpenAI-compatible /audio/transcriptions endpoint."""

    def __init__(self, api_key: str, model: str, timeout_s: int):
        self.api_key = api_key
        self.model = model
        self.timeout_s = timeout_s

    async def transcribe(
        self, audio: bytes, mime_type: str, prompt: str | None = None
    ) -> TranscriptResult:
        files = {"file": ("audio.bin", audio, mime_type)}
        data = {"model": self.model, "language": "en", "response_format": "verbose_json"}
        if prompt:
            data["prompt"] = prompt[:200]  # Groq prompt cap

        try:
            async with httpx.AsyncClient(timeout=self.timeout_s) as client:
                resp = await client.post(
                    GROQ_URL,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    data=data,
                    files=files,
                )
        except httpx.TimeoutException as exc:
            raise STTFailureError("timeout", http_status=None) from exc
        except httpx.HTTPError as exc:
            raise STTFailureError("network", http_status=None) from exc

        if resp.status_code >= 500:
            raise STTFailureError("upstream_5xx", http_status=resp.status_code)
        if resp.status_code >= 400:
            raise STTFailureError("upstream_4xx", http_status=resp.status_code)

        body = resp.json()
        text = (body.get("text") or "").strip()
        if len(text) < 2:
            raise STTFailureError("empty_transcript", http_status=resp.status_code)

        duration = body.get("duration")
        return TranscriptResult(
            text=text,
            language=body.get("language"),
            duration_ms=int(duration * 1000) if duration is not None else None,
        )
```

- [ ] **Step 3: Run tests, expect PASS.** `pytest backend/tests/test_stt_groq_provider.py -v`

- [ ] **Step 4: Commit.**

```bash
git add backend/app/services/stt_provider/groq_provider.py backend/tests/test_stt_groq_provider.py
git commit -m "feat(stt): Groq Whisper adapter with timeout + empty-transcript handling"
```

---

## Phase 3 — Rule-based evaluator service

**Files:**
- Create: `backend/app/services/tutor_evaluator_service.py`
- Test: `backend/tests/test_tutor_evaluator.py`

### Task 3.1: Failing tests for evaluator

- [ ] **Step 1: Create `backend/tests/test_tutor_evaluator.py`** with one test per pattern + correction template that the seed scenario will use. At minimum:

```python
import pytest

INTRO_TASK = {
    "id": "00000000-0000-0000-0000-000000000001",
    "task_key": "introduce_self",
    "title_en": "Introduce yourself",
    "accept_patterns": ["my name is", "i am", "i'm", {"regex": r"^call me \w+"}],
    "correction_templates": [
        {
            "match_regex": r"^my name (\w+)$",
            "corrected_en_template": "My name is {1}.",
            "explanation_vi": "Bạn cần thêm 'is' sau 'name'.",
            "explanation_key": "missing_be_verb_intro",
            "severity": "minor",
        }
    ],
}

def test_accept_pattern_substring_matches():
    from app.services.tutor_evaluator_service import TutorEvaluatorService
    e = TutorEvaluatorService()
    res = e.evaluate("My name is Tom.", INTRO_TASK)
    assert res.task_completed is True
    assert res.severity == "none"
    assert res.correction is None
    assert res.should_advance is True

def test_accept_pattern_regex_matches():
    from app.services.tutor_evaluator_service import TutorEvaluatorService
    e = TutorEvaluatorService()
    res = e.evaluate("Call me Tom", INTRO_TASK)
    assert res.task_completed is True

def test_no_match_returns_not_completed():
    from app.services.tutor_evaluator_service import TutorEvaluatorService
    e = TutorEvaluatorService()
    res = e.evaluate("Hello there friend", INTRO_TASK)
    assert res.task_completed is False
    assert res.should_advance is False

def test_correction_template_matched_advances_with_correction():
    from app.services.tutor_evaluator_service import TutorEvaluatorService
    e = TutorEvaluatorService()
    res = e.evaluate("My name Tom", INTRO_TASK)
    # Template matched → corrected variant; severity minor → still advances
    assert res.task_completed is True
    assert res.correction is not None
    assert res.correction.corrected_en == "My name is Tom."
    assert res.correction.explanation_vi == "Bạn cần thêm 'is' sau 'name'."
    assert res.severity == "minor"
    assert res.should_advance is True

def test_normalization_strips_punctuation_and_lowercases():
    from app.services.tutor_evaluator_service import TutorEvaluatorService
    e = TutorEvaluatorService()
    res = e.evaluate("MY NAME IS TOM!!!", INTRO_TASK)
    assert res.task_completed is True
```

Run: expect FAIL.

- [ ] **Step 2: Create `backend/app/services/tutor_evaluator_service.py`** implementing `TutorEvaluatorService.evaluate(transcript: str, task: dict | TutorTask) -> EvaluationResult`. Normalize: lowercase + strip non-alphanum-or-space + collapse whitespace. Iterate `accept_patterns`: substrings via `in`, `{"regex": "..."}` via `re.search` (IGNORECASE). Iterate `correction_templates` regexes; first match wins; interpolate `{0}`, `{1}` etc. using captured groups; map severity from template (default `'minor'` if template matched, `'none'` otherwise). `should_advance = task_completed and severity != 'major'`.

- [ ] **Step 3: Run tests, expect PASS.**

- [ ] **Step 4: Commit.**

```bash
git add backend/app/services/tutor_evaluator_service.py backend/tests/test_tutor_evaluator.py
git commit -m "feat(backend): rule-based tutor evaluator"
```

### Task 3.2: End-lesson detector + VI-spoken detector

- [ ] **Step 1: Add to `backend/tests/test_tutor_evaluator.py`:**

```python
def test_end_lesson_english_variants():
    from app.services.tutor_evaluator_service import detect_end_lesson
    assert detect_end_lesson("end lesson") is True
    assert detect_end_lesson("Please end the lesson") is True
    assert detect_end_lesson("finish session") is True
    assert detect_end_lesson("stop the lesson") is True

def test_end_lesson_vietnamese():
    from app.services.tutor_evaluator_service import detect_end_lesson
    assert detect_end_lesson("kết thúc bài học") is True

def test_end_lesson_false_positives():
    from app.services.tutor_evaluator_service import detect_end_lesson
    assert detect_end_lesson("I want to extend my lesson") is False
    assert detect_end_lesson("ending soon") is False

def test_vi_spoken_detection():
    from app.services.tutor_evaluator_service import is_vietnamese_text
    assert is_vietnamese_text("Tên tôi là Tom") is True
    assert is_vietnamese_text("My name is Tom") is False
    assert is_vietnamese_text("kết thúc") is True
```

- [ ] **Step 2: Add module-level functions to `tutor_evaluator_service.py`:**

```python
import re

_END_LESSON_EN = re.compile(r"\b(end|finish|stop)\s+(the\s+)?(lesson|session)\b", re.IGNORECASE)
_END_LESSON_VI = re.compile(r"kết thúc bài học", re.IGNORECASE)
_VI_DIACRITICS = re.compile(r"[ạáàảãâấầẩẫậăắằẳẵặéèẻẽêếềểễệíìỉĩịóòỏõôốồổỗộơớờởỡợúùủũưứừửữựýỳỷỹỵđ]", re.IGNORECASE)


def detect_end_lesson(transcript: str) -> bool:
    return bool(_END_LESSON_EN.search(transcript) or _END_LESSON_VI.search(transcript))


def is_vietnamese_text(transcript: str) -> bool:
    return bool(_VI_DIACRITICS.search(transcript))
```

- [ ] **Step 3: Run all evaluator tests, expect PASS. Commit.**

```bash
git add backend/app/services/tutor_evaluator_service.py backend/tests/test_tutor_evaluator.py
git commit -m "feat(backend): end-lesson + VI-spoken detectors with full regex coverage"
```

---

## Phase 4 — Backend session service + storage URL helper

**Files:**
- Create: `backend/app/services/tutor_scenario_service.py`
- Create: `backend/app/services/tutor_session_service.py`
- Create: `backend/app/core/storage.py` (or extend existing)
- Test: `backend/tests/test_tutor_scenario_service.py`
- Test: `backend/tests/test_tutor_session_service.py`

### Task 4.1: Storage URL helper

- [ ] **Step 1: Create `backend/app/core/storage.py`:**

```python
"""Helpers for resolving Supabase Storage paths to public URLs."""
from .config import settings


def public_url(bucket: str, path: str | None) -> str | None:
    if not path:
        return None
    base = settings.supabase_url.rstrip("/")
    return f"{base}/storage/v1/object/public/{bucket}/{path.lstrip('/')}"


def tutor_audio_url(path: str | None) -> str | None:
    return public_url(settings.tutor_audio_bucket, path)
```

- [ ] **Step 2: Quick smoke test inline (no full test file needed):**

```python
# backend/tests/test_storage.py
def test_tutor_audio_url_handles_none():
    from app.core.storage import tutor_audio_url
    assert tutor_audio_url(None) is None

def test_tutor_audio_url_builds_public_path(monkeypatch):
    from app.core import storage
    from app.core.config import settings
    monkeypatch.setattr(settings, "supabase_url", "https://abc.supabase.co")
    monkeypatch.setattr(settings, "tutor_audio_bucket", "ai-tutor-audio")
    assert storage.tutor_audio_url("scenarios/x/opening.mp3") == \
        "https://abc.supabase.co/storage/v1/object/public/ai-tutor-audio/scenarios/x/opening.mp3"
```

- [ ] **Step 3: Commit.**

```bash
git add backend/app/core/storage.py backend/tests/test_storage.py
git commit -m "feat(backend): tutor audio storage URL helper"
```

### Task 4.2: Scenario service (read-only catalog access)

- [ ] **Step 1: Write failing tests** at `backend/tests/test_tutor_scenario_service.py` for: `list_scenarios()` returns summaries, `get_scenario_detail(slug, user_id)` returns nested `tasks` + `phrases` + `existing_active_session_id` (or None). Use `mock_supabase` fixture from `conftest.py`.

- [ ] **Step 2: Create `backend/app/services/tutor_scenario_service.py`** that performs three SELECTs (scenario, tasks, phrases) and one SELECT for existing active session. Resolve `audio_path` → `audio_url` for each row using `tutor_audio_url`. Return Pydantic models from `app.models.tutor`.

- [ ] **Step 3: Run, commit.**

```bash
git add backend/app/services/tutor_scenario_service.py backend/tests/test_tutor_scenario_service.py
git commit -m "feat(backend): tutor scenario service (read catalog)"
```

### Task 4.3: Session service — `start_session`

- [ ] **Step 1: Write failing test** that asserts `TutorSessionService.start_session(user_id, slug, mode='fresh')` calls `supabase.rpc('start_tutor_session_tx', ...)` with the right args, then performs the follow-up read of the new session + opening turn data. Reuse `mock_supabase` fixture.

- [ ] **Step 2: Implement `start_session` in `backend/app/services/tutor_session_service.py`.** It resolves slug → scenario_id, calls the RPC, reads back session + scenario opening_line/audio_path, builds and returns `StartSessionResponse`.

- [ ] **Step 3: Run, commit.**

```bash
git add backend/app/services/tutor_session_service.py backend/tests/test_tutor_session_service.py
git commit -m "feat(backend): TutorSessionService.start_session"
```

### Task 4.4: Session service — `submit_turn` (the hot path)

- [ ] **Step 1: Write failing tests** covering each branch of the spec §6 turn pipeline, all using `StubSTTProvider` for STT control. Tests:
  1. STT failure → no rpc call to `record_tutor_exchange_tx`; raises a service-level `TurnSTTFailure` exception (route maps to 503).
  2. End-lesson detected → returns `TurnResponse` with `end_lesson_detected=True`, no rpc to `record_tutor_exchange_tx`, ai_tutor_events insert NOT made for end-lesson (it's not a failure).
  3. VI-spoken → returns `TurnResponse(evaluation=EvaluationResult(kind='vi_spoken'))`, no exchange rpc, ai_tutor_events insert made for `turn.vi_spoken`.
  4. Normal turn that completes task → calls `record_tutor_exchange_tx` with `_completed_task_id=current_task_id`, `_next_task_id=<next-by-sort-order>`, `_ai_text=current_task.next_ai_line_en`.
  5. Normal turn that does NOT complete → calls rpc with `_completed_task_id=None`, `_next_task_id=None`, `_ai_text=<task re-prompt>`.
  6. Final task completes → `_next_task_id=None`, `_ai_text="Great job! That was a really nice chat. Want to end here?"` (or whatever final-line constant lives in code/scenario row).

- [ ] **Step 2: Implement `submit_turn(user_id, session_id, audio_bytes, mime_type, current_task_id) -> TurnResponse`.** Order strictly per spec §6: ownership/active check → audio validate → STT → end-lesson check → VI check → evaluator → compute next-task pointers → pick AI line → call exchange rpc → build response. Use `tutor_audio_url(...)` to resolve audio paths.

- [ ] **Step 3: Run, commit.**

```bash
git add backend/app/services/tutor_session_service.py backend/tests/test_tutor_session_service.py
git commit -m "feat(backend): TutorSessionService.submit_turn with full pipeline ordering"
```

### Task 4.5: Session service — `finish_session` and `abandon_session`

- [ ] **Step 1: Write failing tests** for: finish calls `complete_tutor_session_tx` with computed XP (formula: `25 + (10 * tasks_completed) - (5 * mistake_count)`, floor at 5), reads back updated session + collects all corrections from turns, returns `FinishResponse`. Abandon calls `abandon_tutor_session_tx(reason='user_cancelled')`.

- [ ] **Step 2: Implement both methods.**

- [ ] **Step 3: Run, commit.**

```bash
git add backend/app/services/tutor_session_service.py backend/tests/test_tutor_session_service.py
git commit -m "feat(backend): finish and abandon session methods"
```

---

## Phase 5 — FastAPI router + endpoints

**Files:**
- Create: `backend/app/api/v1/ai_tutor_session.py`
- Modify: `backend/app/main.py` (register router; gate on `ai_tutor_enabled`)
- Test: `backend/tests/test_ai_tutor_session_api.py`

### Task 5.1: Router skeleton + scenario endpoints

- [ ] **Step 1: Create `backend/app/api/v1/ai_tutor_session.py`:**

```python
"""AI Tutor session endpoints."""
import logging
from collections import defaultdict
import time
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ...core.config import settings
from ...core.security import get_current_user
from ...core.supabase import get_supabase_admin
from ...models.tutor import (
    StartSessionRequest, StartSessionResponse, TurnResponse, FinishResponse,
    TutorScenarioSummary, TutorScenarioDetail, TutorEventRequest,
)
from ...services.stt_provider import GroqSTTProvider, StubSTTProvider, STTFailureError
from ...services.tutor_scenario_service import TutorScenarioService
from ...services.tutor_session_service import TutorSessionService, TurnSTTFailure

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ai-tutor"])


def _get_stt():
    if settings.stt_provider == "groq" and settings.groq_api_key:
        return GroqSTTProvider(settings.groq_api_key, settings.groq_stt_model, settings.stt_timeout_seconds)
    return StubSTTProvider()


def _require_enabled():
    if not (settings.ai_tutor_enabled and settings.groq_api_key) and settings.stt_provider != "stub":
        raise HTTPException(status_code=503, detail={"error": "tutor_disabled"})


# Public-ish (auth required, no per-user data)
@router.get("/ai-tutor/scenarios", response_model=list[TutorScenarioSummary])
async def list_scenarios(
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    _require_enabled()
    return TutorScenarioService(supabase).list_scenarios()


@router.get("/ai-tutor/scenarios/{slug}", response_model=TutorScenarioDetail)
async def get_scenario(
    slug: str,
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    _require_enabled()
    detail = TutorScenarioService(supabase).get_detail(slug, user_id)
    if detail is None:
        raise HTTPException(404, "scenario_not_found")
    return detail
```

- [ ] **Step 2: Register the router in `backend/app/main.py`:** `app.include_router(ai_tutor_session.router, prefix="/api/v1")`.

- [ ] **Step 3: Add a smoke test** that hits both endpoints with a stubbed scenario. Run, commit.

```bash
git add backend/app/api/v1/ai_tutor_session.py backend/app/main.py backend/tests/test_ai_tutor_session_api.py
git commit -m "feat(api): AI tutor scenario read endpoints"
```

### Task 5.2: Session lifecycle endpoints

- [ ] **Step 1: Add to the router** (full handlers; mirror `review.py` patterns for graceful error handling on transient Supabase errors):

```python
@router.post("/me/ai-tutor/sessions", response_model=StartSessionResponse)
async def start_session(
    body: StartSessionRequest,
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    _require_enabled()
    return TutorSessionService(supabase, _get_stt()).start_session(user_id, body.scenario_slug, body.mode)


@router.get("/me/ai-tutor/sessions/{session_id}")
async def get_session(
    session_id: UUID,
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    _require_enabled()
    return TutorSessionService(supabase, _get_stt()).get_session(user_id, session_id)


# In-memory rate limit (60/min/user) — same pattern as conversations.py
_RATE_WINDOW = 60
_RATE_MAX = 60
_rate: dict[str, list[float]] = defaultdict(list)


def _rate_check(user_id: str) -> int | None:
    now = time.monotonic()
    cutoff = now - _RATE_WINDOW
    _rate[user_id] = [t for t in _rate[user_id] if t > cutoff]
    if len(_rate[user_id]) >= _RATE_MAX:
        return int(_RATE_WINDOW - (now - min(_rate[user_id]))) + 1
    _rate[user_id].append(now)
    return None


@router.post("/me/ai-tutor/sessions/{session_id}/turns", response_model=TurnResponse)
async def submit_turn(
    session_id: UUID,
    audio: UploadFile = File(...),
    current_task_id: UUID = Form(...),
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    _require_enabled()
    if (retry := _rate_check(str(user_id))) is not None:
        raise HTTPException(429, headers={"Retry-After": str(retry)})

    audio_bytes = await audio.read()
    if len(audio_bytes) > 2 * 1024 * 1024:
        raise HTTPException(413, "audio_too_large")

    try:
        return await TutorSessionService(supabase, _get_stt()).submit_turn(
            user_id=user_id,
            session_id=session_id,
            audio_bytes=audio_bytes,
            mime_type=audio.content_type or "audio/webm",
            current_task_id=current_task_id,
        )
    except TurnSTTFailure as exc:
        # Service has already logged ai_tutor_events('turn.failed.stt'); no session/turn writes occurred.
        raise HTTPException(503, detail={"error": "stt_failed", "retryable": True, "reason": exc.reason})


@router.post("/me/ai-tutor/sessions/{session_id}/finish", response_model=FinishResponse)
async def finish_session(
    session_id: UUID,
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    _require_enabled()
    return TutorSessionService(supabase, _get_stt()).finish_session(user_id, session_id)


@router.post("/me/ai-tutor/sessions/{session_id}/abandon")
async def abandon_session(
    session_id: UUID,
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    _require_enabled()
    TutorSessionService(supabase, _get_stt()).abandon_session(user_id, session_id, reason="user_cancelled")
    return {"ok": True}
```

- [ ] **Step 2: Add API tests** that exercise: 200 happy path on `/turns` with stub STT, 503 on STT failure, 413 on oversized audio, 429 on rate limit (mock `_rate_check` to short-circuit). Use FastAPI `TestClient`.

- [ ] **Step 3: Commit.**

```bash
git add backend/app/api/v1/ai_tutor_session.py backend/tests/test_ai_tutor_session_api.py
git commit -m "feat(api): tutor session lifecycle endpoints with rate limit + size cap"
```

### Task 5.3: Frontend events endpoint

- [ ] **Step 1: Add handler:**

```python
_ALLOWED_FRONTEND_EVENTS = {"mic.denied", "audio.fallback", "turn.failed.network", "unsupported_browser"}
_EVENT_RATE_MAX = 30


@router.post("/me/ai-tutor/events", status_code=204)
async def post_event(
    body: TutorEventRequest,
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    if body.event_type not in _ALLOWED_FRONTEND_EVENTS:
        raise HTTPException(400, "event_type_not_allowed")
    # Simple per-user rate limit reuse (separate bucket prefix would be cleaner; keep simple for v1)
    if (retry := _rate_check(f"events:{user_id}")) is not None:
        raise HTTPException(429, headers={"Retry-After": str(retry)})
    try:
        supabase.table("ai_tutor_events").insert({
            "user_id": str(user_id),
            "session_id": str(body.session_id) if body.session_id else None,
            "event_type": body.event_type,
            "payload": body.payload,
        }).execute()
    except Exception:
        logger.exception("ai_tutor_events insert failed for user %s type %s", user_id, body.event_type)
        # Diagnostics: never fail the calling page if telemetry write breaks
        return
```

- [ ] **Step 2: Add tests** for whitelist enforcement (400 on unknown type), happy path (204).

- [ ] **Step 3: Commit.**

```bash
git add backend/app/api/v1/ai_tutor_session.py backend/tests/test_ai_tutor_session_api.py
git commit -m "feat(api): frontend telemetry events endpoint with whitelist"
```

---

## Phase 6 — Audio pre-generation script

**Files:**
- Create: `scripts/generate-tutor-audio.ts`
- Create: `scripts/lib/tutor-audio-providers.ts`
- Modify: `package.json` (add `tutor-audio` script)

### Task 6.1: Script skeleton + provider abstraction

- [ ] **Step 1: Create `scripts/lib/tutor-audio-providers.ts`** with a `TtsProvider` interface and one `ElevenLabsProvider` implementation. Provider takes `{text, voiceId}`, returns `Buffer` (mp3). Include a `BrowserSkipProvider` that throws (so `--provider browser-skip` is a no-op marker).

- [ ] **Step 2: Create `scripts/generate-tutor-audio.ts`** that:
  1. Loads `backend/.env` via `dotenv.config({ path: 'backend/.env' })`.
  2. CLI: `--scenario <slug>` (required), `--asset <key>` (optional filter), `--dry-run`, `--force`, `--provider elevenlabs|openai-tts|browser-skip`.
  3. Reads scenario + tasks + phrases from Supabase (service-role client).
  4. Enumerates assets: `opening`, `tasks/<task_key>.next`, `phrases/<phrase_id>` (one per phrase).
  5. For each asset: compute prompt-hash from text; if existing `audio_path` non-null AND prompt-hash matches AND not `--force`, skip.
  6. Otherwise: call `TtsProvider.synth(text)`, upload to `ai-tutor-audio/scenarios/<slug>/<path>.mp3`, UPDATE the corresponding row's `*_audio_path` column.
  7. Print summary table.

- [ ] **Step 3: Add npm script** in `package.json`: `"tutor-audio": "tsx scripts/generate-tutor-audio.ts"`.

- [ ] **Step 4: Dry-run locally:**

```bash
npm run tutor-audio -- --scenario meeting-someone-new --dry-run
```

Expected: prints planned uploads (13 assets: 1 opening + 4 task next-lines + 8 phrases), no DB writes, no API calls.

- [ ] **Step 5: Live run** with `ELEVENLABS_API_KEY` set in `backend/.env`:

```bash
npm run tutor-audio -- --scenario meeting-someone-new
```

Verify in Supabase Storage UI that 13 mp3s exist under `scenarios/meeting-someone-new/`. Verify in DB that `audio_path` columns are populated.

- [ ] **Step 6: Commit.**

```bash
git add scripts/generate-tutor-audio.ts scripts/lib/tutor-audio-providers.ts package.json
git commit -m "feat(scripts): tutor audio pre-generation pipeline (ElevenLabs)"
```

---

## Phase 7 — Frontend foundations: API client, types, feature flag

**Files:**
- Create: `src/features/ai-tutor/types.ts`
- Create: `src/features/ai-tutor/api/tutor.ts`
- Create: `src/features/ai-tutor/api/events.ts`
- Modify: `.env.example` (document new flags)
- Test: `src/features/ai-tutor/api/__tests__/tutor.test.ts`

### Task 7.1: TypeScript types (mirror backend models)

- [ ] **Step 1: Create `src/features/ai-tutor/types.ts`:**

```ts
export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type Severity = 'none' | 'minor' | 'major';
export type Speaker = 'ai' | 'user';
export type EvaluationKind = 'evaluated' | 'vi_spoken';

export interface TutorScenarioSummary {
  slug: string;
  title_en: string;
  title_vi: string;
  level: string;
  mode: 'course' | 'free_talk';
  is_free: boolean;
}

export interface TutorTask {
  id: string;
  task_key: string;
  title_en: string;
  title_vi: string;
  sort_order: number;
  next_ai_line_en: string | null;
  next_ai_line_audio_url: string | null;
  // accept_patterns/correction_templates intentionally NOT shipped to client
}

export interface TutorPhrase {
  id: string;
  phrase_en: string;
  translation_vi: string;
  audio_url: string | null;
  sort_order: number;
}

export interface TutorScenarioDetail {
  id: string;
  slug: string;
  mode: 'course' | 'free_talk';
  level: string;
  title_en: string;
  title_vi: string;
  description_en: string | null;
  description_vi: string | null;
  goal_en: string | null;
  goal_vi: string | null;
  ai_persona: string | null;
  opening_line_en: string;
  opening_audio_url: string | null;
  is_free: boolean;
  tasks: TutorTask[];
  phrases: TutorPhrase[];
  existing_active_session_id: string | null;
}

export interface TurnCorrection {
  corrected_en: string;
  explanation_vi: string;
  translation_vi: string | null;
  severity: Severity;
  explanation_key: string | null;
}

export interface EvaluationResult {
  kind: EvaluationKind;
  task_completed: boolean;
  severity: Severity;
  correction: TurnCorrection | null;
  should_advance: boolean;
  matched_pattern: string | null;
}

export interface TutorTurnDTO {
  id: string;
  speaker: Speaker;
  text_en: string | null;
  audio_url: string | null;
  correction: TurnCorrection | null;
  task_completed: boolean;
  created_at: string;
}

export interface TutorSessionDTO {
  id: string;
  scenario_slug: string;
  status: SessionStatus;
  current_task_id: string | null;
  completed_task_ids: string[];
  mistake_count: number;
  xp_awarded: number;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
}

export interface StartSessionResponse {
  session_id: string;
  status: 'active';
  current_task_id: string;
  opening_turn: TutorTurnDTO;
}

export interface TurnResponse {
  transcript: string;
  evaluation: EvaluationResult;
  session: TutorSessionDTO;
  new_turns: TutorTurnDTO[];
  current_task_id: string | null;
  end_lesson_detected: boolean;
  tasks_done: number | null;
  tasks_total: number | null;
}

export interface FinishResponse {
  session: TutorSessionDTO;
  xp_awarded: number;
  all_corrections: TurnCorrection[];
}

export type FrontendEventType =
  | 'mic.denied' | 'audio.fallback' | 'turn.failed.network' | 'unsupported_browser';
```

- [ ] **Step 2: Commit.**

```bash
git add src/features/ai-tutor/types.ts
git commit -m "feat(ai-tutor): TypeScript types mirroring backend models"
```

### Task 7.2: TutorAPI client

- [ ] **Step 1: Create `src/features/ai-tutor/api/tutor.ts`** mirroring the `progress.ts` pattern (Bearer token from Supabase session, JSON content-type, write methods catch-and-log-and-return-null, read methods propagate). Methods: `listScenarios()`, `getScenario(slug)`, `startSession(slug, mode)`, `getSession(id)`, `submitTurn(sessionId, audioBlob, mimeType, currentTaskId)` (FormData), `finishSession(id)`, `abandonSession(id)`. Reference: `src/lib/api/progress.ts:1-50` for the `authedFetch` helper pattern.

- [ ] **Step 2: Write a vitest** at `src/features/ai-tutor/api/__tests__/tutor.test.ts` mocking `fetch` for at minimum `submitTurn` (verifies multipart body) and `startSession` (verifies POST body shape).

- [ ] **Step 3: Commit.**

```bash
git add src/features/ai-tutor/api/tutor.ts src/features/ai-tutor/api/__tests__/tutor.test.ts
git commit -m "feat(ai-tutor): TutorAPI client (read + session lifecycle)"
```

### Task 7.3: Frontend events API

- [ ] **Step 1: Create `src/features/ai-tutor/api/events.ts`:**

```ts
import { supabase } from '@/lib/supabase';
import type { FrontendEventType } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function reportTutorEvent(
  eventType: FrontendEventType,
  payload: Record<string, unknown> = {},
  sessionId?: string,
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`${API_BASE}/me/ai-tutor/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ event_type: eventType, payload, session_id: sessionId ?? null }),
      keepalive: true,
    });
  } catch {
    // Telemetry: never throw to caller.
  }
}
```

- [ ] **Step 2: Add `.env.example` entries** for `VITE_AI_TUTOR_ENABLED=false` and `VITE_TUTOR_MAX_RECORD_MS=20000`.

- [ ] **Step 3: Commit.**

```bash
git add src/features/ai-tutor/api/events.ts .env.example
git commit -m "feat(ai-tutor): frontend telemetry event reporter + env flags"
```

---

## Phase 8 — Frontend audio primitives

**Files:**
- Create: `src/features/ai-tutor/audio/audioUtils.ts`
- Create: `src/features/ai-tutor/audio/useMicRecorder.ts`
- Create: `src/features/ai-tutor/audio/useWaveform.ts`
- Create: `src/features/ai-tutor/audio/useTutorTTS.ts`
- Test: `src/features/ai-tutor/audio/__tests__/audioUtils.test.ts`
- Test: `src/features/ai-tutor/audio/__tests__/useMicRecorder.test.ts`

### Task 8.1: MIME negotiation + iOS gesture unlock

- [ ] **Step 1: Failing test** in `audioUtils.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { negotiateRecordMime } from '../audioUtils';

describe('negotiateRecordMime', () => {
  it('prefers webm/opus when supported', () => {
    vi.stubGlobal('MediaRecorder', { isTypeSupported: (m: string) => m === 'audio/webm;codecs=opus' });
    expect(negotiateRecordMime()).toBe('audio/webm;codecs=opus');
  });
  it('falls back to mp4 on iOS Safari', () => {
    vi.stubGlobal('MediaRecorder', { isTypeSupported: (m: string) => m === 'audio/mp4' });
    expect(negotiateRecordMime()).toBe('audio/mp4');
  });
  it('returns empty string when nothing supported', () => {
    vi.stubGlobal('MediaRecorder', { isTypeSupported: () => false });
    expect(negotiateRecordMime()).toBe('');
  });
});
```

- [ ] **Step 2: Create `audioUtils.ts`:**

```ts
const PREFERRED = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav', 'audio/ogg'];

export function negotiateRecordMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const m of PREFERRED) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return '';
}

let unlocked = false;
const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVFYAAFRWAAABAAgAZGF0YQAAAAA=';

export function unlockAudioOnGesture(): void {
  if (unlocked) return;
  const audio = new Audio(SILENT_WAV_DATA_URI);
  audio.muted = true;
  void audio.play().then(() => { unlocked = true; }).catch(() => {});
}

export function isBrowserSupported(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (typeof MediaRecorder === 'undefined') missing.push('MediaRecorder');
  if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') missing.push('AudioContext');
  return { ok: missing.length === 0, missing };
}
```

- [ ] **Step 3: Run, commit.**

```bash
git add src/features/ai-tutor/audio/audioUtils.ts src/features/ai-tutor/audio/__tests__/audioUtils.test.ts
git commit -m "feat(ai-tutor): audio MIME negotiation + iOS gesture unlock helpers"
```

### Task 8.2: `useMicRecorder` hook

- [ ] **Step 1: Failing test** with mocked `MediaRecorder` covering: start sets `state==='recording'`, stop returns blob with negotiated mime, cancel discards blob, hard 20s cap auto-submits, mic-denied rejects with `{cause: 'mic_denied'}`.

- [ ] **Step 2: Implement `useMicRecorder({ maxMs })` returning `{ state, start, stop, cancel, blob, mimeType, error }`.** Use `navigator.mediaDevices.getUserMedia({audio: true})`. On permission denial, set `error` to `{cause: 'mic_denied'}` AND fire-and-forget `reportTutorEvent('mic.denied', { user_agent: navigator.userAgent, platform: navigator.platform })`.

- [ ] **Step 3: Run, commit.**

```bash
git add src/features/ai-tutor/audio/useMicRecorder.ts src/features/ai-tutor/audio/__tests__/useMicRecorder.test.ts
git commit -m "feat(ai-tutor): useMicRecorder hook (start/stop/cancel + mic-denied telemetry)"
```

### Task 8.3: `useWaveform` hook

- [ ] **Step 1: Implement `useWaveform({ stream, isActive })`** returning `{ canvasRef }`. Internally: create `AudioContext`, `MediaStreamAudioSourceNode`, `AnalyserNode(fftSize: 256)`, `requestAnimationFrame` loop reads `getByteFrequencyData` and renders bars to canvas. Cleanup on unmount; suspend `AudioContext` when `!isActive`. Skip unit-test for the canvas drawing (visual); add a smoke test that hook mounts/unmounts without throwing.

- [ ] **Step 2: Commit.**

```bash
git add src/features/ai-tutor/audio/useWaveform.ts
git commit -m "feat(ai-tutor): useWaveform hook (AnalyserNode → canvas)"
```

### Task 8.4: `useTutorTTS` hook (playback + fallback)

- [ ] **Step 1: Implement `useTutorTTS()`** exposing `{ play({text, audioUrl}), stop(), state }`. Behavior:
  1. If `audioUrl`: create `Audio(audioUrl)`, play; on `error` event → fallback to SpeechSynthesis + `reportTutorEvent('audio.fallback', { reason: 'load_error', audio_path: audioUrl })`.
  2. If no `audioUrl`: SpeechSynthesis directly + `reportTutorEvent('audio.fallback', { reason: 'missing' })`.
  3. SpeechSynthesis: pick first `en-US` voice (cache the choice). On utterance `end` resolve.
  4. `state` is `'idle' | 'playing' | 'ended' | 'error'`.

- [ ] **Step 2: Commit.**

```bash
git add src/features/ai-tutor/audio/useTutorTTS.ts
git commit -m "feat(ai-tutor): useTutorTTS hook with SpeechSynthesis fallback + telemetry"
```

---

## Phase 9 — Frontend session state machine

**Files:**
- Create: `src/features/ai-tutor/state/sessionMachine.ts`
- Test: `src/features/ai-tutor/state/__tests__/sessionMachine.test.ts`

### Task 9.1: Pure reducer

- [ ] **Step 1: Failing tests** in `sessionMachine.test.ts` covering every transition listed in spec §7. At minimum: `loading → ai_speaking` on first hydration; `ai_speaking → awaiting_user_speech` on `AI_AUDIO_ENDED`; `awaiting_user_speech → recording` on `RECORD_START`; `recording → processing` on `RECORD_STOP`; `processing → showing_eval → ai_speaking` on `TURN_RESPONSE` happy path; `processing → end_lesson_confirm` on `END_LESSON_DETECTED`; `end_lesson_confirm → processing (finish)` on `END_LESSON_CONFIRM`; `end_lesson_confirm → awaiting_user_speech` on `END_LESSON_DISMISS`; `processing → error{stt_failed,retryable}` on `TURN_ERROR`; `error → awaiting_user_speech` on retry event; `* → lesson_complete` on `FINISH_RESPONSE`.

- [ ] **Step 2: Implement `transition(state, event): SessionState`.** Use the discriminated union from spec §7 verbatim. No XState dependency.

- [ ] **Step 3: Commit.**

```bash
git add src/features/ai-tutor/state/sessionMachine.ts src/features/ai-tutor/state/__tests__/sessionMachine.test.ts
git commit -m "feat(ai-tutor): pure-reducer session state machine with full transition coverage"
```

---

## Phase 10 — TutorLayout + routing + sidebar entry

**Files:**
- Create: `src/features/ai-tutor/components/TutorLayout.tsx`
- Create: `src/features/ai-tutor/components/TutorTopTabs.tsx`
- Create: `src/features/ai-tutor/components/TutorFooterNav.tsx`
- Create: `src/features/ai-tutor/components/ComingSoonSheet.tsx`
- Modify: `src/App.tsx` (add tutor route block)
- Modify: existing sidebar component (add gated AI Tutor entry)

### Task 10.1: `TutorLayout` shell

- [ ] **Step 1: Create `TutorLayout.tsx`** that renders `<TutorTopTabs />` (sticky top), `<Outlet />` (page content with bottom padding to clear footer), `<TutorFooterNav />` (sticky bottom). Calls `unlockAudioOnGesture()` on first user click anywhere via a `onClick` handler on the root div (one-time).

- [ ] **Step 2: Create `TutorTopTabs.tsx`** with two `<NavLink>`s: Home (`/ai-tutor`, active when path starts with `/ai-tutor`) and Course (`/lessons`, never active). Use existing button/link styles.

- [ ] **Step 3: Create `TutorFooterNav.tsx`** with five items. Home → `/ai-tutor`; Free Talk → `/ai-tutor#free-talk` (anchor); Review → opens `ComingSoonSheet` ("Speech review coming soon"); Challenge → opens `ComingSoonSheet` ("Challenge mode coming soon"); Profile → `/settings`. Use Tailwind for sticky-bottom + safe-area-inset-bottom.

- [ ] **Step 4: Create `ComingSoonSheet.tsx`** as a controlled bottom sheet with title + body + close button. Reuse any existing modal primitive (look for `src/components/ui/`).

- [ ] **Step 5: Component tests** for TutorFooterNav (5 items render; clicking Review/Challenge opens sheet) and TutorLayout (renders children + footer).

- [ ] **Step 6: Commit.**

```bash
git add src/features/ai-tutor/components/TutorLayout.tsx \
        src/features/ai-tutor/components/TutorTopTabs.tsx \
        src/features/ai-tutor/components/TutorFooterNav.tsx \
        src/features/ai-tutor/components/ComingSoonSheet.tsx
git commit -m "feat(ai-tutor): TutorLayout + top tabs + footer nav + ComingSoonSheet"
```

### Task 10.2: Routing in `App.tsx`

- [ ] **Step 1: In `src/App.tsx`**, add (after existing `AuthLayout` block):

```tsx
{import.meta.env.VITE_AI_TUTOR_ENABLED === 'true' && (
  <Route element={<RequireAuth><TutorLayout /></RequireAuth>}>
    <Route path="/ai-tutor" element={<AiTutorHomePage />} />
    <Route path="/ai-tutor/scenarios/:slug/phrasebook" element={<PhrasebookPage />} />
    <Route path="/ai-tutor/scenarios/:slug/briefing" element={<ScenarioBriefingPage />} />
    <Route path="/ai-tutor/scenarios/:slug/session/:sessionId" element={<TutorSessionPage />} />
  </Route>
)}
```

Lazy-load each page via `lazy()` to match the existing pattern in App.tsx.

- [ ] **Step 2: Add a smoke test** in `src/__tests__/aiTutorRoute.test.tsx` similar to `flashcardsRoute.test.tsx`: route renders behind auth, hits TutorLayout.

- [ ] **Step 3: Commit.**

```bash
git add src/App.tsx src/__tests__/aiTutorRoute.test.tsx
git commit -m "feat(ai-tutor): wire /ai-tutor routes behind feature flag"
```

### Task 10.3: Sidebar entry in `AuthLayout`

- [ ] **Step 1: Locate the existing sidebar** (likely `src/components/layout/Sidebar.tsx` or under `src/features/`; grep for the Flashcards entry to find it).

- [ ] **Step 2: Add an "AI Tutor" entry** above Flashcards, gated on `import.meta.env.VITE_AI_TUTOR_ENABLED === 'true'`. Use a microphone icon. Link to `/ai-tutor`.

- [ ] **Step 3: Commit.**

```bash
git add <sidebar-file>
git commit -m "feat(ai-tutor): sidebar entry in AuthLayout (flag-gated)"
```

---

## Phase 11 — `useTutorSession` hook + `useScenario` hook

**Files:**
- Create: `src/features/ai-tutor/hooks/useScenario.ts`
- Create: `src/features/ai-tutor/hooks/useTutorSession.ts`
- Create: `src/features/ai-tutor/hooks/useResumeOrStart.ts`

### Task 11.1: `useScenario`

- [ ] **Step 1: Implement** as a typical fetch-on-mount hook using `TutorAPI.getScenario(slug)`. Returns `{ scenario, isLoading, error, refetch }`.

- [ ] **Step 2: Commit.**

```bash
git add src/features/ai-tutor/hooks/useScenario.ts
git commit -m "feat(ai-tutor): useScenario hook"
```

### Task 11.2: `useTutorSession` (the orchestrator)

- [ ] **Step 1: Implement** taking `{ sessionId }`. Internals:
  1. On mount, `GET /me/ai-tutor/sessions/:id` → hydrate.
  2. Holds `state: SessionState` via `useReducer(transition, ...)`.
  3. Owns `tts = useTutorTTS()` and `mic = useMicRecorder({ maxMs: VITE_TUTOR_MAX_RECORD_MS })`.
  4. Wires effects: when `state.kind === 'ai_speaking'` → `tts.play(...)` then dispatch `AI_AUDIO_ENDED`. When `state.kind === 'recording'` → `mic.start()`. When `RECORD_STOP` event fires → call `TutorAPI.submitTurn(...)` and dispatch `TURN_RESPONSE` or `TURN_ERROR`.
  5. Exposes `{ state, dispatch, tts, mic }`.

- [ ] **Step 2: Commit.**

```bash
git add src/features/ai-tutor/hooks/useTutorSession.ts
git commit -m "feat(ai-tutor): useTutorSession orchestrator hook"
```

### Task 11.3: `useResumeOrStart`

- [ ] **Step 1: Implement** taking `{ slug, scenarioDetail }`. Returns `{ existingActiveSessionId, startFresh, startContinue, isStarting }`. `startFresh` calls `TutorAPI.startSession(slug, 'fresh')`; `startContinue` calls with `'continue'`. Both navigate to `/ai-tutor/scenarios/:slug/session/:sessionId` on success.

- [ ] **Step 2: Commit.**

```bash
git add src/features/ai-tutor/hooks/useResumeOrStart.ts
git commit -m "feat(ai-tutor): useResumeOrStart hook"
```

---

## Phase 12 — `AiTutorHomePage`

**Files:**
- Create: `src/pages/ai-tutor/AiTutorHomePage.tsx`
- Create: `src/features/ai-tutor/components/TrialCtaCard.tsx`
- Create: `src/features/ai-tutor/components/FeaturedLessonCard.tsx`
- Create: `src/features/ai-tutor/components/ScenarioCard.tsx`
- Test: component-level tests for each card

### Task 12.1: Cards

- [ ] **Step 1: `TrialCtaCard`** — renders the "Get unlimited AI Tutor access free / Start your free trial" card; click → toast "Free trial coming soon — your AI Tutor is currently free!" using existing toast helper.

- [ ] **Step 2: `FeaturedLessonCard`** — props `{ scenario: TutorScenarioSummary }`. Renders Free pill (top-right), `title_vi` (large/prominent), `title_en` (small/muted underneath), Start button → navigate to `/ai-tutor/scenarios/{slug}/phrasebook`.

- [ ] **Step 3: `ScenarioCard`** — smaller variant for the Free Talk grid; same nav target.

- [ ] **Step 4: Tests** for each card (renders, click action). Commit.

```bash
git add src/features/ai-tutor/components/TrialCtaCard.tsx \
        src/features/ai-tutor/components/FeaturedLessonCard.tsx \
        src/features/ai-tutor/components/ScenarioCard.tsx
git commit -m "feat(ai-tutor): home cards (trial CTA stub, featured lesson, scenario)"
```

### Task 12.2: `AiTutorHomePage`

- [ ] **Step 1: Implement page** that:
  1. Calls `TutorAPI.listScenarios()`.
  2. Renders `<TrialCtaCard />`, then `<h2>{t('tutor.home.lessonsHeader')}</h2>` + first scenario as `<FeaturedLessonCard />`, then `<h2 id="free-talk">{t('tutor.home.freeTalkHeader')}</h2>` + grid of `<ScenarioCard />`s for all scenarios.
  3. If `profile.native_language !== 'vi'`: render dismissible banner ("AI Tutor is currently optimized for Vietnamese learners…").

- [ ] **Step 2: Commit.**

```bash
git add src/pages/ai-tutor/AiTutorHomePage.tsx
git commit -m "feat(ai-tutor): AiTutorHomePage"
```

---

## Phase 13 — `PhrasebookPage`

**Files:**
- Create: `src/pages/ai-tutor/PhrasebookPage.tsx`
- Create: `src/features/ai-tutor/components/PhraseCard.tsx`

### Task 13.1: `PhraseCard`

- [ ] **Step 1: Implement** with props `{ phrase: TutorPhrase }`. Renders `phrase_en`, `translation_vi`, Listen button. On Listen click: `tts.play({text: phrase.phrase_en, audioUrl: phrase.audio_url})`.

- [ ] **Step 2: Commit.**

### Task 13.2: `PhrasebookPage`

- [ ] **Step 1: Implement page** using `useScenario(slug)`. Renders heading ("Useful phrases for this conversation" + Vi support text), a list of `<PhraseCard />`s for `scenario.phrases`, Next button at bottom → navigate to `/ai-tutor/scenarios/:slug/briefing`.

- [ ] **Step 2: Commit.**

```bash
git add src/pages/ai-tutor/PhrasebookPage.tsx src/features/ai-tutor/components/PhraseCard.tsx
git commit -m "feat(ai-tutor): PhrasebookPage with PhraseCard + audio playback"
```

---

## Phase 14 — `ScenarioBriefingPage`

**Files:**
- Create: `src/pages/ai-tutor/ScenarioBriefingPage.tsx`

### Task 14.1: Briefing layout + resume prompt

- [ ] **Step 1: Implement page** using `useScenario(slug)` + `useResumeOrStart()`. Layout:
  1. Vi title (large), En title (smaller, muted)
  2. Vi description (prominent), En description (muted)
  3. Goal section: "Mục tiêu: ..." over "Goal: ..."
  4. Task list (4 numbered items: Vi instruction over En instruction)
  5. If `scenario.existing_active_session_id`: show two buttons "Continue where you left off" (calls `startContinue`) and "Start fresh" (calls `startFresh`)
  6. Else: single "Start lesson" button (calls `startFresh`)

- [ ] **Step 2: Commit.**

```bash
git add src/pages/ai-tutor/ScenarioBriefingPage.tsx
git commit -m "feat(ai-tutor): ScenarioBriefingPage with resume prompt"
```

---

## Phase 15 — `TutorSessionPage` + dialogue components

**Files:**
- Create: `src/pages/ai-tutor/TutorSessionPage.tsx`
- Create: `src/features/ai-tutor/components/TaskProgressBanner.tsx`
- Create: `src/features/ai-tutor/components/DialogueCard.tsx`
- Create: `src/features/ai-tutor/components/DialogueButtons.tsx`
- Create: `src/features/ai-tutor/components/RecordingPanel.tsx`
- Create: `src/features/ai-tutor/components/EndLessonModal.tsx`
- Create: `src/features/ai-tutor/components/CorrectionCard.tsx`

### Task 15.1: Dialogue components

- [ ] **Step 1: `TaskProgressBanner`** props `{ tasksDone, tasksTotal, currentTaskVi, currentTaskEn }`. Renders "Tasks: {done}/{total} completed" + current task card with Vi prominent + En muted + checkmark glyph (gray/green).

- [ ] **Step 2: `DialogueCard`** props `{ turn: TutorTurnDTO, hideText: boolean, onRepeat, onTranslate, onToggleHide, onFlag }`. AI variant: shows speaker label + text (or "—" when hidden) + DialogueButtons. User variant: simple chat bubble with transcript text.

- [ ] **Step 3: `DialogueButtons`** props `{ onRepeat, onTranslate, onToggleHide, onFlag }`. Four icon buttons.

- [ ] **Step 4: `RecordingPanel`** props `{ state, mic, onSubmit, onCancel }`. When `state.kind === 'awaiting_user_speech'`: shows "Speak now" + record button. When `recording`: shows waveform canvas (via `useWaveform({stream: mic.stream, isActive: true})`) + Cancel + Submit buttons.

- [ ] **Step 5: `EndLessonModal`** props `{ isOpen, tasksDone, tasksTotal, onConfirm, onDismiss }`. "Finish lesson? You've completed X of Y tasks." + two buttons.

- [ ] **Step 6: `CorrectionCard`** props `{ correction: TurnCorrection, originalTranscript: string }`. Green border + light green bg. Renders "You said: {transcript}", "Better: {correction.corrected_en}", "Vietnamese explanation: {correction.explanation_vi}", optional Vi translation.

- [ ] **Step 7: Component tests** for at minimum TaskProgressBanner, DialogueButtons (clicks fire callbacks), EndLessonModal (confirm/dismiss).

- [ ] **Step 8: Commit.**

```bash
git add src/features/ai-tutor/components/TaskProgressBanner.tsx \
        src/features/ai-tutor/components/DialogueCard.tsx \
        src/features/ai-tutor/components/DialogueButtons.tsx \
        src/features/ai-tutor/components/RecordingPanel.tsx \
        src/features/ai-tutor/components/EndLessonModal.tsx \
        src/features/ai-tutor/components/CorrectionCard.tsx
git commit -m "feat(ai-tutor): dialogue + recording + correction + end-lesson components"
```

### Task 15.2: `TutorSessionPage` orchestration

- [ ] **Step 1: Implement page** that:
  1. Reads `:sessionId` from URL.
  2. Checks `isBrowserSupported()` first; if not → render unsupported screen + `reportTutorEvent('unsupported_browser', { user_agent, missing })`.
  3. Calls `useTutorSession({ sessionId })`.
  4. Renders `TaskProgressBanner` (computes from `state` + scenario tasks), scrollable list of `<DialogueCard />`s for all turns, `<RecordingPanel />` at bottom (gated on state.kind), `<EndLessonModal />` when `state.kind === 'end_lesson_confirm'`.
  5. On `evaluation.kind === 'vi_spoken'`: show toast "Hãy nói bằng tiếng Anh nhé! / Try speaking in English."
  6. On `state.kind === 'error'`: show toast + retry button per cause.
  7. On `state.kind === 'lesson_complete'`: render the lesson-complete screen (Phase 16).

- [ ] **Step 2: Commit.**

```bash
git add src/pages/ai-tutor/TutorSessionPage.tsx
git commit -m "feat(ai-tutor): TutorSessionPage orchestration"
```

---

## Phase 16 — Lesson-complete screen with corrections

**Files:**
- Create: `src/features/ai-tutor/components/LessonCompleteScreen.tsx`

### Task 16.1: Lesson-complete UI

- [ ] **Step 1: Implement `LessonCompleteScreen`** props `{ xpAwarded, corrections, turns, scenarioTasks }`. Layout:
  1. Header: "Lesson finished" + XP pill ("+25 XP")
  2. For each correction in `corrections`: render `<CorrectionCard />` immediately under the corresponding turn (use turn.id from `correction.turn_id` if backend includes it, otherwise interleave by order).
  3. On mount: scroll to first correction via `scrollIntoView({behavior:'smooth'})`.
  4. Bottom buttons:
     - Primary: **Continue** → `navigate('/ai-tutor')`
     - Secondary: **View dashboard** → `navigate('/dashboard')`

- [ ] **Step 2: Wire it into `TutorSessionPage`** when `state.kind === 'lesson_complete'`.

- [ ] **Step 3: Commit.**

```bash
git add src/features/ai-tutor/components/LessonCompleteScreen.tsx \
        src/pages/ai-tutor/TutorSessionPage.tsx
git commit -m "feat(ai-tutor): LessonCompleteScreen with Continue + dashboard CTAs"
```

---

## Phase 17 — Homepage CTA swap + i18n keys

**Files:**
- Modify: `src/components/home/FeaturesSection.tsx` and/or `FinalCtaSection.tsx`
- Modify: `src/locales/en/en.json`, `src/locales/vi/vi.json`

### Task 17.1: Swap public homepage CTA

- [ ] **Step 1: `grep -rn "flashcard" src/pages/Home.tsx src/components/home/`** to find the existing flashcards CTA.

- [ ] **Step 2: Replace** the flashcards CTA copy/destination with:
  - Heading: `t('home.cta.aiTutor.heading')` ("Practice Speaking with Your AI Tutor")
  - Subtext: `t('home.cta.aiTutor.subtext')` ("Learn real English conversations with Vietnamese support.")
  - Button: `t('home.cta.aiTutor.button')` ("Start speaking") → navigate to `/ai-tutor`

  Gate the swap on `VITE_AI_TUTOR_ENABLED === 'true'`; otherwise leave existing flashcards CTA in place. (Cleanest: a single component that reads the flag and renders one or the other.)

- [ ] **Step 3: Commit.**

```bash
git add src/components/home/FeaturesSection.tsx src/components/home/FinalCtaSection.tsx
git commit -m "feat(home): swap Flashcards CTA → AI Tutor CTA when flag enabled"
```

### Task 17.2: i18n keys

- [ ] **Step 1: Add to `src/locales/en/en.json` under a new `tutor` namespace**:

```json
"tutor": {
  "home": {
    "lessonsHeader": "Lessons",
    "freeTalkHeader": "Free Talk",
    "freeTalkSubtitle": "Practice real conversations in everyday situations.",
    "trialTitle": "Get unlimited AI Tutor access free",
    "trialBody": "Start your free trial",
    "trialToast": "Free trial coming soon — your AI Tutor is currently free!",
    "nonViBanner": "AI Tutor is currently optimized for Vietnamese learners. English-only mode coming soon."
  },
  "phrasebook": {
    "title": "Useful phrases for this conversation",
    "viSupport": "Học một vài câu hữu ích trước khi bắt đầu cuộc trò chuyện.",
    "next": "Next"
  },
  "briefing": {
    "goalLabel": "Goal:",
    "tasksLabel": "Tasks",
    "startLesson": "Start lesson",
    "continueWhereLeftOff": "Continue where you left off",
    "startFresh": "Start fresh"
  },
  "session": {
    "tasksProgress": "Tasks: {{done}} / {{total}} completed",
    "currentTask": "Current task:",
    "listen": "Listen",
    "speakNow": "Speak now",
    "submit": "Submit",
    "cancel": "Cancel",
    "repeat": "Repeat",
    "translate": "Translate",
    "hideText": "Hide text",
    "showText": "Show text",
    "flagForPractice": "Flag for practice",
    "viSpokenToast": "Hãy nói bằng tiếng Anh nhé! / Try speaking in English.",
    "sttFailedToast": "Couldn't hear that — try again.",
    "rateLimitToast": "You're going fast! Wait a moment.",
    "micDeniedHelp": "Microphone access is required. Click the lock icon in your browser's address bar to allow it."
  },
  "endLesson": {
    "title": "Finish lesson?",
    "body": "You've completed {{done}} of {{total}} tasks.",
    "confirm": "End lesson",
    "dismiss": "Continue practicing"
  },
  "lessonComplete": {
    "title": "Lesson finished",
    "xpEarned": "+{{xp}} XP",
    "continue": "Continue",
    "viewDashboard": "View dashboard"
  },
  "comingSoon": {
    "review": "Speech review coming soon",
    "challenge": "Challenge mode coming soon"
  }
},
"home": {
  "cta": {
    "aiTutor": {
      "heading": "Practice Speaking with Your AI Tutor",
      "subtext": "Learn real English conversations with Vietnamese support.",
      "button": "Start speaking"
    }
  }
}
```

- [ ] **Step 2: Translate the same keys in `src/locales/vi/vi.json`** (Vi-prominent strings already authored in scenario rows; this is for UI copy).

- [ ] **Step 3: For `th` and `zh-CN`**: leave the `tutor` namespace absent so `fallbackLng: 'en'` kicks in. Verify by toggling locale in the app.

- [ ] **Step 4: Commit.**

```bash
git add src/locales/
git commit -m "feat(i18n): tutor.* + home.cta.aiTutor.* keys (en + vi)"
```

---

## Phase 18 — E2E + manual QA + rollout

**Files:**
- Create: `tests/e2e/ai-tutor-flow.spec.ts`
- Create: `docs/ai-tutor-manual-qa.md`

### Task 18.1: Playwright E2E

- [ ] **Step 1: Create the spec** that runs against a backend with `STT_PROVIDER=stub` (set `STUB_TRANSCRIPT` env or use a test endpoint). Steps:
  1. Login as E2E test user.
  2. Visit `/ai-tutor` → assert featured card visible.
  3. Click Start → phrasebook → Next → briefing → Start lesson.
  4. Wait for `data-testid="audio-ready"` on the AI dialogue card.
  5. Click record → wait 100ms → click submit (audio blob is fake; backend stub returns "my name is tom").
  6. Assert task 1 ✅ visible.
  7. Repeat for tasks 2–4 with appropriate stub transcripts.
  8. Assert lesson-complete screen with Continue button.
  9. Click Continue → assert URL is `/ai-tutor`.

- [ ] **Step 2: Run** `npx playwright test ai-tutor-flow`.

- [ ] **Step 3: Commit.**

```bash
git add tests/e2e/ai-tutor-flow.spec.ts
git commit -m "test(e2e): AI tutor end-to-end happy path with stub STT"
```

### Task 18.2: Manual QA checklist

- [ ] **Step 1: Create `docs/ai-tutor-manual-qa.md`** listing the 17 acceptance criteria from spec §14, plus the device matrix from §4 (Chrome/Edge/Firefox desktop + iOS Safari 16+ + Chrome Android 100+). Each item gets a checkbox + space for notes.

- [ ] **Step 2: Commit.**

```bash
git add docs/ai-tutor-manual-qa.md
git commit -m "docs(qa): AI tutor manual QA checklist"
```

### Task 18.3: Rollout

- [ ] **Step 1: Local staging:** Apply migrations to a Supabase dev project. Run `npm run tutor-audio -- --scenario meeting-someone-new`. Verify Storage uploads.

- [ ] **Step 2: Backend deploy:** Push branch → Railway picks up. Set env vars in Railway service settings: `AI_TUTOR_ENABLED=true`, `GROQ_API_KEY=…`, `GROQ_STT_MODEL=whisper-large-v3`, `STT_PROVIDER=groq`. Smoke-test from local: `curl https://<railway>/api/v1/health` should report `ai_tutor_enabled: true`.

- [ ] **Step 3: Frontend preview:** Push branch → Vercel builds preview. In Vercel dashboard for the preview branch, set `VITE_AI_TUTOR_ENABLED=true` and redeploy with cache disabled. Walk through the manual QA checklist on real devices.

- [ ] **Step 4: Production:** Merge PR → Vercel deploys to prod. Set `VITE_AI_TUTOR_ENABLED=true` in production env vars. Final smoke check.

- [ ] **Step 5: Tag the release.**

```bash
git tag -a v-ai-tutor-spec1 -m "AI Tutor Spec 1: shell + Meeting someone new"
git push origin v-ai-tutor-spec1
```

---

## Self-review pass

- [x] Spec §1 scope: covered by Phases 1–18.
- [x] Spec §2 locked decisions: each surfaces in the relevant phase (Groq config in 2.2; XP formula in 4.5; storage paths in 4.1; etc.).
- [x] Spec §3 IA: routes wired in Phase 10; sidebar entry in 10.3; CTA swap in 17.1.
- [x] Spec §4 defaults: end-lesson detection in 3.2; VI-spoken in 3.2; resume in 11.3 + 14.1; trial CTA in 12.1; Challenge/Review stubs in 10.1; browser matrix in 8.1 + 18.2; phrasebook Listen in 13.1; pre-gen in Phase 6; record cap in 8.2; flag-for-practice no-op in 15.1.
- [x] Spec §5 data model: Phase 1 covers all 6 tables, RLS, functions, bucket, seed; deferred `ai_tutor_review_items` is explicitly NOT created.
- [x] Spec §6 backend: Phases 2–5 cover models, STT provider, evaluator, services, endpoints. Turn pipeline order verified in 4.4.
- [x] Spec §7 frontend layout: Phase 10 covers TutorLayout + routing.
- [x] Spec §8 audio I/O: Phase 8.
- [x] Spec §9 error handling: surfaces across 4.4 (backend), 8.2/8.4 (frontend telemetry), 15.2 (UI handling).
- [x] Spec §10 telemetry: backend writes via `record_tutor_exchange_tx` + service handlers (Phase 4); frontend events endpoint in 5.3; frontend caller in 7.3.
- [x] Spec §11 i18n: Phase 17.2.
- [x] Spec §12 feature flag: 7.3 (env), 10.2 (route gate), 5.1 (backend gate), 18.3 (rollout).
- [x] Spec §13 testing: covered per-phase (unit + integration + component) plus 18.1 e2e + 18.2 manual.
- [x] Spec §14 acceptance criteria: 18.2 surfaces them as a manual checklist.
- [x] Type consistency: `TutorTurnDTO`, `TurnCorrection`, `EvaluationResult`, `TutorSessionDTO`, `SessionState`, `record_tutor_exchange_tx`, `audio_path` (DB) vs `audio_url` (DTO/API) consistent throughout.
- [x] No placeholders / TODOs / "implement later" / "similar to Task N".

**One gap noted and now addressed:** the original draft put the rate-limit bucket key for `/me/ai-tutor/events` and `/me/ai-tutor/sessions/:id/turns` in the same dictionary, which would let event spam exhaust the turn budget. Task 5.3 uses a prefixed key (`f"events:{user_id}"`) to give events their own bucket. Mention this explicitly when implementing.

