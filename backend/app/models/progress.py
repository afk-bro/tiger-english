"""Pydantic models for the progress tracking API.

See docs/superpowers/specs/2026-05-03-phase-1-progress-tracking-design.md
for the design rationale.
"""

from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# Canonical section keys — every unit currently has exactly these five.
# Mirrored at the DB layer via a CHECK constraint (migration
# 20260504000002_constrain_progress_keys.sql) and at the frontend in
# `src/features/lessons/lesson.types.ts:SectionKey`. Adding a new section
# type is a deliberate three-place change.
SectionKey = Literal["overview", "grammar", "vocabulary", "dialogues", "activities"]

# Unit slug pattern: matches "unit-1", "unit-12", etc. Tightening here
# stops typos and arbitrary writes from polluting the projection tables.
_UNIT_SLUG_PATTERN = r"^unit-\d+$"

# Exercise IDs are author-defined strings like "mc-1" or "fb-3a". Lock
# down to lowercase kebab-case + digits with a sane max length.
_EXERCISE_ID_PATTERN = r"^[a-z0-9][a-z0-9-]*$"


# ----- Request models -----

class LessonSectionCompletedRequest(BaseModel):
    unit_slug: str = Field(pattern=_UNIT_SLUG_PATTERN)
    section_key: SectionKey


class ExerciseAttemptRequest(BaseModel):
    unit_slug: str = Field(pattern=_UNIT_SLUG_PATTERN)
    section_key: SectionKey
    exercise_id: str = Field(min_length=1, max_length=64, pattern=_EXERCISE_ID_PATTERN)
    is_correct: bool


class FlashcardReviewRequest(BaseModel):
    flashcard_id: UUID
    status: Literal["known", "unknown"]


# ----- Single-write response models -----

class LessonSectionProgressResponse(BaseModel):
    unit_slug: str
    section_key: str
    completed_at: datetime


class ExerciseAttemptResponse(BaseModel):
    id: int
    attempted_at: datetime


class FlashcardReviewResponse(BaseModel):
    id: int
    reviewed_at: datetime


# ----- Summary response (composite read) -----

class CompletedSection(BaseModel):
    unit_slug: str
    section_key: str
    completed_at: datetime


class AttemptsSummary(BaseModel):
    total: int
    correct: int


class FlashcardsSummary(BaseModel):
    reviewed_total: int
    currently_known: int


class StreakSummary(BaseModel):
    current_days: int


class ActivityCounts(BaseModel):
    """Pre-computed counts the dashboard renders directly. Some fields
    duplicate values from the breakdown blocks above — intentional, so
    the dashboard can render `summary.activity` without recomputing.
    """
    lessons_completed: int        # count of FULLY-completed units
    exercises_attempted: int      # mirrors AttemptsSummary.total
    exercises_correct: int        # mirrors AttemptsSummary.correct
    flashcards_reviewed: int      # mirrors FlashcardsSummary.reviewed_total
    flashcards_mastered: int      # mirrors FlashcardsSummary.currently_known


class ProgressSummaryResponse(BaseModel):
    sections_completed: List[CompletedSection]
    exercise_attempts: AttemptsSummary
    flashcards: FlashcardsSummary
    streak: StreakSummary
    study_days_this_week: int
    last_active_at: Optional[datetime]
    activity: ActivityCounts
