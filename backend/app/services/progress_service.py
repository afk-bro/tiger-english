"""Phase 1 progress tracking service.

Each domain function is the SINGLE write path for its action — the
backend never writes the projection or event log tables outside of
these functions. See spec at
docs/superpowers/specs/2026-05-03-phase-1-progress-tracking-design.md
"""

from datetime import date, datetime, timedelta
from typing import List, Literal, Optional
from uuid import UUID
from zoneinfo import ZoneInfo

from supabase import Client


REQUIRED_SECTIONS_PER_UNIT = 5
"""Every unit currently has exactly 5 sections (overview, grammar, vocabulary,
dialogues, activities) — see SectionKey at lesson.types.ts:8-13. If a future
unit has a different section count, this constant breaks and we'll need to
introduce backend unit metadata (Phase 2+ migration concern)."""


def _today_in_tz(tz_name: str) -> date:
    """Today's date in the given IANA timezone. Extracted so tests can monkeypatch."""
    return datetime.now(ZoneInfo(tz_name)).date()


def _derive_streak(study_days: List[date], tz_name: str) -> int:
    """Walk a sorted-DESC, deduped list of study days from today backwards,
    counting consecutive days. Returns 0 if the most recent day is older
    than yesterday (streak broken).

    INVARIANT: study_days MUST arrive sorted DESC and deduped. Both are
    enforced in the SQL function `user_study_days`. Don't break either.
    """
    if not study_days:
        return 0
    today = _today_in_tz(tz_name)
    if study_days[0] not in (today, today - timedelta(days=1)):
        return 0
    streak = 1
    for prev, curr in zip(study_days, study_days[1:]):
        if (prev - curr).days == 1:
            streak += 1
        else:
            break
    return streak


def _start_of_iso_week_in_tz(tz_name: str) -> date:
    """Monday of the current ISO week in the user's local timezone."""
    today = _today_in_tz(tz_name)
    return today - timedelta(days=today.weekday())


class ProgressService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    def complete_lesson_section(
        self, user_id: UUID, unit_slug: str, section_key: str
    ):
        """Mark a section complete. Idempotent — re-calling with the
        same args returns the existing row without creating duplicates.
        """
        idem = f"{user_id}:{unit_slug}:{section_key}:completed"
        return self.supabase.rpc(
            "complete_lesson_section_tx",
            {
                "p_user_id": str(user_id),
                "p_unit_slug": unit_slug,
                "p_section_key": section_key,
                "p_idempotency_key": idem,
            },
        ).execute().data

    def submit_exercise_attempt(
        self,
        user_id: UUID,
        unit_slug: str,
        section_key: str,
        exercise_id: str,
        is_correct: bool,
    ):
        """Record a single exercise attempt (correct or incorrect).
        Append-only; multi-attempt is meaningful so no idempotency key.
        """
        return self.supabase.rpc(
            "submit_exercise_attempt_tx",
            {
                "p_user_id": str(user_id),
                "p_unit_slug": unit_slug,
                "p_section_key": section_key,
                "p_exercise_id": exercise_id,
                "p_is_correct": is_correct,
            },
        ).execute().data

    def review_flashcard(
        self,
        user_id: UUID,
        flashcard_id: UUID,
        status: Literal["known", "unknown"],
    ):
        """Record a flashcard review. Wraps the existing user_card_progress
        upsert + appends a flashcard_reviews row + appends an event log
        row, all in one Postgres transaction.
        """
        return self.supabase.rpc(
            "review_flashcard_tx",
            {
                "p_user_id": str(user_id),
                "p_flashcard_id": str(flashcard_id),
                "p_status": status,
            },
        ).execute().data

    def get_summary(self, user_id: UUID):
        """Composite read: aggregates sections, attempts, flashcards,
        streak, and the activity counter block. Returns a dict matching
        ProgressSummaryResponse's shape.
        """
        user_id_str = str(user_id)

        # 1. timezone — fall back to UTC if not set
        profile_row = (
            self.supabase.table("profiles")
            .select("timezone")
            .eq("id", user_id_str)
            .single()
            .execute()
            .data
        )
        tz_name = (profile_row or {}).get("timezone") or "UTC"

        # 2. sections completed (raw list)
        sections = (
            self.supabase.table("lesson_section_progress")
            .select("unit_slug, section_key, completed_at")
            .eq("user_id", user_id_str)
            .execute()
            .data or []
        )

        # 3. exercise attempts: total + correct
        attempts_total = (
            self.supabase.table("exercise_attempts")
            .select("id", count="exact")
            .eq("user_id", user_id_str)
            .execute()
            .count or 0
        )
        attempts_correct = (
            self.supabase.table("exercise_attempts")
            .select("id", count="exact")
            .eq("user_id", user_id_str)
            .eq("is_correct", True)
            .execute()
            .count or 0
        )

        # 4. flashcards: reviewed_total (event log) + currently_known (state)
        reviews_total = (
            self.supabase.table("flashcard_reviews")
            .select("id", count="exact")
            .eq("user_id", user_id_str)
            .execute()
            .count or 0
        )
        cards_known = (
            self.supabase.table("user_card_progress")
            .select("flashcard_id", count="exact")
            .eq("user_id", user_id_str)
            .eq("status", "known")
            .execute()
            .count or 0
        )

        # 5. lessons_completed: count units with all 5 sections present
        lessons_completed = self._count_completed_units(user_id_str)

        # 6. streak + study_days_this_week from the event log
        days_rows = (
            self.supabase.rpc("user_study_days", {"p_user_id": user_id_str, "p_tz": tz_name})
            .execute()
            .data or []
        )
        study_days = [date.fromisoformat(r["day"]) if isinstance(r["day"], str) else r["day"] for r in days_rows]
        streak_count = _derive_streak(study_days, tz_name)
        week_start = _start_of_iso_week_in_tz(tz_name)
        study_days_this_week = sum(1 for d in study_days if d >= week_start)

        # 7. last_active_at
        last_event = (
            self.supabase.table("user_activity_log")
            .select("created_at")
            .eq("user_id", user_id_str)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
            .data
        )
        last_active_at = last_event[0]["created_at"] if last_event else None

        return {
            "sections_completed": sections,
            "exercise_attempts": {"total": attempts_total, "correct": attempts_correct},
            "flashcards": {"reviewed_total": reviews_total, "currently_known": cards_known},
            "streak": {"current_days": streak_count},
            "study_days_this_week": study_days_this_week,
            "last_active_at": last_active_at,
            "activity": {
                "lessons_completed": lessons_completed,
                "exercises_attempted": attempts_total,
                "exercises_correct": attempts_correct,
                "flashcards_reviewed": reviews_total,
                "flashcards_mastered": cards_known,
            },
        }

    def _count_completed_units(self, user_id_str: str) -> int:
        """Count units with all REQUIRED_SECTIONS_PER_UNIT sections present.
        Uses a Postgres aggregation via raw SQL through supabase.rpc would
        be cleaner, but we'd need a dedicated function for it — for now,
        fetch all (unit_slug, section_key) pairs and group in Python. The
        per-user row count is small (at most ~5 sections × N units)."""
        rows = (
            self.supabase.table("lesson_section_progress")
            .select("unit_slug, section_key")
            .eq("user_id", user_id_str)
            .execute()
            .data or []
        )
        from collections import defaultdict
        by_unit = defaultdict(set)
        for row in rows:
            by_unit[row["unit_slug"]].add(row["section_key"])
        return sum(1 for keys in by_unit.values() if len(keys) >= REQUIRED_SECTIONS_PER_UNIT)
