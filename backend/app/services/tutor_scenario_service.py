"""Tutor scenario service — read-only catalog access.

Performs the SELECTs needed to render the scenario list and detail pages.
All audio paths are resolved to public URLs via `tutor_audio_url`. The
service degrades gracefully (empty list / None) on transient errors so a
flaky Supabase connection doesn't crash catalog rendering.
"""
import logging
from uuid import UUID

from app.core.storage import tutor_audio_url
from app.models.tutor import (
    TutorPhrase,
    TutorScenarioDetail,
    TutorScenarioSummary,
    TutorTask,
)

logger = logging.getLogger(__name__)


class TutorScenarioService:
    def __init__(self, supabase):
        self.supabase = supabase

    def list_scenarios(self) -> list[TutorScenarioSummary]:
        """Return the published scenario catalog as summaries.

        Sorted by `sort_order ASC, slug ASC` so the order is stable across
        renders. Degrades to `[]` on transient supabase errors.
        """
        try:
            result = (
                self.supabase.table("ai_tutor_scenarios")
                .select("slug, title_en, title_vi, level, mode, is_free, sort_order")
                .order("sort_order")
                .order("slug")
                .execute()
            )
        except Exception:
            logger.exception("Failed to list tutor scenarios")
            return []

        rows = result.data or []
        return [
            TutorScenarioSummary(
                slug=row["slug"],
                title_en=row["title_en"],
                title_vi=row["title_vi"],
                level=row["level"],
                mode=row["mode"],
                is_free=row["is_free"],
            )
            for row in rows
        ]

    def get_detail(self, slug: str, user_id: UUID) -> TutorScenarioDetail | None:
        """Return the full scenario detail (scenario + tasks + phrases +
        existing active session id) or None if the slug is unknown.

        Issues four SELECTs: the scenario row, its tasks, its phrases, and
        a lookup for the user's currently-active session on this scenario.
        Any audio_path columns are resolved to public URLs.
        """
        try:
            scenario_result = (
                self.supabase.table("ai_tutor_scenarios")
                .select("*")
                .eq("slug", slug)
                .limit(1)
                .execute()
            )
        except Exception:
            logger.exception("Failed to load tutor scenario slug=%s", slug)
            return None

        scenario_rows = scenario_result.data or []
        if not scenario_rows:
            return None
        scenario_row = scenario_rows[0]
        scenario_id = scenario_row["id"]

        try:
            tasks_result = (
                self.supabase.table("ai_tutor_scenario_tasks")
                .select("*")
                .eq("scenario_id", scenario_id)
                .order("sort_order")
                .execute()
            )
            tasks_rows = tasks_result.data or []
        except Exception:
            logger.exception("Failed to load tutor tasks for scenario_id=%s", scenario_id)
            tasks_rows = []

        try:
            phrases_result = (
                self.supabase.table("ai_tutor_scenario_phrases")
                .select("*")
                .eq("scenario_id", scenario_id)
                .order("sort_order")
                .execute()
            )
            phrases_rows = phrases_result.data or []
        except Exception:
            logger.exception("Failed to load tutor phrases for scenario_id=%s", scenario_id)
            phrases_rows = []

        active_session_id = None
        try:
            session_result = (
                self.supabase.table("ai_tutor_sessions")
                .select("id")
                .eq("user_id", str(user_id))
                .eq("scenario_id", scenario_id)
                .eq("status", "active")
                .limit(1)
                .execute()
            )
            session_rows = session_result.data or []
            if session_rows:
                active_session_id = UUID(str(session_rows[0]["id"]))
        except Exception:
            logger.exception(
                "Failed to look up active tutor session user_id=%s scenario_id=%s",
                user_id,
                scenario_id,
            )

        return TutorScenarioDetail(
            id=UUID(str(scenario_row["id"])),
            slug=scenario_row["slug"],
            mode=scenario_row["mode"],
            level=scenario_row["level"],
            title_en=scenario_row["title_en"],
            title_vi=scenario_row["title_vi"],
            description_en=scenario_row.get("description_en"),
            description_vi=scenario_row.get("description_vi"),
            goal_en=scenario_row.get("goal_en"),
            goal_vi=scenario_row.get("goal_vi"),
            ai_persona=scenario_row.get("ai_persona"),
            opening_line_en=scenario_row["opening_line_en"],
            opening_audio_url=tutor_audio_url(scenario_row.get("opening_audio_path")),
            is_free=scenario_row["is_free"],
            tasks=[
                TutorTask(
                    id=UUID(str(t["id"])),
                    task_key=t["task_key"],
                    title_en=t["title_en"],
                    title_vi=t["title_vi"],
                    sort_order=t["sort_order"],
                    accept_patterns=t["accept_patterns"],
                    correction_templates=t.get("correction_templates") or [],
                    next_ai_line_en=t.get("next_ai_line_en"),
                    next_ai_line_audio_url=tutor_audio_url(t.get("next_ai_line_audio_path")),
                )
                for t in tasks_rows
            ],
            phrases=[
                TutorPhrase(
                    id=UUID(str(p["id"])),
                    phrase_en=p["phrase_en"],
                    translation_vi=p["translation_vi"],
                    audio_url=tutor_audio_url(p.get("audio_path")),
                    sort_order=p["sort_order"],
                )
                for p in phrases_rows
            ],
            existing_active_session_id=active_session_id,
        )
