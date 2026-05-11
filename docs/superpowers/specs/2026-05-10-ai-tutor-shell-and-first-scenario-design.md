# AI Tutor Shell + First Scenario — Design Spec

**Date:** 2026-05-10
**Status:** Draft, pending user review
**Source briefs:** `docs/ai-tutor-speech-implementation-spec.md`, `docs/local-first-ai-tutor-speech-mvp.md`

---

## 1. Purpose & scope

This is **Spec 1 of an N-spec rollout** for the AI Tutor speech feature. It delivers the AI Tutor shell, navigation, and a single end-to-end scenario ("Meeting someone new" / "Gặp người mới") with real speech-to-text (Groq Whisper, model configurable), pre-generated TTS playback, browser SpeechSynthesis fallback, and a rule-based task evaluator. No LLM calls in Spec 1.

**Goal:** prove the guided speaking loop end-to-end on real devices, behind a feature flag, before investing in LLM evaluation, additional scenarios, post-session streak/review flow, or paywall infrastructure.

### In scope

- Routes: `/ai-tutor`, `/ai-tutor/scenarios/:slug/phrasebook`, `/ai-tutor/scenarios/:slug/briefing`, `/ai-tutor/scenarios/:slug/session/:sessionId`
- New `TutorLayout` (top tabs: Home / Course; persistent footer nav: Home / Free Talk / Review / Challenge / Profile)
- Public homepage CTA swap: Flashcards → AI Tutor
- AI Tutor home: trial CTA stub, featured lesson card, scenario list
- Phrasebook page (8 phrases for the seed scenario)
- Scenario briefing page (Vi-prominent, En muted)
- Dialogue session page: `TaskProgressBanner`, `DialogueCard`s, `RecordingPanel`, browser TTS playback w/ pre-generated audio
- Session lifecycle backend: start / submit-turn / finish / abandon
- Rule-based task evaluator (regex `accept_patterns` + template-driven correction)
- End-of-lesson correction cards (template-driven)
- "End lesson" voice command → confirmation modal → finish
- Resume mid-session (URL contains sessionId; refresh restores state)
- Audio pre-generation script (`scripts/generate-tutor-audio.ts`, mirrors `generate-lesson-images.ts`)
- Telemetry: split between `user_activity_log` (progress) and new `ai_tutor_events` (diagnostics)
- Feature flags: `VITE_AI_TUTOR_ENABLED` (frontend) + `ai_tutor_enabled` (backend)
- Sidebar entry in existing `AuthLayout` for AI Tutor (gated on flag)

### Out of scope (deferred to later specs)

- **Spec 2:** LLM evaluator fallback, Vietnamese-spoken handling beyond rejection toast, additional scenarios, dynamic AI lines, hosted TTS for dynamic lines.
- **Spec 3:** Streak page, review summary, repeat-after-me, `ai_tutor_review_items` table population.
- **Spec 4:** Free trial / paywall, Challenge mode, Vietnamese TTS, realtime voice, multi-native-language support beyond `vi`.

---

## 2. Locked decisions (with rationale)

| Decision | Choice | Rationale |
|---|---|---|
| **STT provider** | Groq Whisper API; model configurable via `GROQ_STT_MODEL` env (default `whisper-large-v3`) | Low cost, sub-second p50 latency on short clips, no self-hosting burden, language pinnable to English. Model swappable to `whisper-large-v3-turbo` or future Groq STT models without code changes. |
| **TTS strategy** | Pre-generated MP3 in Supabase Storage for fixed lines + browser `SpeechSynthesis` fallback | Voice consistency for pronunciation modeling; zero recurring TTS cost for the seed scenario. |
| **Course tab destination** | Existing `/lessons` | No parallel lesson system; tutor shell links out. |
| **Streak / XP / activity** | Reuse `user_stats` + `user_activity_log` + `_derive_streak`; no new streak/XP tables | Single source of truth for learner progress across lessons + tutor. |
| **Scenario data model** | Fresh `ai_tutor_*` tables, distinct from `/conversations` 24-scenario hardcoded list | Tutor scenarios are task-driven with success criteria; conversations are roleplay. Coupling them tangles two product models. |
| **Spec 1 evaluator** | Rule-based only (regex `accept_patterns` + template `correction_templates`); zero LLM calls | Sub-millisecond, deterministic, free; LLM lives in Spec 2 as a fallback for un-matched transcripts. |
| **Lesson-end CTA** | `Continue → /ai-tutor` (primary), `View dashboard → /dashboard` (secondary) | A disabled button feels broken; both targets are real. Spec 3 replaces Continue with `/streak`. |
| **End-lesson detection ordering** | End-lesson regex **before** Vietnamese-spoken detection | Allows `kết thúc bài học` to reach the finish-confirmation modal instead of the VI-rejection path. |
| **Vietnamese-spoken detection** | Diacritic regex on transcript only (`[ạ-ỹăâđêôơư]`); do **not** trust Groq language tag | Best-effort; unaccented romanization will pass through, which is acceptable for v1. |
| **STT failure semantics** | Backend returns 503 with `{error: 'stt_failed', retryable: true}` **before any DB write**; frontend shows toast + re-enables mic | Session state provably unchanged on failure; no partial turn rows. |
| **Audio storage** | Store `audio_path` (e.g., `scenarios/meeting-someone-new/opening.mp3`) in DB; backend resolves to public URL on response | Bucket-renames don't break records; consistent with Supabase Storage helpers. |
| **User audio retention** | Not stored. Bytes live in request handler memory, sent to Groq, dropped. `ai_tutor_turns.audio_path IS NULL` for `speaker='user'` rows. | Privacy + cost. |
| **Platform target** | Desktop + mobile web from day one (Chrome/Edge/Firefox latest 2 + iOS Safari 16+ + Chrome Android 100+) | Most learners are on phones; ignoring iOS is not viable. |
| **Telemetry split** | `user_activity_log` for progress (`tutor_session_completed`, `tutor_task_completed`); new `ai_tutor_events` table for diagnostics (failures, abandons) | `user_activity_log` stays learner-progress-oriented. |
| **i18n** | Existing locale files with `tutor.*` namespace; no build-time merge | Consistent with current `flashcards.*`, `dashboard.*` patterns. `en` + `vi` translated; `th`/`zh-CN` fall through to `en`. |
| **Sidebar relationship** | `/ai-tutor/*` uses `TutorLayout` only (no sidebar). Existing `AuthLayout` sidebar gets an "AI Tutor" entry when `VITE_AI_TUTOR_ENABLED=true`. | Clean shell separation; one entry-point from the rest of the app. |
| **Trial CTA** | Stub card on tutor home; click → toast "Free trial coming soon — your AI Tutor is currently free!" | No payment infra yet; visible placeholder so the layout is honest about what's coming. |
| **Footer Challenge & Review items** | Both stub. Review specifically because existing `/review` is SM-2 flashcards (not compatible with tutor speech review). | Keeps 5-item nav layout; both link to "Coming soon" sheets. |

