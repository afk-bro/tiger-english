"""Review API endpoints — /api/v1/me/review/…"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ...core.security import get_current_user
from ...core.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/me/review", tags=["review"])


class ReviewItem(BaseModel):
    id: str
    item_type: str
    prompt: str
    answer: str
    note: str
    ease_factor: float
    interval_days: int
    streak_correct: int
    next_review_at: str
    # Optional: raw exercise_id so the frontend can look up rich content
    exercise_id: str | None = None


class ReviewCountResponse(BaseModel):
    count: int


class RateDifficultyRequest(BaseModel):
    difficulty: Literal["incorrect", "difficult", "got_it", "easy"]


class RateDifficultyResponse(BaseModel):
    success: bool
    next_interval_days: int | None = None
    new_ease_factor: float | None = None


def _build_review_items_from_attempts(attempts: list[dict]) -> list[ReviewItem]:
    """Convert exercise_attempts rows into ReviewItem objects.

    The prompt is intentionally generic here — the frontend enriches it
    using the exerciseLookup registry once it receives the exercise_id field.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    items: list[ReviewItem] = []
    for row in attempts:
        ex_id = row.get("exercise_id", "")
        items.append(ReviewItem(
            id=str(row["id"]),
            item_type="common_error",
            prompt=f"Review exercise from {row.get('unit_slug', 'unit')} / {row.get('section_key', 'section')}",
            answer="See the correct answer below",
            note=f"You answered this incorrectly. Try again!",
            ease_factor=2.5,
            interval_days=1,
            streak_correct=0,
            next_review_at=now_iso,
            exercise_id=ex_id or None,
        ))
    return items


@router.get("/due", response_model=list[ReviewItem])
async def get_due_items(
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
) -> list[ReviewItem]:
    """Return review items based on incorrect exercise attempts (last 30 days)."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

    # Try review_items table first; fall back to exercise_attempts
    try:
        result = supabase.table("review_items") \
            .select("*") \
            .eq("user_id", str(user_id)) \
            .lte("next_review_at", datetime.now(timezone.utc).isoformat()) \
            .limit(20) \
            .execute()
        if result.data:
            # If review_items table exists and has data, return from there
            now_iso = datetime.now(timezone.utc).isoformat()
            items = []
            for row in result.data:
                items.append(ReviewItem(
                    id=str(row["id"]),
                    item_type=row.get("item_type", "common_error"),
                    prompt=row.get("prompt", ""),
                    answer=row.get("answer", ""),
                    note=row.get("note", ""),
                    ease_factor=float(row.get("ease_factor", 2.5)),
                    interval_days=int(row.get("interval_days", 1)),
                    streak_correct=int(row.get("streak_correct", 0)),
                    next_review_at=row.get("next_review_at", now_iso),
                ))
            return items
    except Exception:
        pass  # Table doesn't exist or error — fall back to exercise_attempts

    # Fall back: query exercise_attempts for incorrect answers in last 30 days
    try:
        result = supabase.table("exercise_attempts") \
            .select("id, unit_slug, section_key, exercise_id, attempted_at") \
            .eq("user_id", str(user_id)) \
            .eq("is_correct", False) \
            .gte("attempted_at", cutoff) \
            .order("attempted_at", desc=True) \
            .limit(20) \
            .execute()
        return _build_review_items_from_attempts(result.data or [])
    except Exception as exc:
        logger.error("Failed to fetch review items: %s", exc)
        return []


@router.get("/count", response_model=ReviewCountResponse)
async def get_due_count(
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
) -> ReviewCountResponse:
    """Return count of due review items."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

    # Try review_items table first
    try:
        result = supabase.table("review_items") \
            .select("id", count="exact") \
            .eq("user_id", str(user_id)) \
            .lte("next_review_at", datetime.now(timezone.utc).isoformat()) \
            .execute()
        if result.count is not None:
            return ReviewCountResponse(count=result.count)
    except Exception:
        pass

    # Fall back: count incorrect exercise_attempts in last 30 days
    try:
        result = supabase.table("exercise_attempts") \
            .select("id", count="exact") \
            .eq("user_id", str(user_id)) \
            .eq("is_correct", False) \
            .gte("attempted_at", cutoff) \
            .execute()
        return ReviewCountResponse(count=result.count or 0)
    except Exception as exc:
        logger.error("Failed to fetch review count: %s", exc)
        return ReviewCountResponse(count=0)


def _sm2_update(
    ease_factor: float,
    interval_days: int,
    streak_correct: int,
    difficulty: str,
) -> tuple[float, int, int]:
    """
    SM-2 spaced repetition algorithm.

    difficulty → quality score mapping:
      'incorrect' → 0  (complete blackout)
      'difficult'  → 2  (significant difficulty but recalled)
      'got_it'     → 4  (correct with some hesitation)
      'easy'       → 5  (perfect recall)

    Returns (new_ease_factor, new_interval_days, new_streak_correct).
    """
    quality_map = {"incorrect": 0, "difficult": 2, "got_it": 4, "easy": 5}
    q = quality_map.get(difficulty, 3)

    if q < 3:
        # Incorrect — reset streak and interval, lower ease factor
        new_streak = 0
        new_interval = 1
    else:
        new_streak = streak_correct + 1
        if streak_correct == 0:
            new_interval = 1
        elif streak_correct == 1:
            new_interval = 6
        else:
            new_interval = round(interval_days * ease_factor)

    # Update ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    new_ef = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    new_ef = max(1.3, round(new_ef, 2))  # floor at 1.3

    return new_ef, new_interval, new_streak


@router.post("/{item_id}/rate", response_model=RateDifficultyResponse)
async def rate_item(
    item_id: str,
    body: RateDifficultyRequest,
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
) -> RateDifficultyResponse:
    """Record a difficulty rating for a review item, applying SM-2 scheduling."""
    logger.info("Review rating: user=%s item=%s difficulty=%s", user_id, item_id, body.difficulty)

    # Try to update review_items table if it exists
    try:
        result = supabase.table("review_items") \
            .select("ease_factor, interval_days, streak_correct") \
            .eq("id", item_id) \
            .eq("user_id", str(user_id)) \
            .single() \
            .execute()

        if result.data:
            row = result.data
            new_ef, new_interval, new_streak = _sm2_update(
                float(row["ease_factor"]),
                int(row["interval_days"]),
                int(row["streak_correct"]),
                body.difficulty,
            )
            next_review = (
                datetime.now(timezone.utc) + timedelta(days=new_interval)
            ).isoformat()

            supabase.table("review_items").update({
                "ease_factor": new_ef,
                "interval_days": new_interval,
                "streak_correct": new_streak,
                "next_review_at": next_review,
                "last_reviewed_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", item_id).execute()

            return RateDifficultyResponse(
                success=True,
                next_interval_days=new_interval,
                new_ease_factor=new_ef,
            )
    except Exception:
        pass  # Table doesn't exist — compute SM-2 values but can't persist yet

    # Compute SM-2 values from defaults (can't persist without review_items table)
    new_ef, new_interval, _ = _sm2_update(2.5, 1, 0, body.difficulty)
    return RateDifficultyResponse(
        success=True,
        next_interval_days=new_interval,
        new_ease_factor=new_ef,
    )
