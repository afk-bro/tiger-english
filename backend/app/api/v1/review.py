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
    exercise_id: str | None = None


class ReviewCountResponse(BaseModel):
    count: int


class RateDifficultyRequest(BaseModel):
    difficulty: Literal["incorrect", "difficult", "got_it", "easy"]


class RateDifficultyResponse(BaseModel):
    success: bool
    next_interval_days: int | None = None
    new_ease_factor: float | None = None


@router.get("/due", response_model=list[ReviewItem])
async def get_due_items(
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
) -> list[ReviewItem]:
    """Return up to 20 review items currently due for the user.

    On transient Supabase errors we degrade to an empty list rather than
    surfacing a 500 to the review UI, which is non-critical.
    """
    uid = str(user_id)
    now_iso = datetime.now(timezone.utc).isoformat()

    try:
        result = supabase.table("review_items") \
            .select("*") \
            .eq("user_id", uid) \
            .lte("next_review_at", now_iso) \
            .limit(20) \
            .execute()
    except Exception:
        logger.exception("Failed to fetch review items for user %s", uid)
        return []

    items: list[ReviewItem] = []
    for row in result.data or []:
        items.append(ReviewItem(
            id=str(row["id"]),
            item_type=row.get("item_type", "common_error"),
            prompt=row.get("prompt", ""),
            answer=row.get("answer", ""),
            note=row.get("note") or "",
            ease_factor=float(row.get("ease_factor", 2.5)),
            interval_days=int(row.get("interval_days", 1)),
            streak_correct=int(row.get("streak_correct", 0)),
            next_review_at=row.get("next_review_at", now_iso),
        ))
    return items


@router.get("/count", response_model=ReviewCountResponse)
async def get_due_count(
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
) -> ReviewCountResponse:
    """Return the count of currently-due review items for the user.

    Mirrors /due: degrade to count=0 on transient errors so the badge
    just shows nothing instead of breaking the page that hosts it.
    """
    uid = str(user_id)
    now_iso = datetime.now(timezone.utc).isoformat()

    try:
        result = supabase.table("review_items") \
            .select("id", count="exact") \
            .eq("user_id", uid) \
            .lte("next_review_at", now_iso) \
            .execute()
    except Exception:
        logger.exception("Failed to fetch review count for user %s", uid)
        return ReviewCountResponse(count=0)

    return ReviewCountResponse(count=result.count or 0)


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

    new_ef = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    new_ef = max(1.3, round(new_ef, 2))

    return new_ef, new_interval, new_streak


@router.post("/{item_id}/rate", response_model=RateDifficultyResponse)
async def rate_item(
    item_id: str,
    body: RateDifficultyRequest,
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
) -> RateDifficultyResponse:
    """Record a difficulty rating for a review item, applying SM-2 scheduling.

    Returns 404 if the item doesn't exist for this user, 503 on transient
    Supabase errors, otherwise 200 with the updated SM-2 schedule.
    """
    uid = str(user_id)
    logger.info("Review rating: user=%s item=%s difficulty=%s", uid, item_id, body.difficulty)

    # Use limit(1) instead of .single() — supabase-py's .single() raises
    # PGRST116 for "no rows", which we'd then have to string-match to
    # distinguish from real errors. limit(1) gives us a clean
    # data-or-empty contract.
    try:
        result = supabase.table("review_items") \
            .select("ease_factor, interval_days, streak_correct") \
            .eq("id", item_id) \
            .eq("user_id", uid) \
            .limit(1) \
            .execute()
    except Exception:
        logger.exception("Failed to fetch review item %s for user %s", item_id, uid)
        raise HTTPException(status_code=503, detail="Review service temporarily unavailable")

    if not result.data:
        raise HTTPException(status_code=404, detail="Review item not found")

    row = result.data[0]
    new_ef, new_interval, new_streak = _sm2_update(
        float(row["ease_factor"]),
        int(row["interval_days"]),
        int(row["streak_correct"]),
        body.difficulty,
    )
    now = datetime.now(timezone.utc)
    next_review = (now + timedelta(days=new_interval)).isoformat()

    try:
        supabase.table("review_items").update({
            "ease_factor": new_ef,
            "interval_days": new_interval,
            "streak_correct": new_streak,
            "next_review_at": next_review,
            "last_reviewed_at": now.isoformat(),
        }).eq("id", item_id).execute()
    except Exception:
        logger.exception("Failed to update review item %s for user %s", item_id, uid)
        raise HTTPException(status_code=503, detail="Review service temporarily unavailable")

    return RateDifficultyResponse(
        success=True,
        next_interval_days=new_interval,
        new_ease_factor=new_ef,
    )
