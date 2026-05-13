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
from app.models.tutor import (
    ActiveSessionDTO,
    EvaluationResult,
    FinishResponse,
    StartSessionResponse,
    TurnCorrection,
    TurnResponse,
    TutorSessionDTO,
    TutorTurnDTO,
)
from app.services.stt_provider import STTFailureError
from app.services.tutor_evaluator_service import (
    TutorEvaluatorService,
    detect_end_lesson,
    is_vietnamese_text,
)

logger = logging.getLogger(__name__)


# Canonical AI lines used in the submit_turn fallback paths.
_AI_LINE_ALL_TASKS_DONE = "Great job! That was a really nice chat. Want to end here?"
_AI_LINE_RETRY = "Try again — you can do it!"


class ScenarioNotFoundError(Exception):
    """Raised when a scenario slug doesn't resolve to a row.

    Phase 5 (HTTP routing) maps this to a 404 response.
    """


class SessionNotFoundError(Exception):
    """No session row found for the given id."""


class SessionAccessDeniedError(Exception):
    """Session exists but belongs to a different user."""


class SessionNotActiveError(Exception):
    """Session exists and is owned but is not in 'active' status (already completed/abandoned)."""


class TurnSTTFailure(Exception):
    """STT failure — route handler maps to 503; no session/turn writes occurred."""

    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


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

    # ------------------------------------------------------------------
    # submit_turn — hot path for AI tutor speech (Task 4.4).
    # ------------------------------------------------------------------

    async def submit_turn(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
        audio_bytes: bytes,
        mime_type: str,
        current_task_id: UUID,
    ) -> TurnResponse:
        """Submit a single user turn through the full pipeline.

        Pipeline ordering (spec §6):
          1. Auth/ownership/active check (mostly enforced by route, defensive
             check here too).
          2. Validate audio (size cap is in the route).
          3. STT → on failure, log event + raise TurnSTTFailure (no writes).
          4. End-lesson detection FIRST (regex incl. Vietnamese variant).
          5. VI-spoken detection (diacritic regex).
          6. Evaluate.
          7. Compute next-task pointers.
          8. Pick AI's next line.
          9. record_tutor_exchange_tx (single atomic call).
         10. Build TurnResponse.
        """
        if self.stt is None:
            # Programming error — submit_turn requires an STT provider.
            raise RuntimeError("TutorSessionService.submit_turn requires an STT provider")

        # 1. Load session (defensive ownership/status check).
        session_result = (
            self.supabase.table("ai_tutor_sessions")
            .select("id, user_id, scenario_id, status, completed_task_ids, started_at")
            .eq("id", str(session_id))
            .single()
            .execute()
        )
        session = session_result.data
        if not session:
            raise SessionNotFoundError(str(session_id))
        if session["user_id"] != str(user_id):
            raise SessionAccessDeniedError(str(session_id))
        if session["status"] != "active":
            raise SessionNotActiveError(session["status"])

        # Resolve scenario slug (used for DTO + diagnostics).
        scenario_lookup = (
            self.supabase.table("ai_tutor_scenarios")
            .select("slug")
            .eq("id", session["scenario_id"])
            .single()
            .execute()
        )
        scenario_row = scenario_lookup.data or {}
        scenario_slug = scenario_row.get("slug")

        # Load all tasks for this scenario, ordered by sort_order.
        tasks_result = (
            self.supabase.table("ai_tutor_scenario_tasks")
            .select(
                "id, task_key, title_en, title_vi, sort_order, "
                "accept_patterns, correction_templates, "
                "next_ai_line_en, next_ai_line_audio_path"
            )
            .eq("scenario_id", session["scenario_id"])
            .order("sort_order")
            .execute()
        )
        tasks_rows = tasks_result.data or []
        if not tasks_rows:
            raise RuntimeError("scenario has no tasks")

        tasks_by_id = {t["id"]: t for t in tasks_rows}
        current_task = tasks_by_id.get(str(current_task_id))
        if current_task is None:
            raise ValueError("current_task_id does not belong to this scenario")

        # 3. STT.
        try:
            transcript_result = await self.stt.transcribe(
                audio_bytes,
                mime_type,
                prompt=current_task["title_en"],
            )
        except STTFailureError as exc:
            # Log diagnostic event; NO session/turn writes.
            self._log_event(
                event_type="turn.failed.stt",
                user_id=user_id,
                session_id=session_id,
                payload={"reason": exc.reason, "http_status": exc.http_status},
            )
            raise TurnSTTFailure(exc.reason) from exc

        transcript = transcript_result.text

        # 4. End-lesson detection FIRST. No DB writes; route will open the
        #    confirmation modal and call /finish on confirm.
        if detect_end_lesson(transcript):
            tasks_done = len(session.get("completed_task_ids") or [])
            tasks_total = len(tasks_rows)
            return TurnResponse(
                transcript=transcript,
                evaluation=EvaluationResult(kind="evaluated"),
                session=self._session_to_dto(session, scenario_slug),
                new_turns=[],
                current_task_id=current_task_id,
                end_lesson_detected=True,
                tasks_done=tasks_done,
                tasks_total=tasks_total,
            )

        # 5. VI-spoken detection. No DB writes; UI shows "speak English" nudge.
        if is_vietnamese_text(transcript):
            self._log_event(
                event_type="turn.vi_spoken",
                user_id=user_id,
                session_id=session_id,
                payload={"transcript_length": len(transcript)},
            )
            return TurnResponse(
                transcript=transcript,
                evaluation=EvaluationResult(kind="vi_spoken"),
                session=self._session_to_dto(session, scenario_slug),
                new_turns=[],
                current_task_id=current_task_id,
                end_lesson_detected=False,
            )

        # 6. Evaluate.
        evaluator = TutorEvaluatorService()
        eval_result = evaluator.evaluate(transcript, current_task)

        # 7. Compute next-task pointers. tasks_rows is already ordered by
        #    sort_order from the SQL query above — no local re-sort needed.
        if eval_result.should_advance:
            completed_task_id_arg = current_task["id"]
            next_task = next(
                (t for t in tasks_rows if t["sort_order"] > current_task["sort_order"]),
                None,
            )
            next_task_id_arg = next_task["id"] if next_task else None
            all_tasks_done = next_task is None
        else:
            completed_task_id_arg = None
            next_task_id_arg = None
            all_tasks_done = False

        # 8. Pick AI's next line.
        if eval_result.should_advance and next_task is not None and not all_tasks_done:
            ai_text = current_task.get("next_ai_line_en")
            ai_audio_path = current_task.get("next_ai_line_audio_path")
            ai_task_id_arg = next_task["id"]
        elif all_tasks_done:
            ai_text = _AI_LINE_ALL_TASKS_DONE
            ai_audio_path = None
            ai_task_id_arg = None
        else:
            ai_text = _AI_LINE_RETRY
            ai_audio_path = None
            ai_task_id_arg = current_task["id"]

        # 9. record_tutor_exchange_tx — single atomic call.
        correction_dict = (
            eval_result.correction.model_dump() if eval_result.correction else None
        )
        # Concurrent double-submits: idempotency / serialization is handled by
        # record_tutor_exchange_tx and the unique partial index on active sessions
        # (see migration 20260510000001). The service does not need its own lock.
        self.supabase.rpc(
            "record_tutor_exchange_tx",
            {
                "_session_id": str(session_id),
                "_user_id": str(user_id),
                "_user_text": transcript,
                "_user_evaluator_result": eval_result.model_dump(),
                "_user_correction": correction_dict,
                "_completed_task_id": completed_task_id_arg,
                "_next_task_id": next_task_id_arg,
                "_ai_text": ai_text,
                "_ai_audio_path": ai_audio_path,
                "_ai_task_id": ai_task_id_arg,
            },
        ).execute()

        # 10. Re-read session for fresh state after RPC, build response.
        updated_session_result = (
            self.supabase.table("ai_tutor_sessions")
            .select("*")
            .eq("id", str(session_id))
            .single()
            .execute()
        )
        updated_session = updated_session_result.data or session

        # Synthesize ephemeral DTOs for the two new turns. They were just
        # inserted by the RPC; we could read them back, but the IDs aren't
        # needed by the frontend at this point — it keys off the text and
        # current_task_id. Mirrors the start_session opening-turn pattern.
        now = datetime.now(timezone.utc)
        user_turn = TutorTurnDTO(
            id=uuid.uuid4(),
            speaker="user",
            text_en=transcript,
            audio_url=None,
            correction=eval_result.correction,
            task_completed=(completed_task_id_arg is not None),
            created_at=now,
        )
        ai_turn = TutorTurnDTO(
            id=uuid.uuid4(),
            speaker="ai",
            text_en=ai_text,
            audio_url=tutor_audio_url(ai_audio_path),
            correction=None,
            task_completed=False,
            created_at=now,
        )

        return TurnResponse(
            transcript=transcript,
            evaluation=eval_result,
            session=self._session_to_dto(updated_session, scenario_slug),
            new_turns=[user_turn, ai_turn],
            current_task_id=(
                UUID(str(next_task_id_arg)) if next_task_id_arg else None
            ),
            end_lesson_detected=False,
        )

    # ------------------------------------------------------------------
    # finish_session / abandon_session — terminal transitions (Task 4.5).
    # ------------------------------------------------------------------

    def finish_session(self, user_id: UUID, session_id: UUID) -> FinishResponse:
        """Complete an active session, award XP, and return a summary DTO.

        XP formula (spec §5): `max(5, 25 + 10 * tasks_completed - 5 * mistakes)`.
        The 25-point base means even a session with zero tasks and a few
        mistakes still earns the floor of 5, so users aren't punished for
        starting and trying.

        The transactional bits (status flip + completed_at + xp_awarded +
        event log) are handled by `complete_tutor_session_tx`. We compute the
        XP here, call the RPC, read back the updated row, and collect every
        turn's `correction` JSONB so the frontend can render an end-of-lesson
        recap.
        """
        # 1. Load + ownership/status check. The RPC itself is idempotent, but
        #    we surface a clean SessionNotActiveError to the caller — finishing
        #    an already-completed session is almost certainly a bug.
        session_result = (
            self.supabase.table("ai_tutor_sessions")
            .select("id, user_id, scenario_id, status, completed_task_ids, mistake_count")
            .eq("id", str(session_id))
            .single()
            .execute()
        )
        session = session_result.data
        if not session:
            raise SessionNotFoundError(str(session_id))
        if session["user_id"] != str(user_id):
            raise SessionAccessDeniedError(str(session_id))
        if session["status"] != "active":
            raise SessionNotActiveError(session["status"])

        # 2. Compute XP.
        tasks_completed = len(session.get("completed_task_ids") or [])
        mistake_count = session.get("mistake_count", 0) or 0
        xp = max(5, 25 + 10 * tasks_completed - 5 * mistake_count)

        # 3. Transactional flip.
        self.supabase.rpc(
            "complete_tutor_session_tx",
            {
                "_session_id": str(session_id),
                "_xp_awarded": xp,
            },
        ).execute()

        # 4. Read back the updated row (now status='completed', completed_at
        #    populated, xp_awarded set).
        updated_result = (
            self.supabase.table("ai_tutor_sessions")
            .select("*")
            .eq("id", str(session_id))
            .single()
            .execute()
        )
        updated_session = updated_result.data
        if not updated_session:
            raise RuntimeError(
                f"complete_tutor_session_tx succeeded for session_id={session_id!r} "
                "but the row could not be read back"
            )

        # 5. Resolve scenario slug for the DTO.
        scenario_lookup = (
            self.supabase.table("ai_tutor_scenarios")
            .select("slug")
            .eq("id", session["scenario_id"])
            .single()
            .execute()
        )
        scenario_row = scenario_lookup.data or {}
        scenario_slug = scenario_row.get("slug")

        # 6. Collect corrections across all turns. We pull only the `correction`
        #    column to keep the payload small; ordering doesn't matter for the
        #    recap UI but follows insert order naturally.
        turns_result = (
            self.supabase.table("ai_tutor_turns")
            .select("correction")
            .eq("session_id", str(session_id))
            .execute()
        )
        turns_rows = turns_result.data or []
        parsed_corrections = [
            TurnCorrection(**t["correction"])
            for t in turns_rows
            if t.get("correction")
        ]

        return FinishResponse(
            session=self._session_to_dto(updated_session, scenario_slug),
            xp_awarded=xp,
            all_corrections=parsed_corrections,
        )

    def abandon_session(
        self,
        user_id: UUID,
        session_id: UUID,
        reason: str = "user_cancelled",
    ) -> None:
        """Mark an active session as abandoned.

        Idempotent by design: if the session is already in a terminal state
        (completed/abandoned) we short-circuit without raising. The frontend
        may call this defensively on tab-close or back-button, and the RPC's
        own `status='active'` guard would no-op anyway — skipping the network
        round-trip is the cleaner UX.

        Ownership errors still raise — a wrong-owner call is never silent.
        """
        session_result = (
            self.supabase.table("ai_tutor_sessions")
            .select("id, user_id, status")
            .eq("id", str(session_id))
            .single()
            .execute()
        )
        session = session_result.data
        if not session:
            raise SessionNotFoundError(str(session_id))
        if session["user_id"] != str(user_id):
            raise SessionAccessDeniedError(str(session_id))
        if session["status"] != "active":
            # Idempotent no-op — see docstring.
            return

        self.supabase.rpc(
            "abandon_tutor_session_tx",
            {
                "_session_id": str(session_id),
                "_reason": reason,
            },
        ).execute()

    # ------------------------------------------------------------------
    # Read: active-session lookup for the home hero card.
    # ------------------------------------------------------------------

    def get_active_session(self, user_id: UUID) -> ActiveSessionDTO | None:
        """Return the user's most-recently-active session, or None.

        Selects the latest row in `ai_tutor_sessions` with status='active'
        for this user (ordered by last_activity_at desc, limit 1). The partial
        unique index already enforces at-most-one per (user, scenario); this
        method picks one across scenarios.
        """
        row_result = (
            self.supabase.table("ai_tutor_sessions")
            .select(
                "id, scenario_id, completed_task_ids, last_activity_at, started_at"
            )
            .eq("user_id", str(user_id))
            .eq("status", "active")
            .order("last_activity_at", desc=True)
            .limit(1)
            .execute()
        )
        rows = row_result.data or []
        if not rows:
            return None
        row = rows[0]

        scenario_result = (
            self.supabase.table("ai_tutor_scenarios")
            .select("slug, title_en, title_vi")
            .eq("id", row["scenario_id"])
            .single()
            .execute()
        )
        scenario = scenario_result.data
        if not scenario:
            # Data-integrity issue: an active session row points at a missing
            # scenario. Log so it's observable, but degrade the page gracefully
            # (the hero falls through to the featured/cold state).
            logger.warning(
                "get_active_session: session %s references missing scenario %s",
                row["id"],
                row["scenario_id"],
            )
            return None

        tasks_result = (
            self.supabase.table("ai_tutor_scenario_tasks")
            .select("id", count="exact")
            .eq("scenario_id", row["scenario_id"])
            .execute()
        )
        tasks_total = tasks_result.count or 0
        tasks_done = len(row.get("completed_task_ids") or [])

        return ActiveSessionDTO(
            session_id=row["id"],
            scenario_slug=scenario["slug"],
            scenario_title_en=scenario["title_en"],
            scenario_title_vi=scenario["title_vi"],
            last_activity_at=row.get("last_activity_at") or row["started_at"],
            tasks_done=tasks_done,
            tasks_total=tasks_total,
        )

    # ------------------------------------------------------------------
    # Helpers.
    # ------------------------------------------------------------------

    def _session_to_dto(
        self, session_row: dict, scenario_slug: str | None
    ) -> TutorSessionDTO:
        """Build a TutorSessionDTO from a raw ai_tutor_sessions row.

        `scenario_slug` is resolved by the caller (the row only has
        scenario_id). We accept `None` defensively but Pydantic will reject
        it — that surfaces a real data integrity issue rather than masking
        it.
        """
        return TutorSessionDTO(
            id=session_row["id"],
            scenario_slug=scenario_slug,
            status=session_row["status"],
            current_task_id=session_row.get("current_task_id"),
            completed_task_ids=session_row.get("completed_task_ids") or [],
            mistake_count=session_row.get("mistake_count", 0),
            xp_awarded=session_row.get("xp_awarded", 0),
            started_at=session_row["started_at"],
            last_activity_at=session_row.get("last_activity_at")
            or session_row["started_at"],
            completed_at=session_row.get("completed_at"),
        )

    def _log_event(
        self,
        event_type: str,
        *,
        user_id: UUID | None,
        session_id: UUID | None,
        payload: dict,
    ) -> None:
        """Insert a diagnostic row into ai_tutor_events.

        Telemetry must never break a request — swallow exceptions but log
        them for investigation.
        """
        try:
            self.supabase.table("ai_tutor_events").insert(
                {
                    "user_id": str(user_id) if user_id else None,
                    "session_id": str(session_id) if session_id else None,
                    "event_type": event_type,
                    "payload": payload,
                }
            ).execute()
        except Exception:  # pragma: no cover — telemetry failure path
            logger.exception(
                "Failed to log ai_tutor_events row (event_type=%s)", event_type
            )
