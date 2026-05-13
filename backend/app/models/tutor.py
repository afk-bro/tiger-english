"""Pydantic models for AI Tutor — request/response shapes + DB row shapes."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


# ----- Scenario catalog models -----

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


# ----- Turn / evaluation models -----

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


# ----- Request / response models -----

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
