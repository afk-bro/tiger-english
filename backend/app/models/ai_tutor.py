"""Pydantic models for the AI tutor endpoints."""
from typing import Literal
from pydantic import BaseModel, Field


# ── Request models ──────────────────────────────────────────────────────────


class ExplainRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    context: str | None = Field(None, max_length=4000)
    learner_language: str = Field("en", max_length=10)
    cefr_level: str = Field("A1", max_length=5)


class CorrectRequest(BaseModel):
    sentence: str = Field(..., min_length=1, max_length=2000)
    learner_language: str = Field("en", max_length=10)
    cefr_level: str = Field("A1", max_length=5)


class PracticeRequest(BaseModel):
    skill: Literal["grammar", "vocabulary", "listening", "reading", "writing"] = "grammar"
    topic: str | None = Field(None, max_length=200)
    cefr_level: str = Field("A1", max_length=5)
    learner_language: str = Field("en", max_length=10)
    count: int = Field(5, ge=1, le=10)


class WritingCoachRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=5000)
    learner_language: str = Field("en", max_length=10)
    cefr_level: str = Field("A1", max_length=5)


# ── Response models ──────────────────────────────────────────────────────────


class AiDisabledResponse(BaseModel):
    code: Literal["ai_disabled"] = "ai_disabled"
    message: str = "AI tutor is not configured on this server."


class ExplainResponse(BaseModel):
    explanation: str


class CorrectionResponse(BaseModel):
    original: str
    corrected: str
    explanation: str
    explanation_l1: str
    try_again_prompt: str
    try_again_answer: str


class PracticeItem(BaseModel):
    question: str
    answer: str
    hint: str | None = None


class PracticeResponse(BaseModel):
    items: list[PracticeItem]


class WritingScore(BaseModel):
    skill: str
    score: int = Field(..., ge=0, le=10)
    comment: str


class InlineAnnotation(BaseModel):
    offset: int
    length: int
    issue: str
    suggestion: str


class WritingCoachResponse(BaseModel):
    scores: list[WritingScore]
    inline_annotations: list[InlineAnnotation]
    rewritten_exemplar: str
