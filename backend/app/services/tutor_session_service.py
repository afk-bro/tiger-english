"""Tutor session service — manages the session lifecycle (Tasks 4.3, 4.4, 4.5).

This module owns the write path for AI tutor sessions. The Postgres functions
(`start_tutor_session_tx`, `record_tutor_exchange_tx`, ...) handle the
transactional bits; the service is responsible for orchestrating slug→id
lookups, calling the RPCs, reading back projections, and shaping
HTTP-friendly response DTOs.

Task 4.3 (this file): `start_session` only.
Tasks 4.4/4.5 will add `submit_turn`, `finish_session`, `abandon_session`.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Literal
from uuid import UUID

from app.core.storage import tutor_audio_url
from app.models.tutor import StartSessionResponse, TutorTurnDTO

logger = logging.getLogger(__name__)


class ScenarioNotFoundError(Exception):
    """Raised when a scenario slug doesn't resolve to a row.

    Phase 5 (HTTP routing) maps this to a 404 response.
    """


class TutorSessionService:
    def __init__(self, supabase, stt=None):
        # `stt` is unused by start_session but accepted here so callers can
        # construct a single service instance and pass it through to
        # submit_turn (Task 4.4) without rewiring DI.
        self.supabase = supabase
        self.stt = stt

    def start_session(
        self,
        user_id: UUID,
        scenario_slug: str,
        mode: Literal['fresh', 'continue'] = 'fresh',
    ) -> StartSessionResponse:
        """Start (or resume) an AI tutor session for the given user + scenario.

        Both `'fresh'` and `'continue'` go through the same RPC
        (`start_tutor_session_tx`); the function itself decides whether to
        create a new row or return an existing active session id.

        Design note — the opening AI turn is **ephemeral**: we don't write it
        to `ai_tutor_turns`. Instead we synthesize it on the fly from the
        scenario's `opening_line_en` + `opening_audio_path`. The scenario row
        is the canonical source for the opener, so we save a DB write and
        keep the turn log strictly for "real" exchanges. The frontend treats
        the opening turn like any other — once the user submits a turn,
        `submit_turn` returns the next AI turn (this time actually
        persisted) and the conversation rolls from there.
        """
        # 1. Resolve slug → scenario_id. `.single()` returns either a row dict
        #    in `.data` or `None` (when zero rows match, depending on client
        #    version). Either case we treat as "not found".
        scenario_result = (
            self.supabase.table("ai_tutor_scenarios")
            .select("id, opening_line_en, opening_audio_path")
            .eq("slug", scenario_slug)
            .single()
            .execute()
        )
        scenario = scenario_result.data
        if not scenario:
            raise ScenarioNotFoundError(
                f"No tutor scenario found for slug={scenario_slug!r}"
            )

        # 2. Call the transactional RPC. Returns the active session id
        #    (new for `fresh`, possibly existing for `continue`).
        rpc_result = self.supabase.rpc(
            "start_tutor_session_tx",
            {
                "_user_id": str(user_id),
                "_scenario_id": scenario["id"],
                "_mode": mode,
            },
        ).execute()
        session_id = rpc_result.data

        # 3. Read back the session row to pick up `current_task_id` (set by
        #    the RPC) plus any other server-assigned columns.
        session_result = (
            self.supabase.table("ai_tutor_sessions")
            .select("*")
            .eq("id", session_id)
            .single()
            .execute()
        )
        session_row = session_result.data
        if not session_row:
            # Should never happen — the RPC just returned this id.
            raise RuntimeError(
                f"start_tutor_session_tx returned session_id={session_id!r} "
                "but the row could not be read back"
            )

        # 4. Build the ephemeral opening turn from the scenario row.
        opening_turn = TutorTurnDTO(
            id=uuid.uuid4(),  # ephemeral — not persisted to ai_tutor_turns
            speaker="ai",
            text_en=scenario["opening_line_en"],
            audio_url=tutor_audio_url(scenario.get("opening_audio_path")),
            correction=None,
            task_completed=False,
            created_at=datetime.now(timezone.utc),
        )

        return StartSessionResponse(
            session_id=UUID(str(session_id)),
            status="active",
            current_task_id=UUID(str(session_row["current_task_id"])),
            opening_turn=opening_turn,
        )
