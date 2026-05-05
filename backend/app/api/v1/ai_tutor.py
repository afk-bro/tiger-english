"""AI tutor API endpoints — /api/v1/me/ai-tutor/…"""
import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, StreamingResponse

from ...core.security import get_current_user
from ...models.ai_tutor import (
    AiDisabledResponse,
    CorrectRequest,
    CorrectionResponse,
    ExplainRequest,
    ExplainResponse,
    PracticeRequest,
    PracticeResponse,
    WritingCoachRequest,
    WritingCoachResponse,
)
from ...services.ai_tutor_service import AiDisabledException, AiTutorService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/me/ai-tutor", tags=["ai-tutor"])

# Singleton-style dependency — one instance per request (lightweight).
def get_ai_tutor_service() -> AiTutorService:
    return AiTutorService()


def _ai_disabled_503() -> JSONResponse:
    """Return a 503 Service Unavailable response with ai_disabled code."""
    return JSONResponse(
        status_code=503,
        content={"code": "ai_disabled", "detail": "AI features are not enabled on this server."},
    )


@router.post(
    "/explain",
    response_model=ExplainResponse | AiDisabledResponse,
    summary="Explain a grammar concept or answer a question",
)
async def explain(
    body: ExplainRequest,
    _user_id: UUID = Depends(get_current_user),
    service: AiTutorService = Depends(get_ai_tutor_service),
):
    try:
        return await service.explain(
            question=body.question,
            context=body.context,
            learner_language=body.learner_language,
            cefr_level=body.cefr_level,
        )
    except AiDisabledException:
        return _ai_disabled_503()


@router.post(
    "/explain/stream",
    summary="Explain a grammar concept — SSE streaming response",
    response_class=StreamingResponse,
)
async def explain_stream(
    body: ExplainRequest,
    _user_id: UUID = Depends(get_current_user),
    service: AiTutorService = Depends(get_ai_tutor_service),
):
    """Stream the AI explanation token-by-token as Server-Sent Events.

    SSE format:
        data: {"type": "token", "text": "..."}\\n\\n
        data: {"type": "done"}\\n\\n

    On AI disabled:
        data: {"type": "error", "code": "ai_disabled"}\\n\\n
    """
    async def _event_generator():
        try:
            async for token in service.stream_explain(
                question=body.question,
                context=body.context,
                learner_language=body.learner_language,
                cefr_level=body.cefr_level,
            ):
                yield f"data: {json.dumps({'type': 'token', 'text': token})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except AiDisabledException:
            yield f"data: {json.dumps({'type': 'error', 'code': 'ai_disabled'})}\n\n"
        except Exception as exc:
            logger.exception("Error in explain/stream: %s", exc)
            yield f"data: {json.dumps({'type': 'error', 'code': 'internal'})}\n\n"

    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post(
    "/correct",
    response_model=CorrectionResponse | AiDisabledResponse,
    summary="Correct an English sentence and explain errors",
)
async def correct(
    body: CorrectRequest,
    _user_id: UUID = Depends(get_current_user),
    service: AiTutorService = Depends(get_ai_tutor_service),
):
    try:
        return await service.correct(
            sentence=body.sentence,
            learner_language=body.learner_language,
            cefr_level=body.cefr_level,
        )
    except AiDisabledException:
        return _ai_disabled_503()


@router.post(
    "/practice",
    response_model=PracticeResponse | AiDisabledResponse,
    summary="Generate drill exercises for a skill/topic",
)
async def practice(
    body: PracticeRequest,
    _user_id: UUID = Depends(get_current_user),
    service: AiTutorService = Depends(get_ai_tutor_service),
):
    try:
        return await service.practice(
            skill=body.skill,
            topic=body.topic,
            cefr_level=body.cefr_level,
            learner_language=body.learner_language,
            count=body.count,
        )
    except AiDisabledException:
        return _ai_disabled_503()


@router.post(
    "/writing-coach",
    response_model=WritingCoachResponse | AiDisabledResponse,
    summary="Get writing feedback with scores and inline annotations",
)
async def writing_coach(
    body: WritingCoachRequest,
    _user_id: UUID = Depends(get_current_user),
    service: AiTutorService = Depends(get_ai_tutor_service),
):
    try:
        return await service.writing_coach(
            text=body.text,
            learner_language=body.learner_language,
            cefr_level=body.cefr_level,
        )
    except AiDisabledException:
        return _ai_disabled_503()
