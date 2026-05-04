"""Phase 1 progress tracking endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.core.supabase import get_supabase_admin
from app.models.progress import (
    ExerciseAttemptRequest,
    ExerciseAttemptResponse,
    FlashcardReviewRequest,
    FlashcardReviewResponse,
    LessonSectionCompletedRequest,
    LessonSectionProgressResponse,
    ProgressSummaryResponse,
)
from app.services.progress_service import ProgressService


router = APIRouter(prefix="/me/progress", tags=["progress"])


def get_progress_service(supabase=Depends(get_supabase_admin)) -> ProgressService:
    return ProgressService(supabase)


@router.post("/complete-section", response_model=LessonSectionProgressResponse)
def complete_section(
    body: LessonSectionCompletedRequest,
    user_id: UUID = Depends(get_current_user),
    service: ProgressService = Depends(get_progress_service),
):
    return service.complete_lesson_section(user_id, body.unit_slug, body.section_key)


@router.post("/attempt-exercise", response_model=ExerciseAttemptResponse)
def attempt_exercise(
    body: ExerciseAttemptRequest,
    user_id: UUID = Depends(get_current_user),
    service: ProgressService = Depends(get_progress_service),
):
    return service.submit_exercise_attempt(
        user_id, body.unit_slug, body.section_key, body.exercise_id, body.is_correct
    )


@router.post("/review-flashcard", response_model=FlashcardReviewResponse)
def review_flashcard(
    body: FlashcardReviewRequest,
    user_id: UUID = Depends(get_current_user),
    service: ProgressService = Depends(get_progress_service),
):
    return service.review_flashcard(user_id, body.flashcard_id, body.status)


@router.get("/summary", response_model=ProgressSummaryResponse)
def summary(
    user_id: UUID = Depends(get_current_user),
    service: ProgressService = Depends(get_progress_service),
):
    return service.get_summary(user_id)