---

## 3. Information architecture

### Routes (new)

```text
/ai-tutor                                          → AiTutorHomePage         (TutorLayout)
/ai-tutor/scenarios/:slug/phrasebook              → PhrasebookPage          (TutorLayout)
/ai-tutor/scenarios/:slug/briefing                → ScenarioBriefingPage    (TutorLayout)
/ai-tutor/scenarios/:slug/session/:sessionId     → TutorSessionPage        (TutorLayout)
```

All under `<RequireAuth><TutorLayout /></RequireAuth>`. Anonymous → `/login?next=…`.

### `TutorLayout` chrome

- **Top tabs (sticky header):** Home (`/ai-tutor`) · Course (`/lessons`)
- **Persistent footer nav (sticky bottom, 5 items):**
  - Home (`/ai-tutor`)
  - Free Talk (anchors to scenario list section on `/ai-tutor`)
  - Review (opens `ComingSoonSheet`)
  - Challenge (opens `ComingSoonSheet`)
  - Profile (`/settings`)
- No sidebar inside tutor routes.

### Existing app sidebar entry

- `AuthLayout` sidebar gets a new "AI Tutor" link → `/ai-tutor`, gated on `VITE_AI_TUTOR_ENABLED=true`. Placed above "Flashcards" in the nav order.

### Homepage CTA swap

- Public homepage (`src/pages/Home.tsx` → `FeaturesSection` and/or `FinalCtaSection`): replace flashcards copy + destination with AI Tutor copy + `/ai-tutor` destination.
- CTA copy:
  - Heading: "Practice Speaking with Your AI Tutor"
  - Subtext: "Learn real English conversations with Vietnamese support."
  - Button: "Start speaking"
- Authenticated home (`AuthHome.tsx`) is **untouched** in Spec 1. Existing cards stay.

---

## 4. Defaults for small decisions

| Item | Default |
|---|---|
| **End-lesson detection** | Backend regex on normalized transcript: `/\b(end\|finish\|stop)\s+(the\s+)?(lesson\|session)\b/i` + Vietnamese variant `/kết thúc bài học/i`. Only fires after at least one user turn. Triggers `EndLessonModal` ("Finish lesson? You've completed X of Y tasks." with Continue practicing / End lesson buttons). Only on confirm does session move to `lesson_complete`. |
| **VI-spoken handling** | Diacritic regex `/[ạ-ỹăâđêôơư]/` on transcript. On match: don't write a turn, return `{evaluation: {kind: 'vi_spoken'}}`. Frontend toast (vi+en): "Hãy nói bằng tiếng Anh nhé! / Try speaking in English." Mic re-enabled, no penalty, no advance. |
| **Resume session** | Active session detected via `UNIQUE(user_id, scenario_id) WHERE status='active'` partial index. On briefing-page entry with active session: prompt "Continue where you left off / Start fresh." Continue → navigate to `/session/:sessionId`, hydrate from `GET /sessions/:id`, replay last AI turn audio + text, jump to `awaiting_user_speech`. Mid-session refresh: same hydration path. |
| **Trial CTA** | Card on tutor home with `aria-disabled` styling; click → toast "Free trial coming soon — your AI Tutor is currently free!" No route. |
| **Footer Challenge / Review** | Both render as nav items, click opens a small bottom sheet ("Challenge mode coming soon" / "Speech review coming soon"). |
| **Browser support matrix** | Chrome/Edge/Firefox latest 2 versions (desktop), iOS Safari 16+, Chrome Android 100+. Older browsers: `TutorSessionPage` shows an unsupported-browser screen with desktop fallback link. |
| **Phrasebook "Listen"** | Uses pre-generated MP3 (Supabase Storage `ai-tutor-audio` bucket) when `phrase.audio_path` set; falls back to browser `SpeechSynthesis`. |
| **Audio pre-generation provider** | ElevenLabs free tier (10k chars/mo, covers seed scenario for $0). `ELEVENLABS_API_KEY` lives in `backend/.env`, server-side only. Provider abstracted so OpenAI TTS / Azure / etc. can be swapped via `--provider` flag. |
| **Recording length cap** | 20s hard cap (auto-submit). Configurable via `VITE_TUTOR_MAX_RECORD_MS`. |
| **Dialogue card buttons** | `Repeat`, `Translate`, `Hide text`. `Flag for practice later` is rendered but no-op in Spec 1 (handler logged for telemetry). |

---

## 5. Data model

### New migration: `supabase/migrations/20260510000001_ai_tutor_schema.sql`

