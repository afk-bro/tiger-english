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
from ..core import in_memory_skills as _mem

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

        uid = str(user_id)

        # First, try to update the DB skill_scores table
        db_ok = False
        try:
            skill_keys = [s for s, _ in affected]
            result = (
                self._db
                .table("skill_scores")
                .select("skill, score, sample_size")
                .eq("user_id", uid)
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

                weighted_observed = min(max(observed * weight + current_score * (1 - weight), 0), 5.0)
                new_score, new_size = update_skill_score(current_score, current_size, weighted_observed)

                self._db.table("skill_scores").upsert({
                    "user_id": uid,
                    "skill": skill_key,
                    "score": new_score,
                    "sample_size": new_size,
                    "last_updated_at": now,
                }, on_conflict="user_id,skill").execute()

                # Mirror to in-memory store
                _mem.upsert_skill(uid, skill_key, new_score, new_size)

            db_ok = True

        except Exception as exc:
            logger.warning("DB skill_scores unavailable for user %s: %s — using in-memory store", uid, exc)

        # If DB failed, update the in-memory store so skills page still shows data
        if not db_ok:
            for skill_key, weight in affected:
                mem_row = _mem.get_skill(uid, skill_key)
                current_score = float(mem_row["score"]) if mem_row else 0.0
                current_size = int(mem_row["sample_size"]) if mem_row else 0

                weighted_observed = min(max(observed * weight + current_score * (1 - weight), 0), 5.0)
                new_score, new_size = update_skill_score(current_score, current_size, weighted_observed)
                _mem.upsert_skill(uid, skill_key, new_score, new_size)

    def get_summary(self, user_id: UUID) -> list[SkillScore]:
        """Return all 11 skill scores for the given user.

        Merges DB data with in-memory scores (DB takes priority when available).
        If the `skill_scores` table does not exist yet, falls back to in-memory store.
        """
        uid = str(user_id)

        # Try DB first
        db_rows: list[dict] = []
        try:
            result = (
                self._db
                .table("skill_scores")
                .select("skill, score, sample_size, last_updated_at")
                .eq("user_id", uid)
                .execute()
            )
            db_rows = result.data or []
        except Exception as exc:
            logger.warning("skill_scores table unavailable: %s", exc)

        score_map = {row["skill"]: row for row in db_rows}

        # Fill missing skills from in-memory store
        mem_rows = _mem.get_all_skills(uid)
        for mem_row in mem_rows:
            key = mem_row["skill"]
            if key not in score_map:
                score_map[key] = mem_row

        skills: list[SkillScore] = []
        for key in ALL_SKILL_KEYS:
            row = score_map.get(key)
            if row and (float(row.get("score", 0.0)) > 0 or int(row.get("sample_size", 0)) > 0):
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
