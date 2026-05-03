"""Phase 1 progress tracking service.

Each domain function is the SINGLE write path for its action — the
backend never writes the projection or event log tables outside of
these functions. See spec at
docs/superpowers/specs/2026-05-03-phase-1-progress-tracking-design.md
"""

from typing import Literal
from uuid import UUID

from supabase import Client


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