```sql
-- Catalog (read by all authenticated users; writes service_role only)
CREATE TABLE ai_tutor_scenarios (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                   text UNIQUE NOT NULL,
  mode                   text NOT NULL CHECK (mode IN ('course','free_talk')),
  level                  text NOT NULL,
  title_en               text NOT NULL,
  title_vi               text NOT NULL,
  description_en         text,
  description_vi         text,
  goal_en                text,
  goal_vi                text,
  is_free                boolean DEFAULT true,
  ai_persona             text,
  opening_line_en        text NOT NULL,
  opening_audio_path     text,
  sort_order             int DEFAULT 0,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

CREATE TABLE ai_tutor_scenario_tasks (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id              uuid NOT NULL REFERENCES ai_tutor_scenarios(id) ON DELETE CASCADE,
  task_key                 text NOT NULL,
  title_en                 text NOT NULL,
  title_vi                 text NOT NULL,
  accept_patterns          jsonb NOT NULL,           -- ["my name is", {"regex":"^call me \\w+"}]
  correction_templates     jsonb DEFAULT '[]',       -- [{"match_regex":"...","corrected_en_template":"...","explanation_vi":"...","explanation_key":"...","severity":"minor"}]
  next_ai_line_en          text,
  next_ai_line_audio_path  text,
  sort_order               int NOT NULL,
  UNIQUE(scenario_id, task_key)
);

CREATE TABLE ai_tutor_scenario_phrases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id     uuid NOT NULL REFERENCES ai_tutor_scenarios(id) ON DELETE CASCADE,
  phrase_en       text NOT NULL,
  translation_vi  text NOT NULL,
  audio_path      text,
  sort_order      int NOT NULL
);

-- Per-user (RLS: SELECT/UPDATE own rows; service_role for backend writes)
CREATE TABLE ai_tutor_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id),
  scenario_id         uuid NOT NULL REFERENCES ai_tutor_scenarios(id),
  status              text NOT NULL CHECK (status IN ('active','completed','abandoned')),
  current_task_id     uuid REFERENCES ai_tutor_scenario_tasks(id),
  completed_task_ids  uuid[] DEFAULT '{}',
  mistake_count       int DEFAULT 0,
  xp_awarded          int DEFAULT 0,
  started_at          timestamptz DEFAULT now(),
  last_activity_at    timestamptz DEFAULT now(),
  completed_at        timestamptz,
  CHECK (status != 'completed' OR completed_at IS NOT NULL)
);

-- One active session per user per scenario at a time
CREATE UNIQUE INDEX ai_tutor_sessions_user_scenario_active
  ON ai_tutor_sessions(user_id, scenario_id) WHERE status = 'active';

CREATE TABLE ai_tutor_turns (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid NOT NULL REFERENCES ai_tutor_sessions(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users(id),     -- denormalized for RLS performance
  task_id           uuid REFERENCES ai_tutor_scenario_tasks(id),
  speaker           text NOT NULL CHECK (speaker IN ('ai','user')),
  text_en           text,
  audio_path        text,                                         -- AI: pre-generated; user: NULL in Spec 1
  evaluator_result  jsonb,                                        -- user turns only
  task_completed    boolean DEFAULT false,
  correction        jsonb,                                        -- {corrected_en, explanation_vi, translation_vi, severity, explanation_key}
  created_at        timestamptz DEFAULT now()
);
CREATE INDEX ai_tutor_turns_session ON ai_tutor_turns(session_id, created_at);

-- Product diagnostics; separate from learner progress
CREATE TABLE ai_tutor_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id),                     -- nullable for unauth events
  session_id  uuid REFERENCES ai_tutor_sessions(id) ON DELETE SET NULL,
  event_type  text NOT NULL,                                       -- e.g. 'turn.failed.stt', 'session.abandoned', 'mic.denied'
  payload     jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX ai_tutor_events_user_recent ON ai_tutor_events(user_id, created_at DESC);
CREATE INDEX ai_tutor_events_type_recent ON ai_tutor_events(event_type, created_at DESC);
```

### Existing-table changes

- `user_activity_log`: add new event types `tutor_session_completed`, `tutor_task_completed` to whatever enum/CHECK constrains the column. (Spec writer must inspect actual constraint shape during implementation; the existing migration `20260503000001_phase1_progress_tracking.sql` is the authoritative reference.)
- No changes to `user_stats` schema; XP increment goes through existing column.

### RLS + grants (mirrors existing `review_items` pattern)

