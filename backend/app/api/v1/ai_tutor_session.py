"""AI Tutor session endpoints."""
import logging
from collections import defaultdict
import time
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from ...core.config import settings
from ...core.security import get_current_user
from ...core.supabase import get_supabase_admin
from ...models.tutor import (
    StartSessionRequest, StartSessionResponse, TurnResponse, FinishResponse,
    TutorScenarioSummary, TutorScenarioDetail, TutorEventRequest,
    ActiveSessionDTO,
)
from ...services.stt_provider import GroqSTTProvider, StubSTTProvider
from ...services.tutor_scenario_service import TutorScenarioService
from ...services.tutor_session_service import (
    TutorSessionService, TurnSTTFailure,
    SessionNotFoundError, SessionAccessDeniedError, SessionNotActiveError,
    ScenarioNotFoundError,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ai-tutor"])


def _get_stt(request: Request | None = None):
    if settings.stt_provider == "groq" and settings.groq_api_key:
        return GroqSTTProvider(settings.groq_api_key, settings.groq_stt_model, settings.stt_timeout_seconds)
    # Stub mode: in non-production, allow tests to inject a scripted
    # transcript via the X-Test-Stub-Transcript header. The guard against
    # `environment == "production"` is the production-safety check — a
    # misconfigured prod with STT_PROVIDER=stub still won't echo headers.
    #
    # HTTP headers are ASCII-only, so callers URL-encode non-ASCII
    # transcripts (e.g. Vietnamese end-lesson trigger). We percent-decode
    # here. ASCII transcripts round-trip unchanged.
    canned = ""
    if (
        request is not None
        and settings.stt_provider == "stub"
        and settings.environment != "production"
    ):
        raw = request.headers.get("x-test-stub-transcript", "") or ""
        if raw:
            from urllib.parse import unquote
            canned = unquote(raw)
    return StubSTTProvider(canned_text=canned)


def _require_enabled():
    """503 when AI tutor isn't fully wired (no API key OR flag off in production).

    Defence in depth: even if production is misconfigured with
    STT_PROVIDER=stub, never bypass the flag there. The stub bypass exists
    so dev/test environments can exercise the route tree without the full
    Groq + Anthropic surface — never something we want available in prod.
    """
    if not settings.ai_tutor_enabled:
        if (
            settings.stt_provider != "stub"
            or settings.environment == "production"
        ):
            raise HTTPException(status_code=503, detail={"error": "tutor_disabled"})


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


@router.post("/me/ai-tutor/sessions", response_model=StartSessionResponse)
async def start_session(
    body: StartSessionRequest,
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    _require_enabled()
    try:
        return TutorSessionService(supabase, _get_stt()).start_session(
            user_id, body.scenario_slug, body.mode
        )
    except ScenarioNotFoundError:
        raise HTTPException(404, "scenario_not_found")


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


@router.get("/me/ai-tutor/sessions/{session_id}")
async def get_session(
    session_id: UUID,
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    _require_enabled()
    # Implement a get_session method on TutorSessionService if missing, OR
    # do a direct supabase read here. Per the plan, this is a thin read
    # that loads session + last 50 turns + currents-task info for hydration.
    # KEEP THIS SIMPLE: just read the session row. The frontend can request
    # more detail via /scenarios endpoints + this for state.
    try:
        result = (
            supabase.table("ai_tutor_sessions")
            .select("*")
            .eq("id", str(session_id))
            .eq("user_id", str(user_id))
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(404, "session_not_found")
    if not result.data:
        raise HTTPException(404, "session_not_found")
    return result.data


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
    request: Request,
    audio: UploadFile = File(...),
    current_task_id: UUID = Form(...),
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    _require_enabled()
    retry = _rate_check(str(user_id))
    if retry is not None:
        raise HTTPException(429, headers={"Retry-After": str(retry)})

    audio_bytes = await audio.read()
    if len(audio_bytes) > 2 * 1024 * 1024:
        raise HTTPException(413, "audio_too_large")

    try:
        return await TutorSessionService(supabase, _get_stt(request)).submit_turn(
            user_id=user_id,
            session_id=session_id,
            audio_bytes=audio_bytes,
            mime_type=audio.content_type or "audio/webm",
            current_task_id=current_task_id,
        )
    except TurnSTTFailure as exc:
        # Service already logged ai_tutor_events; no session/turn writes occurred.
        raise HTTPException(503, detail={"error": "stt_failed", "retryable": True, "reason": exc.reason})
    except SessionNotFoundError:
        raise HTTPException(404, "session_not_found")
    except SessionAccessDeniedError:
        raise HTTPException(403, "session_access_denied")
    except SessionNotActiveError:
        raise HTTPException(409, "session_not_active")


@router.post("/me/ai-tutor/sessions/{session_id}/finish", response_model=FinishResponse)
async def finish_session(
    session_id: UUID,
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    _require_enabled()
    try:
        return TutorSessionService(supabase, _get_stt()).finish_session(user_id, session_id)
    except SessionNotFoundError:
        raise HTTPException(404, "session_not_found")
    except SessionAccessDeniedError:
        raise HTTPException(403, "session_access_denied")
    except SessionNotActiveError:
        raise HTTPException(409, "session_not_active")


@router.post("/me/ai-tutor/sessions/{session_id}/abandon")
async def abandon_session(
    session_id: UUID,
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    _require_enabled()
    try:
        TutorSessionService(supabase, _get_stt()).abandon_session(user_id, session_id, reason="user_cancelled")
    except SessionNotFoundError:
        raise HTTPException(404, "session_not_found")
    except SessionAccessDeniedError:
        raise HTTPException(403, "session_access_denied")
    # abandon is silently idempotent for already-terminal sessions; no SessionNotActiveError here.
    return {"ok": True}


# ----------------------------------------------------------------------
# Frontend telemetry events (Task 5.3)
# ----------------------------------------------------------------------

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


@router.post("/me/ai-tutor/events", status_code=204)
async def post_event(
    body: TutorEventRequest,
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    if body.event_type not in _ALLOWED_FRONTEND_EVENTS:
        raise HTTPException(400, "event_type_not_allowed")
    # Use a separate rate-limit bucket for events so abusive event spam can't
    # exhaust the /turns budget (or vice versa).
    retry = _rate_check(f"events:{user_id}")
    if retry is not None:
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
        # Diagnostics: never fail the calling page if telemetry write breaks.
        return
