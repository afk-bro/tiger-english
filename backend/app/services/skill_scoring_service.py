"""Skill scoring service — EWMA smoothing over the last 30 observed scores.

Formula:
    new_score = alpha * observed + (1 - alpha) * current_score
    alpha = 2 / (min(sample_size, 30) + 1)

This gives more weight to recent observations as the window fills up.
Score clamped to [0, 5].
"""
from __future__ import annotations

import logging
from uuid import UUID

from ..models.skills import ALL_SKILL_KEYS, SkillKey, SkillScore

logger = logging.getLogger(__name__)

# EWMA window size cap
SAMPLE_WINDOW = 30


def compute_alpha(sample_size: int) -> float:
    """Return the EWMA smoothing factor for a given sample_size."""
    return 2.0 / (min(sample_size, SAMPLE_WINDOW) + 1)


def update_skill_score(
    current_score: float,
    current_sample_size: int,
    observed_score: float,
) -> tuple[float, int]:
    """Apply one EWMA update step.

    Returns:
        (new_score, new_sample_size)
    """
    new_size = min(current_sample_size + 1, SAMPLE_WINDOW)
    alpha = compute_alpha(new_size)
    new_score = alpha * observed_score + (1.0 - alpha) * current_score
    return round(min(max(new_score, 0.0), 5.0), 4), new_size


class SkillScoringService:
    """Fetch and update skill scores from the database."""

    def __init__(self, supabase):
        self._db = supabase

    def get_summary(self, user_id: UUID) -> list[SkillScore]:
        """Return all 11 skill scores for the given user.

        If the `skill_scores` table does not exist yet (migration pending),
        returns zero-initialized scores so the frontend can render cleanly.
        """
        try:
            result = (
                self._db
                .table("skill_scores")
                .select("skill, score, sample_size, last_updated_at")
                .eq("user_id", str(user_id))
                .execute()
            )
            rows = result.data or []
        except Exception as exc:
            logger.warning("skill_scores table unavailable: %s", exc)
            rows = []

        score_map = {row["skill"]: row for row in rows}

        skills: list[SkillScore] = []
        for key in ALL_SKILL_KEYS:
            row = score_map.get(key)
            if row:
                skills.append(
                    SkillScore(
                        skill=key,
                        score=float(row.get("score", 0.0)),
                        sample_size=int(row.get("sample_size", 0)),
                        last_updated_at=row.get("last_updated_at"),
                    )
                )
            else:
                skills.append(SkillScore(skill=key))
        return skills
