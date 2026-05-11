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
from ...services.tutor_session_service import (
    TutorSessionService, TurnSTTFailure,
    SessionNotFoundError, SessionAccessDeniedError, SessionNotActiveError,
    ScenarioNotFoundError,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ai-tutor"])


def _get_stt():
    if settings.stt_provider == "groq" and settings.groq_api_key:
        return GroqSTTProvider(settings.groq_api_key, settings.groq_stt_model, settings.stt_timeout_seconds)
    return StubSTTProvider()


def _require_enabled():
    """503 when AI tutor isn't fully wired (no API key OR flag off in production)."""
    if not settings.ai_tutor_enabled:
        # In stub mode (tests/dev), allow through even when ai_tutor_enabled is False.
        if settings.stt_provider != "stub":
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
