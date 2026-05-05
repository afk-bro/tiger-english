"""Pydantic models for skill scoring endpoints."""
from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field

SkillKey = Literal[
    "vocabulary_range",
    "vocabulary_accuracy",
    "grammar_accuracy",
    "grammar_range",
    "pronunciation",
    "fluency",
    "listening_comprehension",
    "reading_comprehension",
    "writing_organization",
    "task_completion",
    "interaction_quality",
]

ALL_SKILL_KEYS: list[SkillKey] = [
    "vocabulary_range",
    "vocabulary_accuracy",
    "grammar_accuracy",
    "grammar_range",
    "pronunciation",
    "fluency",
    "listening_comprehension",
    "reading_comprehension",
    "writing_organization",
    "task_completion",
    "interaction_quality",
]


class SkillScore(BaseModel):
    skill: SkillKey
    score: float = Field(0.0, ge=0.0, le=5.0)
    sample_size: int = Field(0, ge=0)
    last_updated_at: str | None = None


class SkillSummaryResponse(BaseModel):
    skills: list[SkillScore]
    cefr_estimate: str | None = None
