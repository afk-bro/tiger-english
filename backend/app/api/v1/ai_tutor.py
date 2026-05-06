"""AI tutor API endpoints — /api/v1/me/ai-tutor/…"""
import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, StreamingResponse

from ...core.config import settings
from ...core.security import get_current_user
from ...core import ai_usage_log
from ...models.ai_tutor import (
    AiDisabledResponse,
    CorrectRequest,
    CorrectionResponse,
    ExplainRequest,
    ExplainResponse,
    InlineAnnotation,
    PracticeRequest,
    PracticeResponse,
    WritingCoachRequest,
    WritingCoachResponse,
    WritingScore,
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


# ── Mock writing coach (used when AI is disabled) ────────────────────────────

def _mock_writing_coach(text: str) -> WritingCoachResponse:
    """Heuristic writing coach for environments without an Anthropic API key.

    Detects common English errors using simple string matching and returns
    realistic feedback so the full UI flow can be demonstrated and tested.
    """
    text_lower = text.lower()
    annotations: list[InlineAnnotation] = []

    # Common error patterns: (needle, issue, suggestion)
    patterns = [
        ("i go ",        "Verb tense error",          "I went (use past tense)"),
        ("i goed",       "Irregular verb",             "I went"),
        ("buyed",        "Irregular verb",             "bought"),
        ("goed",         "Irregular verb",             "went"),
        ("eated",        "Irregular verb",             "ate"),
        ("he don't",     "Subject-verb agreement",     "he doesn't"),
        ("she don't",    "Subject-verb agreement",     "she doesn't"),
        ("they was",     "Subject-verb agreement",     "they were"),
        ("i is",         "Subject-verb agreement",     "I am"),
        ("much people",  "Quantifier error",           "many people"),
        ("informations", "Uncountable noun",           "information (no plural)"),
        ("a apple",      "Article error",              "an apple"),
        ("a hour",       "Article error",              "an hour"),
        ("since 3 year", "Time expression",            "for 3 years"),
        ("yesterday i go", "Verb tense error",         "Yesterday I went"),
        ("and buyed",    "Irregular verb",             "and bought"),
    ]

    for needle, issue, suggestion in patterns:
        idx = text_lower.find(needle)
        if idx != -1:
            # Determine actual case-preserving span
            actual = text[idx: idx + len(needle)]
            annotations.append(InlineAnnotation(
                offset=idx,
                length=len(needle),
                issue=issue,
                suggestion=suggestion,
            ))

    # If nothing found, add a generic style annotation on the first longish word
    if not annotations:
        words = text.split()
        cursor = 0
        for word in words:
            clean = word.strip(".,!?;:")
            if len(clean) >= 5:
                annotations.append(InlineAnnotation(
                    offset=cursor,
                    length=len(word),
                    issue="Style tip",
                    suggestion=f"Consider simplifying '{clean}' for your current CEFR level",
                ))
                break
            cursor += len(word) + 1

    # Heuristic scores
    n_errors = len(annotations)
    grammar_score = max(3, 10 - n_errors * 2)
    vocab_score = min(10, 4 + len(set(text_lower.split())) // 3)

    scores = [
        WritingScore(skill="Grammar",    score=grammar_score, comment="Check your verb forms and tenses carefully."),
        WritingScore(skill="Vocabulary", score=vocab_score,   comment="Good variety of words for your level."),
        WritingScore(skill="Fluency",    score=7,             comment="Your sentences flow naturally overall."),
    ]

    # Simple exemplar: mark corrected spans with [correction]
    exemplar = text
    for ann in reversed(annotations):  # reverse so offsets stay valid
        orig = exemplar[ann.offset: ann.offset + ann.length]
        exemplar = exemplar[: ann.offset] + ann.suggestion + exemplar[ann.offset + ann.length:]

    if exemplar == text:
        exemplar = text + " — This paragraph looks good! Focus on expanding your vocabulary."

    return WritingCoachResponse(
        scores=scores,
        inline_annotations=annotations,
        rewritten_exemplar=exemplar,
    )


# ── Route handlers ───────────────────────────────────────────────────────────

@router.post(
    "/explain",
    response_model=ExplainResponse | AiDisabledResponse,
    summary="Explain a grammar concept or answer a question",
)
async def explain(
    body: ExplainRequest,
    user_id: UUID = Depends(get_current_user),
    service: AiTutorService = Depends(get_ai_tutor_service),
):
    try:
        result = await service.explain(
            question=body.question,
            context=body.context,
            learner_language=body.learner_language,
            cefr_level=body.cefr_level,
        )
        ai_usage_log.record(
            user_id=str(user_id),
            endpoint="/me/ai-tutor/explain",
            model=settings.ai_default_model,
            input_tokens=300,
            output_tokens=len(result.explanation.split()),
        )
        return result
    except AiDisabledException:
        ai_usage_log.record(
            user_id=str(user_id),
            endpoint="/me/ai-tutor/explain",
            model=settings.ai_default_model,
            input_tokens=0,
            output_tokens=0,
            status="ai_disabled",
        )
        return _ai_disabled_503()


@router.post(
    "/explain/stream",
    summary="Explain a grammar concept — SSE streaming response",
    response_class=StreamingResponse,
)
async def explain_stream(
    body: ExplainRequest,
    user_id: UUID = Depends(get_current_user),
    service: AiTutorService = Depends(get_ai_tutor_service),
):
    """Stream the AI explanation token-by-token as Server-Sent Events."""
    async def _event_generator():
        try:
            token_count = 0
            async for token in service.stream_explain(
                question=body.question,
                context=body.context,
                learner_language=body.learner_language,
                cefr_level=body.cefr_level,
            ):
                token_count += 1
                yield f"data: {json.dumps({'type': 'token', 'text': token})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            ai_usage_log.record(
                user_id=str(user_id),
                endpoint="/me/ai-tutor/explain/stream",
                model=settings.ai_default_model,
                input_tokens=300,
                output_tokens=token_count,
            )
        except AiDisabledException:
            ai_usage_log.record(
                user_id=str(user_id),
                endpoint="/me/ai-tutor/explain/stream",
                model=settings.ai_default_model,
                input_tokens=0,
                output_tokens=0,
                status="ai_disabled",
            )
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
    user_id: UUID = Depends(get_current_user),
    service: AiTutorService = Depends(get_ai_tutor_service),
):
    try:
        result = await service.correct(
            sentence=body.sentence,
            learner_language=body.learner_language,
            cefr_level=body.cefr_level,
        )
        ai_usage_log.record(
            user_id=str(user_id),
            endpoint="/me/ai-tutor/correct",
            model=settings.ai_default_model,
            input_tokens=200,
            output_tokens=120,
        )
        return result
    except AiDisabledException:
        ai_usage_log.record(
            user_id=str(user_id),
            endpoint="/me/ai-tutor/correct",
            model=settings.ai_default_model,
            input_tokens=0,
            output_tokens=0,
            status="ai_disabled",
        )
        return _ai_disabled_503()


