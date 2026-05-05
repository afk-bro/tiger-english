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

    # Map section_key → list of (skill_key, weight) affected by exercise in that section
    SECTION_SKILL_MAP: dict[str, list[tuple[str, float]]] = {
        "grammar": [("grammar_accuracy", 1.0), ("grammar_range", 0.5)],
        "vocabulary": [("vocabulary_accuracy", 1.0), ("vocabulary_range", 0.5)],
        "activities": [("grammar_accuracy", 0.7), ("vocabulary_accuracy", 0.7)],
        "dialogues": [("fluency", 0.5), ("listening_comprehension", 0.5)],
        "overview": [("reading_comprehension", 0.6)],
    }

    def record_exercise_attempt(
        self,
        user_id: UUID,
        section_key: str,
        is_correct: bool,
    ) -> None:
        """Update skill scores after an exercise attempt.

        Uses a heuristic mapping from section_key to affected skills.
        Correct answers contribute a score of 4.0; incorrect = 1.5.
        Silently no-ops if the skill_scores table doesn't exist yet.
        """
        observed = 4.0 if is_correct else 1.5
        affected = self.SECTION_SKILL_MAP.get(section_key, [("task_completion", 0.5)])

        try:
            # Fetch current scores for this user's affected skills
            skill_keys = [s for s, _ in affected]
            result = (
                self._db
                .table("skill_scores")
                .select("skill, score, sample_size")
                .eq("user_id", str(user_id))
                .in_("skill", skill_keys)
                .execute()
            )
            current_map = {row["skill"]: row for row in (result.data or [])}

            from datetime import datetime, timezone
            now = datetime.now(timezone.utc).isoformat()

            for skill_key, weight in affected:
                row = current_map.get(skill_key)
                current_score = float(row["score"]) if row else 0.0
                current_size = int(row["sample_size"]) if row else 0

                # Weight the observation
                weighted_observed = min(max(observed * weight + current_score * (1 - weight), 0), 5.0)
                new_score, new_size = update_skill_score(current_score, current_size, weighted_observed)

                # Upsert the skill score
                self._db.table("skill_scores").upsert({
                    "user_id": str(user_id),
                    "skill": skill_key,
                    "score": new_score,
                    "sample_size": new_size,
                    "last_updated_at": now,
                }, on_conflict="user_id,skill").execute()

        except Exception as exc:
            logger.warning("Could not update skill score for user %s: %s", user_id, exc)

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
