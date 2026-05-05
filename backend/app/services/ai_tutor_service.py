"""AI tutor service — wraps the Anthropic SDK with graceful fallback.

If the ``anthropic`` package is not installed (or no API key is configured)
every public method raises ``AiDisabledException`` instead of crashing.
"""
from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING

from ..core.config import settings
from ..models.ai_tutor import (
    CorrectionResponse,
    ExplainResponse,
    PracticeItem,
    PracticeResponse,
    WritingCoachResponse,
    WritingScore,
    InlineAnnotation,
)

if TYPE_CHECKING:
    pass  # keep imports clean for type checker

logger = logging.getLogger(__name__)

# Try to import the Anthropic SDK — it may not be installed yet.
try:
    import anthropic as _anthropic_sdk  # noqa: F401 – import only to verify availability

    _ANTHROPIC_AVAILABLE = True
except ImportError:
    _ANTHROPIC_AVAILABLE = False


class AiDisabledException(Exception):
    """Raised when the AI tutor cannot be used (no key / no package)."""


def _build_client():
    """Lazily construct an Anthropic client only when needed."""
    if not _ANTHROPIC_AVAILABLE:
        raise AiDisabledException("anthropic package not installed")
    if not settings.ai_tutor_enabled:
        raise AiDisabledException("AI tutor disabled (no valid ANTHROPIC_API_KEY)")
    import anthropic  # noqa: PLC0415 – intentional lazy import

    return anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


# ── System prompts ───────────────────────────────────────────────────────────

_SYSTEM_EXPLAIN = (
    "You are an expert English language tutor for adult learners. "
    "Your explanations are clear, concise, and matched to the learner's CEFR level. "
    "Use simple language for A0-A2 learners, richer examples for B1-C1. "
    "Always respond in the learner's native language unless asked otherwise, "
    "but keep English examples in English."
)

_SYSTEM_CORRECT = (
    "You are an English grammar correction assistant. "
    "You respond ONLY with valid JSON matching the schema provided. Do not add markdown fences. "
    "Fields: original (the sentence as given), corrected (fixed English), "
    "explanation (why, in English), explanation_l1 (same in the learner's language), "
    "try_again_prompt (a short fill-in-the-blank or rewrite prompt based on the correction), "
    "try_again_answer (the expected answer)."
)

_SYSTEM_PRACTICE = (
    "You are an English drill generator. "
    "Respond ONLY with valid JSON: { \"items\": [ { \"question\": \"...\", \"answer\": \"...\", \"hint\": \"...\" } ] }. "
    "Do not add markdown fences. Tailor difficulty to the CEFR level."
)

_SYSTEM_WRITING = (
    "You are a writing coach for English learners. "
    "Respond ONLY with valid JSON matching the schema provided. Do not add markdown fences. "
    "Fields: scores (array of { skill, score 0-10, comment }), "
    "inline_annotations (array of { offset, length, issue, suggestion }), "
    "rewritten_exemplar (a polished rewrite of the text)."
)


# ── Public service class ─────────────────────────────────────────────────────


class AiTutorService:
    """Thin async wrapper around the Anthropic Messages API."""

    async def explain(
        self,
        question: str,
        context: str | None,
        learner_language: str,
        cefr_level: str,
    ) -> ExplainResponse:
        client = _build_client()
        user_msg = f"[Learner level: {cefr_level}] [Native language: {learner_language}]\n\nQuestion: {question}"
        if context:
            user_msg += f"\n\nLesson context:\n{context}"

        message = await client.messages.create(
            model=settings.ai_default_model,
            max_tokens=1024,
            system=_SYSTEM_EXPLAIN,
            messages=[{"role": "user", "content": user_msg}],
        )
        explanation = message.content[0].text if message.content else ""
        return ExplainResponse(explanation=explanation)

    async def correct(
        self,
        sentence: str,
        learner_language: str,
        cefr_level: str,
    ) -> CorrectionResponse:
        client = _build_client()
        user_msg = (
            f"[Learner level: {cefr_level}] [Native language: {learner_language}]\n\n"
            f"Correct this sentence and return JSON:\n{sentence}"
        )
        message = await client.messages.create(
            model=settings.ai_default_model,
            max_tokens=1024,
            system=_SYSTEM_CORRECT,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = message.content[0].text if message.content else "{}"
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("AI /correct returned non-JSON: %s", raw[:200])
            data = {
                "original": sentence,
                "corrected": sentence,
                "explanation": raw,
                "explanation_l1": raw,
                "try_again_prompt": "",
                "try_again_answer": "",
            }
        return CorrectionResponse(
            original=data.get("original", sentence),
            corrected=data.get("corrected", sentence),
            explanation=data.get("explanation", ""),
            explanation_l1=data.get("explanation_l1", ""),
            try_again_prompt=data.get("try_again_prompt", ""),
            try_again_answer=data.get("try_again_answer", ""),
        )

    async def practice(
        self,
        skill: str,
        topic: str | None,
        cefr_level: str,
        learner_language: str,
        count: int,
    ) -> PracticeResponse:
        client = _build_client()
        topic_clause = f" on the topic of '{topic}'" if topic else ""
        user_msg = (
            f"[Level: {cefr_level}] [Native: {learner_language}]\n\n"
            f"Generate {count} {skill} drill items{topic_clause}."
        )
        message = await client.messages.create(
            model=settings.ai_default_model,
            max_tokens=2048,
            system=_SYSTEM_PRACTICE,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = message.content[0].text if message.content else "{}"
        try:
            data = json.loads(raw)
            items = [PracticeItem(**item) for item in data.get("items", [])]
        except (json.JSONDecodeError, Exception):
            logger.warning("AI /practice returned non-JSON: %s", raw[:200])
            items = []
        return PracticeResponse(items=items)

    async def writing_coach(
        self,
        text: str,
        learner_language: str,
        cefr_level: str,
    ) -> WritingCoachResponse:
        client = _build_client()
        user_msg = (
            f"[Level: {cefr_level}] [Native: {learner_language}]\n\n"
            f"Provide writing feedback for:\n\n{text}"
        )
        message = await client.messages.create(
            model=settings.ai_haiku_model,
            max_tokens=2048,
            system=_SYSTEM_WRITING,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = message.content[0].text if message.content else "{}"
        try:
            data = json.loads(raw)
            scores = [WritingScore(**s) for s in data.get("scores", [])]
            annotations = [InlineAnnotation(**a) for a in data.get("inline_annotations", [])]
            rewritten = data.get("rewritten_exemplar", text)
        except (json.JSONDecodeError, Exception):
            logger.warning("AI /writing-coach returned non-JSON: %s", raw[:200])
            scores = []
            annotations = []
            rewritten = text
        return WritingCoachResponse(
            scores=scores,
            inline_annotations=annotations,
            rewritten_exemplar=rewritten,
        )