@router.post(
    "/practice",
    response_model=PracticeResponse | AiDisabledResponse,
    summary="Generate drill exercises for a skill/topic",
)
async def practice(
    body: PracticeRequest,
    user_id: UUID = Depends(get_current_user),
    service: AiTutorService = Depends(get_ai_tutor_service),
):
    try:
        result = await service.practice(
            skill=body.skill,
            topic=body.topic,
            cefr_level=body.cefr_level,
            learner_language=body.learner_language,
            count=body.count,
        )
        ai_usage_log.record(
            user_id=str(user_id),
            endpoint="/me/ai-tutor/practice",
            model=settings.ai_default_model,
            input_tokens=250,
            output_tokens=400,
        )
        return result
    except AiDisabledException:
        ai_usage_log.record(
            user_id=str(user_id),
            endpoint="/me/ai-tutor/practice",
            model=settings.ai_default_model,
            input_tokens=0,
            output_tokens=0,
            status="ai_disabled",
        )
        return _ai_disabled_503()


@router.post(
    "/writing-coach",
    response_model=WritingCoachResponse | AiDisabledResponse,
    summary="Get writing feedback with scores and inline annotations",
)
async def writing_coach(
    body: WritingCoachRequest,
    user_id: UUID = Depends(get_current_user),
    service: AiTutorService = Depends(get_ai_tutor_service),
):
    try:
        result = await service.writing_coach(
            text=body.text,
            learner_language=body.learner_language,
            cefr_level=body.cefr_level,
        )
        ai_usage_log.record(
            user_id=str(user_id),
            endpoint="/me/ai-tutor/writing-coach",
            model=settings.ai_haiku_model,
            input_tokens=len(body.text.split()) * 2,
            output_tokens=600,
        )
        return result
    except AiDisabledException:
        # Default behavior matches sibling endpoints: 503 + ai_disabled.
        # Opt-in: AI_WRITING_COACH_MOCK_WHEN_DISABLED=true returns realistic
        # heuristic mock data so reviewers without an API key can demo the
        # full Writing Coach UI flow.
        if settings.ai_writing_coach_mock_when_disabled:
            mock = _mock_writing_coach(body.text)
            ai_usage_log.record(
                user_id=str(user_id),
                endpoint="/me/ai-tutor/writing-coach",
                model=settings.ai_haiku_model,
                input_tokens=len(body.text.split()) * 2,
                output_tokens=250,
                status="mock",
            )
            return mock
        ai_usage_log.record(
            user_id=str(user_id),
            endpoint="/me/ai-tutor/writing-coach",
            model=settings.ai_haiku_model,
            input_tokens=0,
            output_tokens=0,
            status="ai_disabled",
        )
        return _ai_disabled_503()