- **Catalog tables** (`ai_tutor_scenarios`, `_tasks`, `_phrases`): `GRANT SELECT TO authenticated`. No anon access. No INSERT/UPDATE/DELETE for any role except `service_role`.
- **Per-user tables** (`ai_tutor_sessions`, `_turns`): RLS policy `user_id = auth.uid()` for `SELECT`. All writes via `service_role` only (backend through transactional functions).
- **`ai_tutor_events`**: writes via `service_role`. No SELECT from `authenticated` (it's diagnostic; expose later via admin endpoint if needed).

### Transactional Postgres functions (in same migration)

```sql
start_tutor_session_tx(_user_id, _scenario_id, _mode)
  → returns uuid (session_id)
  -- _mode IN ('fresh', 'continue')
  -- 'continue': returns existing active session_id if one exists for (user, scenario);
  --             otherwise creates a new active session.
  -- 'fresh':    if an active session exists for (user, scenario), atomically marks it
  --             status='abandoned' (with completed_at=NULL, ai_tutor_events row
  --             event_type='session.abandoned', payload={reason:'started_fresh'}),
  --             then creates and returns a new active session.
  -- Both branches honor the UNIQUE(user_id, scenario_id) WHERE status='active' partial index.
  -- Sets current_task_id to the first task by sort_order.

record_tutor_exchange_tx(
  _session_id, _user_id,
  _user_text, _user_evaluator_result, _user_correction,
  _completed_task_id,           -- nullable; the task that just completed (or NULL if no advance)
  _next_task_id,                -- nullable; the task to set as current_task_id (or NULL if no advance / lesson done)
  _ai_text, _ai_audio_path,     -- nullable; AI's response turn (NULL if end-lesson detected and we're not auto-replying)
  _ai_task_id                   -- nullable; the task the AI is now prompting for (typically = _next_task_id)
) → void
  -- ATOMIC. Replaces the prior pair of record_tutor_turn_tx calls.
  -- 1. Inserts ai_tutor_turns row for user (speaker='user', text_en=_user_text,
  --    evaluator_result=_user_evaluator_result, correction=_user_correction,
  --    task_id=session.current_task_id BEFORE update,
  --    task_completed=(_completed_task_id IS NOT NULL)).
  -- 2. If _ai_text IS NOT NULL: inserts ai_tutor_turns row for AI
  --    (speaker='ai', text_en=_ai_text, audio_path=_ai_audio_path, task_id=_ai_task_id).
  -- 3. If _completed_task_id IS NOT NULL:
  --      - appends to ai_tutor_sessions.completed_task_ids
  --      - sets current_task_id = _next_task_id
  --      - inserts user_activity_log row (event_type='tutor_task_completed',
  --        payload={session_id, scenario_slug, task_key, severity, has_correction}).
  -- 4. If _user_correction IS NOT NULL: increments mistake_count.
  -- 5. Always updates last_activity_at = now().
  -- All five steps run in one transaction; partial failure rolls back everything.

complete_tutor_session_tx(_session_id, _xp_awarded) → void
  -- Sets status='completed', completed_at=now(), xp_awarded=_xp_awarded.
  -- Updates user_stats.xp += _xp_awarded.
  -- Inserts user_activity_log row (event_type='tutor_session_completed',
  --   payload={session_id, scenario_slug, xp_awarded, tasks_completed,
  --            mistake_count, duration_s}).
  -- Atomic across all three writes.

abandon_tutor_session_tx(_session_id, _reason) → void
  -- Sets status='abandoned'.
  -- Logs ai_tutor_events row (event_type='session.abandoned', payload={reason: _reason}).
  -- Used for explicit user cancel; the start_tutor_session_tx 'fresh' branch handles
  -- the implicit-abandon-on-restart case inline.
```

All functions: `REVOKE ALL FROM PUBLIC, anon, authenticated; GRANT EXECUTE TO service_role`. Pattern matches existing `complete_lesson_section_tx`.

### Storage bucket

- New public bucket `ai-tutor-audio`. Created in migration with public-read policy.
- Path scheme: `scenarios/<scenario_slug>/<asset_kind>/<id-or-key>.mp3`
  - `scenarios/meeting-someone-new/opening.mp3`
  - `scenarios/meeting-someone-new/tasks/introduce_self.next.mp3`
  - `scenarios/meeting-someone-new/phrases/nice-to-meet-you.mp3`

### Seed content (in same migration)

One scenario, four tasks, eight phrases. Sample:

- `slug='meeting-someone-new'`, `mode='free_talk'`, `level='A1'`, `is_free=true`
- `title_vi='Gặp người mới'`, `title_en='Meeting someone new'`
- `opening_line_en="Hi! Nice to meet you. What's your name?"`
- Tasks (in order): `introduce_self`, `ask_how_are_you`, `say_where_from`, `ask_what_doing_today`
- Each task: hand-tuned `accept_patterns` array + 1–2 `correction_templates`
- Eight phrases per the original spec's §33

`audio_path` columns start NULL; populated by the audio pre-generation script (see §6).

---

## 6. Backend architecture

### New module layout

```text
backend/app/
├── api/v1/
│   └── ai_tutor_session.py            # NEW (distinct from existing ai_tutor.py)
├── services/
│   ├── tutor_scenario_service.py      # NEW — read scenarios/tasks/phrases catalog
│   ├── tutor_session_service.py       # NEW — start/turn/finish lifecycle
│   ├── tutor_evaluator_service.py     # NEW — rule-based evaluator
│   └── stt_provider/
│       ├── __init__.py                # NEW — STTProvider Protocol
│       ├── groq_provider.py           # NEW — Groq Whisper impl
│       └── stub_provider.py           # NEW — for tests
├── models/
│   └── tutor.py                       # NEW — Pydantic models
└── core/
    └── config.py                      # MODIFY — add tutor settings
```

### STT provider abstraction

```python
# stt_provider/__init__.py
from typing import Protocol
from pydantic import BaseModel

class TranscriptResult(BaseModel):
    text: str
    language: str | None = None        # advisory only; not used for VI-spoken detection
    confidence: float | None = None
    duration_ms: int | None = None

class STTProvider(Protocol):
    async def transcribe(
        self,
        audio: bytes,
        mime_type: str,
        prompt: str | None = None,
    ) -> TranscriptResult: ...
```

`GroqSTTProvider`:
- Uses Groq's OpenAI-compatible endpoint (`POST /openai/v1/audio/transcriptions`).
- Model from `settings.groq_stt_model` (default `whisper-large-v3`; configurable per env).
- `language="en"` (always; doesn't auto-detect).
- `prompt` parameter set to current task title to bias vocabulary recognition.
- Timeout: 10s. On timeout/5xx/empty result: raises `STTFailureError` (caught by route handler → 503).

Provider chosen via env: `STT_PROVIDER=groq` (prod) or `stub` (tests). DI in `tutor_session_service`.

### Endpoints (new router under `/api/v1`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/ai-tutor/scenarios` | required | List scenarios for tutor home + free talk grid |
| `GET` | `/api/v1/ai-tutor/scenarios/:slug` | required | Detail: scenario + tasks + phrases + `existing_active_session_id` |
| `POST` | `/api/v1/me/ai-tutor/sessions` | required | Body `{scenario_slug, mode: 'fresh'\|'continue'}`. Calls `start_tutor_session_tx`. |
| `GET` | `/api/v1/me/ai-tutor/sessions/:id` | required | Resume hydration: full session + tasks + last 50 turns |
| `POST` | `/api/v1/me/ai-tutor/sessions/:id/turns` | required | `multipart/form-data` audio+task_id; full turn pipeline (see below) |
| `POST` | `/api/v1/me/ai-tutor/sessions/:id/finish` | required | Awards XP, calls `complete_tutor_session_tx` |
| `POST` | `/api/v1/me/ai-tutor/sessions/:id/abandon` | required | Soft-cancel; `abandon_tutor_session_tx(reason='user_cancelled')` |
| `POST` | `/api/v1/me/ai-tutor/events` | required | Frontend-originated diagnostics. Body `{event_type, payload, session_id?}`. Writes `ai_tutor_events` with `user_id=auth.uid()`. Allowed `event_type` values whitelisted server-side: `mic.denied`, `audio.fallback`, `turn.failed.network`, `unsupported_browser`. Rate-limited 30/min/user. |

Rate limit on `/turns`: reuse the in-memory limiter pattern from `conversations.py` (60/min/user). Audio upload size cap: 2 MB.

### Turn pipeline (`POST /sessions/:id/turns`)

```text
1. Authn + session ownership check + status='active' check                       (~5ms)
2. Validate audio: size <2MB, mime_type ∈ {webm, mp4, wav, ogg}                   (~1ms)
3. STTProvider.transcribe(audio, prompt=current_task.title_en)                   (~500–1500ms)
     → on STTFailureError: log to ai_tutor_events ('turn.failed.stt') ONLY;
       return 503 {error: 'stt_failed', retryable: true}.
       NO writes to ai_tutor_sessions or ai_tutor_turns (session state untouched).
4. End-lesson detection FIRST (regex incl. Vietnamese variant)                    (~1ms)
   → on match: load session counts; return {end_lesson_detected: true, tasks_done,
     tasks_total} WITHOUT writing a turn (frontend opens confirmation modal; only
     the /finish call mutates session state).
5. VI-spoken detection (diacritic regex)                                          (~1ms)
   → on match: NO writes to ai_tutor_sessions or ai_tutor_turns; log
     ai_tutor_events ('turn.vi_spoken'); return {evaluation: {kind: 'vi_spoken'}}.
6. TutorEvaluatorService.evaluate(transcript, current_task)                       (~1ms)
   → returns {task_completed, severity, correction_template?, should_advance,
     matched_pattern?}.
7. Compute next-task pointers (caller-side, before DB call):                      (~1ms)
     completed_task_id = current_task.id IF should_advance ELSE NULL
     next_task = lookup(scenario_tasks WHERE sort_order > current.sort_order
                        ORDER BY sort_order LIMIT 1)
                 IF should_advance ELSE current_task
     next_task_id  = next_task.id IF (should_advance AND next_task IS NOT NULL) ELSE NULL
     all_tasks_done = should_advance AND next_task IS NULL
8. Pick AI's next line:                                                           (~1ms)
   - If should_advance AND next_task IS NOT NULL → use current_task.next_ai_line_en
     (this is the line that *reacts* to completing current task and prompts the next).
   - If all_tasks_done → use a final canned wrap-up line (per-scenario, stored on the
     scenario row as a future column or hard-coded for the seed; for the seed scenario:
     "Great job! That was a really nice chat. Want to end here?").
   - Else (didn't advance) → use task's re-prompt template (a fixed encouragement line
     stored on the task row; for the seed: "Try again — you can do it!").
9. record_tutor_exchange_tx(...) — single atomic call                             (~10–20ms)
   Writes user turn + AI turn + (optionally) advances current_task_id +
   (optionally) inserts user_activity_log 'tutor_task_completed' + bumps
   mistake_count if correction set. See §5 for full contract.
10. Build response payload + return                                               (~5ms)

Target end-to-end: <2.5s p95.
Audio playback start: <500ms after response (Supabase CDN).
```

**Note on "no DB writes" in steps 3 and 5:** these refer specifically to **no writes to `ai_tutor_sessions` or `ai_tutor_turns`** — session state is provably unchanged on STT failure or VI-spoken rejection. Diagnostic writes to `ai_tutor_events` may still happen (and should, for telemetry).

### Evaluator (Spec 1: rule-based only)

```python
class EvaluationResult(BaseModel):
    task_completed: bool
    severity: Literal['none','minor','major']
    correction: TurnCorrection | None
    should_advance: bool
    matched_pattern: str | None  # for telemetry

class TutorEvaluatorService:
    def evaluate(self, transcript: str, task: TutorTask) -> EvaluationResult:
        norm = self._normalize(transcript)  # lowercase, strip punctuation, collapse whitespace
        # 1. accept_patterns (substring or {"regex": "..."}) → task_completed=True if any match
        # 2. correction_templates (list of {match_regex, corrected_en_template, explanation_vi, severity}) → first match wins
        # 3. severity: from template if matched; else 'none'
        # 4. should_advance: task_completed AND severity != 'major'
        ...
```

`accept_patterns` JSON shape:

```json
["my name is", "i am", "i'm", {"regex": "^call me \\w+$"}]
```

`correction_templates` JSON shape:

```json
[{
  "match_regex": "^my name (\\w+)$",
  "corrected_en_template": "My name is {1}.",
  "explanation_vi": "Bạn cần thêm 'is' sau 'name'.",
  "explanation_key": "missing_be_verb_intro",
  "severity": "minor"
}]
```

`{1}` etc. interpolate regex capture groups. `{0}` is the full match.

### Audio pre-generation script

```text
scripts/generate-tutor-audio.ts        # mirrors scripts/generate-lesson-images.ts
```

- Content-generation script only. **Never imported by FastAPI runtime.**
- Loads `backend/.env` via dotenv (server-side env only).
- Reads scenario + tasks + phrases from DB; computes prompt-hash per asset; calls TTS provider; uploads MP3s to Supabase Storage `ai-tutor-audio/scenarios/<slug>/...`; writes `audio_path` back to DB.
- Idempotent on prompt-hash. Provider abstracted via `--provider` flag (default: `elevenlabs`).
- CLI:

```bash
npm run tutor-audio -- --scenario meeting-someone-new --dry-run
npm run tutor-audio -- --scenario meeting-someone-new
npm run tutor-audio -- --scenario meeting-someone-new --asset opening
npm run tutor-audio -- --scenario meeting-someone-new --provider openai-tts
```

### Config additions (`backend/app/core/config.py`)

```python
ai_tutor_enabled: bool = False
groq_api_key: str | None = None
groq_stt_model: str = 'whisper-large-v3'    # swappable without code change
stt_provider: Literal['groq','stub'] = 'stub'
stt_timeout_seconds: int = 10
tutor_audio_bucket: str = 'ai-tutor-audio'
elevenlabs_api_key: str | None = None       # script-side only; not read at runtime
```

`GET /api/v1/health` reports `ai_tutor_enabled` (true when `ai_tutor_enabled AND groq_api_key`) the same way it reports `ai_voice_enabled`.

---

## 7. Frontend architecture

### File layout

```text
src/
├── pages/
│   └── ai-tutor/
│       ├── AiTutorHomePage.tsx
│       ├── PhrasebookPage.tsx
│       ├── ScenarioBriefingPage.tsx
│       └── TutorSessionPage.tsx
├── features/
│   └── ai-tutor/
│       ├── api/
│       │   └── tutor.ts               # TutorAPI client (mirrors progress.ts)
│       ├── audio/
│       │   ├── useMicRecorder.ts
│       │   ├── useWaveform.ts
│       │   ├── useTutorTTS.ts         # AudioElement + SpeechSynthesis fallback
│       │   └── audioUtils.ts          # mime negotiation, gesture-unlock
│       ├── components/
│       │   ├── TutorLayout.tsx
│       │   ├── TutorTopTabs.tsx
│       │   ├── TutorFooterNav.tsx
│       │   ├── TrialCtaCard.tsx
│       │   ├── FeaturedLessonCard.tsx
│       │   ├── ScenarioCard.tsx
│       │   ├── PhraseCard.tsx
│       │   ├── TaskProgressBanner.tsx
│       │   ├── DialogueCard.tsx
│       │   ├── DialogueButtons.tsx
│       │   ├── CorrectionCard.tsx
│       │   ├── RecordingPanel.tsx
│       │   ├── EndLessonModal.tsx
│       │   └── ComingSoonSheet.tsx
│       ├── hooks/
│       │   ├── useTutorSession.ts
│       │   ├── useScenario.ts
│       │   └── useResumeOrStart.ts
│       └── state/
│           └── sessionMachine.ts
```

### Routing changes (`src/App.tsx`)

Add a parallel-to-`AuthLayout` block:

```tsx
<Route element={<RequireAuth><TutorLayout /></RequireAuth>}>
  <Route path="/ai-tutor" element={<AiTutorHomePage />} />
  <Route path="/ai-tutor/scenarios/:slug/phrasebook" element={<PhrasebookPage />} />
  <Route path="/ai-tutor/scenarios/:slug/briefing" element={<ScenarioBriefingPage />} />
  <Route path="/ai-tutor/scenarios/:slug/session/:sessionId" element={<TutorSessionPage />} />
</Route>
```

`TutorLayout` is a brand-new component (no sidebar, sticky footer, slim top header with tabs). Existing `AuthLayout` is untouched except for adding the new sidebar entry.

### State machine (`sessionMachine.ts`)

Pure reducer with discriminated unions; no XState dependency.

```ts
type SessionState =
  | { kind: 'loading' }
  | { kind: 'ai_speaking'; turn: AiTurn }
  | { kind: 'awaiting_user_speech' }
  | { kind: 'recording'; startedAt: number }
  | { kind: 'processing'; transcriptPreview?: string }
  | { kind: 'showing_eval'; result: EvaluationResult }
  | { kind: 'end_lesson_confirm'; tasksDone: number; tasksTotal: number }
  | { kind: 'lesson_complete'; corrections: Correction[]; xpAwarded: number }
  | { kind: 'error'; cause: 'stt_failed' | 'network' | 'mic_denied' | 'unsupported_browser'; retryable: boolean };

type Event =
  | { type: 'AI_AUDIO_ENDED' }
  | { type: 'RECORD_START' } | { type: 'RECORD_STOP' } | { type: 'RECORD_CANCEL' }
  | { type: 'TURN_RESPONSE'; payload: TurnResponse }
  | { type: 'TURN_ERROR'; cause: ErrorCause }
  | { type: 'END_LESSON_DETECTED'; tasksDone: number; tasksTotal: number }
  | { type: 'END_LESSON_CONFIRM' } | { type: 'END_LESSON_DISMISS' }
  | { type: 'FINISH_RESPONSE'; payload: FinishResponse };
```

`useTutorSession` owns the machine, exposes `{state, dispatch, mic, tts}`. SessionId in URL, so refresh resumes naturally via `GET /sessions/:id` hydration.

### Lesson-complete CTA

When `state.kind === 'lesson_complete'`:
- Header: "Lesson finished" + xp pill
- All correction cards rendered (scrolled to first correction position via `scrollIntoView({behavior:'smooth'})`)
- Primary button: **Continue** → `/ai-tutor`
- Secondary button: **View dashboard** → `/dashboard`

(Spec 3 will replace Continue with `/streak` flow; for Spec 1 it's a real, working button.)

---

## 8. Audio I/O

### Recording (`useMicRecorder`)

- MIME negotiation order: `audio/webm;codecs=opus` → `audio/mp4` (iOS Safari) → `audio/wav`.
- Permission requested **only on first record press** (not on page load).
- Denial → `{kind: 'error', cause: 'mic_denied'}` with retry button + browser-specific instructions.
- Hard 20s cap (auto-submit at 20s).
- Cancel discards blob, returns to `awaiting_user_speech`.

### Waveform (`useWaveform`)

- `AudioContext` + `MediaStreamAudioSourceNode` + `AnalyserNode(fftSize=256)`.
- `requestAnimationFrame` loop reads frequency data → renders to canvas in `RecordingPanel`.
- Suspended when not recording (battery).

### Playback (`useTutorTTS`)

- Primary: HTML `<audio>` with `src = supabasePublicUrl(audio_path)`. Preload next AI line as soon as user starts speaking.
- Fallback (`audio_path` null OR audio fails to load OR network error during load): `window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))` with selected voice. Voice selection: prefer first available `en-US` neural voice; expose voice picker in settings later.
- **iOS gesture unlock:** warm a silent muted `<audio>` on first click anywhere in `TutorLayout`; without this, the AI's first line won't autoplay on iOS Safari.
- `Repeat` button: re-plays current AI turn from start.
- `Hide text` toggle: component state, not session-persisted.

---

## 9. Error handling

| Failure | Frontend behavior | Backend behavior |
|---|---|---|
| `POST /turns` 5xx or timeout >15s | Discard recorded blob, transition to `error` state with `cause:'stt_failed', retryable:true`. Toast: "Couldn't hear that — try again." | No writes to `ai_tutor_sessions` or `ai_tutor_turns` (session state untouched). Logs `ai_tutor_events(event_type='turn.failed.stt')` only. Returns 503. |
| `POST /turns` 429 | Same UX, message "You're going fast! Wait a moment." | Rate limiter response. |
| `POST /turns` 401 | Trigger Supabase session refresh, retry once silently. | Standard JWT validation. |
| Network offline mid-recording | `navigator.onLine` listener pauses pipeline; on reconnect, allow re-submit. | N/A. |
| Mic permission denied | Persistent error banner with browser-specific instructions. | Logs `ai_tutor_events(event_type='mic.denied')`. |
| Unsupported browser (no MediaRecorder OR no AudioContext) | Render unsupported-browser screen with desktop fallback link. | N/A. |
| Audio file 404 in playback | Silent fallback to `SpeechSynthesis`. | N/A; telemetry log only. |
| `evaluation.kind === 'vi_spoken'` | Toast (vi+en), dialogue card NOT added, mic re-enabled. | No writes to `ai_tutor_sessions` or `ai_tutor_turns`; logs `ai_tutor_events(event_type='turn.vi_spoken')`. |
| `end_lesson_detected: true` | Open `EndLessonModal`. Dismiss → mic re-enabled. Confirm → `POST /finish`. | No writes to `ai_tutor_sessions` or `ai_tutor_turns` from `/turns`. Only `/finish` mutates session state. |
| User submits silence | Same as STT failure → toast "Couldn't hear that — try again." | Empty after `.strip()` OR length < 2 chars → treated as `STTFailureError`. Logs `ai_tutor_events(event_type='turn.failed.stt', payload={reason:'empty_transcript'})`. No writes to `ai_tutor_sessions` or `ai_tutor_turns`. |
| User refreshes mid-session | URL has sessionId → hydrate via `GET /sessions/:id` → restore state machine to `ai_speaking` (last AI turn). | Active session preserved by partial unique index. |
| User closes tab | Session remains `active` for 24h; subsequent `start` with `mode='continue'` resumes. Cron job can mark abandoned after 24h (deferred to Spec 3). | N/A. |

---

## 10. Telemetry

### `user_activity_log` (learner progress; existing table, new event types)

- `tutor_session_completed` — written by `complete_tutor_session_tx`. Payload: `{session_id, scenario_slug, xp_awarded, tasks_completed, mistake_count, duration_s}`.
- `tutor_task_completed` — written by `record_tutor_exchange_tx` whenever `_completed_task_id IS NOT NULL`. Payload: `{session_id, scenario_slug, task_key, severity, has_correction}`.

These flow through the existing event log so streak derivation, `/dashboard` summary, and future learner-facing reports pick them up automatically. Both insertions live inside their respective transactional functions, so they are atomic with the corresponding session/turn writes — no risk of a task being marked completed in `ai_tutor_sessions` without the matching activity-log row.

### `ai_tutor_events` (product diagnostics; new table)

**Backend-originated** (written directly by route handlers / transactional functions):

- `session.started` — `{scenario_slug, mode}` (written by `start_tutor_session_tx` for `'fresh'`)
- `session.abandoned` — `{reason, last_state?, turns_count?}` (written by `start_tutor_session_tx` `'fresh'` branch with `reason='started_fresh'`, by `abandon_tutor_session_tx` with `reason='user_cancelled'`, and by future cleanup cron)
- `turn.failed.stt` — `{provider, model, http_status?, error_class, reason?}`
- `turn.vi_spoken` — `{transcript_length}`

**Frontend-originated** (POST `/api/v1/me/ai-tutor/events`, allowed `event_type` whitelist enforced server-side):

- `mic.denied` — `{user_agent, platform}`
- `audio.fallback` — `{reason: 'missing'\|'load_error', audio_path?}`
- `turn.failed.network` — `{}`
- `unsupported_browser` — `{user_agent, missing: ['MediaRecorder', ...]}`

These are admin-only (no `SELECT` for `authenticated`); not exposed to end users. Useful for tuning the rule-based evaluator, identifying broken audio assets, and spotting browser-support gaps.

---

## 11. i18n

- **No build-time merge.** New `tutor.*` namespace added directly to existing locale files: `src/locales/en/en.json`, `src/locales/vi/vi.json`, `src/locales/th/th.json`, `src/locales/zh-CN/zh-CN.json`.
- For Spec 1: `en` + `vi` translated. `th` + `zh-CN` fall through to `en` via existing `fallbackLng: 'en'`.
- Scenario content (`title_vi`, `description_vi`, etc.) lives in DB columns, not locale files.
- Profile gate: AI Tutor home shows a dismissible banner if `profile.native_language !== 'vi'`: "AI Tutor is currently optimized for Vietnamese learners. English-only mode coming soon." Doesn't block access.

---

## 12. Feature flag + rollout

```text
VITE_AI_TUTOR_ENABLED=true        # Vercel; gates routes, homepage CTA, sidebar entry
ai_tutor_enabled=true             # Railway; gates backend endpoints (returns 503 'tutor_disabled' when off)
GROQ_API_KEY=…                    # Railway
STT_PROVIDER=groq                 # Railway
ELEVENLABS_API_KEY=…              # Local + Railway (used by content-gen script only)
```

Both flags default `false`. Rollout order:
1. Run audio pre-generation script locally; verify Supabase Storage uploads.
2. Apply migration to Supabase.
3. Deploy backend to Railway with `ai_tutor_enabled=true` + Groq key.
4. Smoke-test via curl from local against production backend.
5. Enable `VITE_AI_TUTOR_ENABLED=true` in one Vercel preview branch, manual QA on real devices.
6. Enable in production Vercel.

---

## 13. Testing strategy

| Layer | Tools | Coverage |
|---|---|---|
| **Backend unit** | pytest + mocks | `tutor_evaluator_service` (every `accept_pattern` + every `correction_template` per task; positive + negative cases). End-lesson regex (positive incl. Vietnamese; negatives like "I want to extend my lesson"). VI diacritic regex. `stt_provider/stub_provider`. |
| **Backend integration** | pytest + Supabase test schema | Full turn pipeline with stub STT: start → submit turn → assert turn row + correction populated; STT failure → assert NO write; end-lesson detect → no advance, modal payload returned; VI-spoken → no write; finish → `user_stats` + `user_activity_log` updated atomically. |
| **Frontend unit** | Vitest | `sessionMachine` reducer (every transition); `useMicRecorder` (mocked `MediaRecorder`); `audioUtils` MIME negotiation; evaluator-response → `CorrectionCard` props mapping. |
| **Frontend component** | Vitest + Testing Library | `TutorLayout` renders footer + tabs; `EndLessonModal` flow; `RecordingPanel` cancel/submit; `DialogueCard` button actions. |
| **E2E** | Playwright | Homepage CTA → /ai-tutor → scenario card → phrasebook → briefing → session. STT mocked via test endpoint that bypasses Groq. Assert task progress increments, end-lesson modal flow, lesson_complete corrections appear. Real audio not played (Playwright muted); use `data-testid="audio-ready"` markers. |
| **Manual QA** | Real device matrix | iOS Safari (16, 17), Chrome Android, Chrome/Edge/Firefox desktop. Mic permission flow, audio autoplay-after-gesture, waveform performance on low-end Android, network throttling 3G. |

---

## 14. Acceptance criteria

Spec 1 ships when, on a real device:

1. User toggles `VITE_AI_TUTOR_ENABLED=true` in Vercel preview.
2. Logs in → sees AI Tutor CTA on public homepage.
3. Clicks → lands at `/ai-tutor`.
4. Sees featured "Gặp người mới / Meeting someone new" card with Free pill, plus the trial CTA stub and the Free Talk scenario list (initially containing the same scenario).
5. Clicks Start → phrasebook page with 8 phrases; tapping Listen on each plays the pre-generated MP3.
6. Clicks Next → briefing page with goal + 4 tasks (Vi prominent, En muted).
7. Clicks Start lesson → dialogue page. AI speaks "Hi! Nice to meet you. What's your name?" via pre-generated audio.
8. User taps mic, says "My name is Tom," submits.
9. Within 2.5s p95: transcript shown in user dialogue card, task 1 ✅ green, AI follows up ("Nice to meet you, Tom! How are you today?").
10. User completes remaining 3 tasks (or some with mistakes); mistakes get correction cards rendered after the lesson finishes.
11. User says "End lesson" → modal "Finish lesson? You've completed 3 of 4 tasks." → Confirm → "Lesson finished, +N XP."
12. Continue button → `/ai-tutor`. View dashboard button → `/dashboard`.
13. DB has: 1 session row (`status='completed'`), N turn rows, XP credited to `user_stats`, activity_log entry visible in /dashboard streak counter.
14. Refreshing mid-session restores the dialogue page to the correct state.
15. Mic denial shows persistent banner with retry path.
16. Saying Vietnamese mid-session shows the polite re-prompt toast and does not advance.
17. Network failure during turn submit shows retry toast; no DB writes occur.

---

## 15. What comes next (deferred specs)

- **Spec 2 — LLM evaluator + more scenarios:** when no `accept_pattern` matches, fall through to Anthropic Haiku via existing `ai_tutor_service` infrastructure for structured evaluation. Add scenarios 2–5. Add dynamic AI line generation (still pre-cached for canned variants).
- **Spec 3 — Post-session flow:** streak page (reuses `progress_service.get_summary`), review summary page, repeat-after-me page, `ai_tutor_review_items` table population, abandonment cron.
- **Spec 4 — Productionization:** free trial / paywall infra, Challenge mode definition + content, Vietnamese TTS for instructions, multi-native-language support, hosted dynamic TTS.
