"""Tests for TutorSessionService — session lifecycle.

This file covers Tasks 4.3 (`start_session`) and 4.4 (`submit_turn`).
Task 4.5 (`finish_session` / `abandon_session`) extends this suite later.
"""

from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import UUID

import pytest


SCENARIO_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
SESSION_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"
TASK_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"


def make_scenario_table_mock(data):
    """Chainable mock for supabase.table('ai_tutor_scenarios').select().eq().single().execute()."""
    m = MagicMock()
    m.select.return_value = m
    m.eq.return_value = m
    m.single.return_value = m
    m.limit.return_value = m
    m.execute.return_value.data = data
    return m


def make_session_table_mock(data):
    """Chainable mock for supabase.table('ai_tutor_sessions').select().eq().single().execute()."""
    m = MagicMock()
    m.select.return_value = m
    m.eq.return_value = m
    m.single.return_value = m
    m.execute.return_value.data = data
    return m


@pytest.fixture(autouse=True)
def _configure_settings(monkeypatch):
    """Pin supabase_url + tutor_audio_bucket so URL builder is predictable."""
    from app.core.config import settings
    monkeypatch.setattr(settings, "supabase_url", "https://test.supabase.co")
    monkeypatch.setattr(settings, "tutor_audio_bucket", "ai-tutor-audio")


def _wire_supabase_for_happy_path(mock_supabase):
    """Set up table routes + RPC for a fresh start_session call."""
    scenario_row = {
        "id": SCENARIO_ID,
        "opening_line_en": "Hi, what can I get for you?",
        "opening_audio_path": "scenarios/coffee-shop/opening.mp3",
    }
    session_row = {
        "id": SESSION_ID,
        "current_task_id": TASK_ID,
        "status": "active",
    }
    table_routes = {
        "ai_tutor_scenarios": make_scenario_table_mock(data=scenario_row),
        "ai_tutor_sessions": make_session_table_mock(data=session_row),
    }
    mock_supabase.table.side_effect = lambda name: table_routes[name]
    mock_supabase.rpc.return_value.execute.return_value.data = SESSION_ID
    return scenario_row, session_row


def test_start_session_fresh_calls_rpc_with_correct_args(mock_supabase, sample_user_id):
    from app.services.tutor_session_service import TutorSessionService

    _wire_supabase_for_happy_path(mock_supabase)

    service = TutorSessionService(mock_supabase)
    service.start_session(sample_user_id, "coffee-shop", mode="fresh")

    mock_supabase.rpc.assert_called_once_with(
        "start_tutor_session_tx",
        {
            "_user_id": str(sample_user_id),
            "_scenario_id": SCENARIO_ID,
            "_mode": "fresh",
        },
    )


def test_start_session_returns_response_with_opening_turn(mock_supabase, sample_user_id):
    from app.services.tutor_session_service import TutorSessionService
    from app.models.tutor import StartSessionResponse, TutorTurnDTO

    _wire_supabase_for_happy_path(mock_supabase)

    service = TutorSessionService(mock_supabase)
    response = service.start_session(sample_user_id, "coffee-shop", mode="fresh")

    assert isinstance(response, StartSessionResponse)
    assert response.session_id == UUID(SESSION_ID)
    assert response.status == "active"
    assert response.current_task_id == UUID(TASK_ID)
    assert isinstance(response.opening_turn, TutorTurnDTO)
    assert response.opening_turn.speaker == "ai"
    assert response.opening_turn.text_en == "Hi, what can I get for you?"
    assert response.opening_turn.audio_url == (
        "https://test.supabase.co/storage/v1/object/public/ai-tutor-audio/"
        "scenarios/coffee-shop/opening.mp3"
    )
    assert response.opening_turn.task_completed is False
    assert response.opening_turn.correction is None


def test_start_session_raises_for_unknown_slug(mock_supabase, sample_user_id):
    from app.services.tutor_session_service import (
        ScenarioNotFoundError,
        TutorSessionService,
    )

    table_routes = {
        "ai_tutor_scenarios": make_scenario_table_mock(data=None),
    }
    mock_supabase.table.side_effect = lambda name: table_routes[name]

    service = TutorSessionService(mock_supabase)
    with pytest.raises(ScenarioNotFoundError):
        service.start_session(sample_user_id, "nonexistent", mode="fresh")

    # RPC must not be called when scenario lookup fails.
    mock_supabase.rpc.assert_not_called()


# ===========================================================================
# submit_turn — Task 4.4
# ===========================================================================

# Two-task fixture: introduce_self (matches "my name is"), then ask_for_name.
INTRO_TASK_ID = "11111111-2222-3333-4444-555555555551"
NEXT_TASK_ID = "11111111-2222-3333-4444-555555555552"

INTRO_TASK_ROW = {
    "id": INTRO_TASK_ID,
    "task_key": "introduce_self",
    "title_en": "Introduce yourself",
    "title_vi": "Giới thiệu bản thân",
    "sort_order": 1,
    "accept_patterns": ["my name is", "i am", "i'm"],
    "correction_templates": [],
    "next_ai_line_en": "Nice to meet you! What's my name?",
    "next_ai_line_audio_path": "scenarios/coffee-shop/t1.mp3",
}

NEXT_TASK_ROW = {
    "id": NEXT_TASK_ID,
    "task_key": "ask_for_name",
    "title_en": "Ask for the AI's name",
    "title_vi": "Hỏi tên AI",
    "sort_order": 2,
    "accept_patterns": ["what is your name", "what's your name"],
    "correction_templates": [],
    "next_ai_line_en": "I'm Alex, nice to meet you!",
    "next_ai_line_audio_path": "scenarios/coffee-shop/t2.mp3",
}


def _make_active_session_row(user_id: UUID, completed: list[str] | None = None):
    """Build an ai_tutor_sessions row for an active session owned by user_id."""
    return {
        "id": SESSION_ID,
        "user_id": str(user_id),
        "scenario_id": SCENARIO_ID,
        "status": "active",
        "current_task_id": INTRO_TASK_ID,
        "completed_task_ids": completed or [],
        "mistake_count": 0,
        "xp_awarded": 0,
        "started_at": datetime(2026, 5, 11, 12, 0, 0, tzinfo=timezone.utc).isoformat(),
        "last_activity_at": datetime(2026, 5, 11, 12, 0, 0, tzinfo=timezone.utc).isoformat(),
        "completed_at": None,
    }


def _make_table_mock_with_select(data):
    """Generic chainable mock for table().select().eq()...single().execute()."""
    m = MagicMock()
    m.select.return_value = m
    m.eq.return_value = m
    m.single.return_value = m
    m.order.return_value = m
    m.limit.return_value = m
    m.execute.return_value.data = data
    return m


def _make_events_insert_mock():
    """Mock for table('ai_tutor_events').insert(...).execute()."""
    m = MagicMock()
    m.insert.return_value = m
    m.execute.return_value.data = None
    return m


def _wire_submit_turn_mocks(
    mock_supabase,
    *,
    session_row,
    tasks_rows,
    updated_session_row=None,
):
    """Configure mock_supabase.table side_effect to route by table name.

    Tracks calls to ai_tutor_events.insert (for telemetry assertions) and
    routes successive ai_tutor_sessions .select() calls — first to the
    initial session_row, second (after the RPC) to updated_session_row.
    """
    if updated_session_row is None:
        updated_session_row = session_row

    # Session select returns initial row first, then updated row second.
    session_table = MagicMock()
    session_table.select.return_value = session_table
    session_table.eq.return_value = session_table
    session_table.single.return_value = session_table
    # Two executes: pre-RPC and post-RPC.
    session_execute = MagicMock()
    session_execute.side_effect = [
        MagicMock(data=session_row),
        MagicMock(data=updated_session_row),
    ]
    session_table.execute = session_execute

    scenario_table = _make_table_mock_with_select({"slug": "coffee-shop"})
    tasks_table = _make_table_mock_with_select(tasks_rows)
    events_table = _make_events_insert_mock()

    routes = {
        "ai_tutor_sessions": session_table,
        "ai_tutor_scenarios": scenario_table,
        "ai_tutor_scenario_tasks": tasks_table,
        "ai_tutor_events": events_table,
    }
    mock_supabase.table.side_effect = lambda name: routes[name]
    mock_supabase.rpc.return_value.execute.return_value.data = None

    return routes


@pytest.mark.asyncio
async def test_submit_turn_stt_failure_raises_and_logs_event(mock_supabase, sample_user_id):
    """STT failure path: raise TurnSTTFailure, log diagnostic event, no RPC."""
    from app.services.stt_provider import StubSTTProvider
    from app.services.tutor_session_service import (
        TurnSTTFailure,
        TutorSessionService,
    )

    session_row = _make_active_session_row(sample_user_id)
    routes = _wire_submit_turn_mocks(
        mock_supabase,
        session_row=session_row,
        tasks_rows=[INTRO_TASK_ROW, NEXT_TASK_ROW],
    )

    stt = StubSTTProvider(simulate_failure=True)
    service = TutorSessionService(mock_supabase, stt=stt)

    with pytest.raises(TurnSTTFailure):
        await service.submit_turn(
            user_id=sample_user_id,
            session_id=UUID(SESSION_ID),
            audio_bytes=b"audio",
            mime_type="audio/webm",
            current_task_id=UUID(INTRO_TASK_ID),
        )

    # No record_tutor_exchange_tx call.
    rpc_calls = [c for c in mock_supabase.rpc.call_args_list if c.args and c.args[0] == "record_tutor_exchange_tx"]
    assert rpc_calls == []

    # Diagnostic event was logged.
    insert_calls = routes["ai_tutor_events"].insert.call_args_list
    assert len(insert_calls) == 1
    payload_arg = insert_calls[0].args[0]
    assert payload_arg["event_type"] == "turn.failed.stt"
    assert payload_arg["user_id"] == str(sample_user_id)
    assert payload_arg["session_id"] == SESSION_ID
    assert "reason" in payload_arg["payload"]


@pytest.mark.asyncio
async def test_submit_turn_end_lesson_detected(mock_supabase, sample_user_id):
    """End-lesson regex match: return end_lesson_detected=True without RPC."""
    from app.services.stt_provider import StubSTTProvider
    from app.services.tutor_session_service import TutorSessionService

    session_row = _make_active_session_row(
        sample_user_id, completed=[INTRO_TASK_ID]  # 1 done out of 2
    )
    _wire_submit_turn_mocks(
        mock_supabase,
        session_row=session_row,
        tasks_rows=[INTRO_TASK_ROW, NEXT_TASK_ROW],
    )

    stt = StubSTTProvider(canned_text="please end the lesson")
    service = TutorSessionService(mock_supabase, stt=stt)

    response = await service.submit_turn(
        user_id=sample_user_id,
        session_id=UUID(SESSION_ID),
        audio_bytes=b"audio",
        mime_type="audio/webm",
        current_task_id=UUID(INTRO_TASK_ID),
    )

    assert response.end_lesson_detected is True
    assert response.tasks_done == 1
    assert response.tasks_total == 2
    assert response.new_turns == []
    # No record_tutor_exchange_tx call.
    rpc_calls = [c for c in mock_supabase.rpc.call_args_list if c.args and c.args[0] == "record_tutor_exchange_tx"]
    assert rpc_calls == []


@pytest.mark.asyncio
async def test_submit_turn_vi_spoken_detected(mock_supabase, sample_user_id):
    """Vietnamese transcript: log event, return EvaluationResult(kind='vi_spoken'), no RPC."""
    from app.services.stt_provider import StubSTTProvider
    from app.services.tutor_session_service import TutorSessionService

    session_row = _make_active_session_row(sample_user_id)
    routes = _wire_submit_turn_mocks(
        mock_supabase,
        session_row=session_row,
        tasks_rows=[INTRO_TASK_ROW, NEXT_TASK_ROW],
    )

    stt = StubSTTProvider(canned_text="Tên tôi là Tom")
    service = TutorSessionService(mock_supabase, stt=stt)

    response = await service.submit_turn(
        user_id=sample_user_id,
        session_id=UUID(SESSION_ID),
        audio_bytes=b"audio",
        mime_type="audio/webm",
        current_task_id=UUID(INTRO_TASK_ID),
    )

    assert response.evaluation.kind == "vi_spoken"
    assert response.end_lesson_detected is False
    assert response.new_turns == []

    # No record_tutor_exchange_tx call.
    rpc_calls = [c for c in mock_supabase.rpc.call_args_list if c.args and c.args[0] == "record_tutor_exchange_tx"]
    assert rpc_calls == []

    # Diagnostic event was logged.
    insert_calls = routes["ai_tutor_events"].insert.call_args_list
    assert any(c.args[0]["event_type"] == "turn.vi_spoken" for c in insert_calls)


@pytest.mark.asyncio
async def test_submit_turn_completes_task_and_advances(mock_supabase, sample_user_id):
    """Happy path: transcript matches accept_patterns → advance + use next_ai_line_en."""
    from app.services.stt_provider import StubSTTProvider
    from app.services.tutor_session_service import TutorSessionService

    session_row = _make_active_session_row(sample_user_id)
    updated_session_row = {
        **session_row,
        "current_task_id": NEXT_TASK_ID,
        "completed_task_ids": [INTRO_TASK_ID],
    }
    _wire_submit_turn_mocks(
        mock_supabase,
        session_row=session_row,
        tasks_rows=[INTRO_TASK_ROW, NEXT_TASK_ROW],
        updated_session_row=updated_session_row,
    )

    stt = StubSTTProvider(canned_text="My name is Tom")
    service = TutorSessionService(mock_supabase, stt=stt)

    response = await service.submit_turn(
        user_id=sample_user_id,
        session_id=UUID(SESSION_ID),
        audio_bytes=b"audio",
        mime_type="audio/webm",
        current_task_id=UUID(INTRO_TASK_ID),
    )

    # RPC called with the right args.
    rpc_calls = [c for c in mock_supabase.rpc.call_args_list if c.args and c.args[0] == "record_tutor_exchange_tx"]
    assert len(rpc_calls) == 1
    rpc_args = rpc_calls[0].args[1]
    assert rpc_args["_completed_task_id"] == INTRO_TASK_ID
    assert rpc_args["_next_task_id"] == NEXT_TASK_ID
    assert rpc_args["_ai_text"] == INTRO_TASK_ROW["next_ai_line_en"]
    assert rpc_args["_ai_audio_path"] == INTRO_TASK_ROW["next_ai_line_audio_path"]
    assert rpc_args["_ai_task_id"] == NEXT_TASK_ID
    assert rpc_args["_user_text"] == "My name is Tom"
    assert rpc_args["_session_id"] == SESSION_ID
    assert rpc_args["_user_id"] == str(sample_user_id)

    # Response shape: end_lesson_detected False, two new turns, current_task_id advanced.
    assert response.end_lesson_detected is False
    assert len(response.new_turns) == 2
    assert response.new_turns[0].speaker == "user"
    assert response.new_turns[0].text_en == "My name is Tom"
    assert response.new_turns[1].speaker == "ai"
    assert response.new_turns[1].text_en == INTRO_TASK_ROW["next_ai_line_en"]
    assert response.current_task_id == UUID(NEXT_TASK_ID)


@pytest.mark.asyncio
async def test_submit_turn_no_match_uses_retry_line(mock_supabase, sample_user_id):
    """Non-matching transcript: no advance, RPC called with retry line + no task ids."""
    from app.services.stt_provider import StubSTTProvider
    from app.services.tutor_session_service import TutorSessionService

    session_row = _make_active_session_row(sample_user_id)
    _wire_submit_turn_mocks(
        mock_supabase,
        session_row=session_row,
        tasks_rows=[INTRO_TASK_ROW, NEXT_TASK_ROW],
    )

    stt = StubSTTProvider(canned_text="hello there friend")
    service = TutorSessionService(mock_supabase, stt=stt)

    response = await service.submit_turn(
        user_id=sample_user_id,
        session_id=UUID(SESSION_ID),
        audio_bytes=b"audio",
        mime_type="audio/webm",
        current_task_id=UUID(INTRO_TASK_ID),
    )

    rpc_calls = [c for c in mock_supabase.rpc.call_args_list if c.args and c.args[0] == "record_tutor_exchange_tx"]
    assert len(rpc_calls) == 1
    rpc_args = rpc_calls[0].args[1]
    assert rpc_args["_completed_task_id"] is None
    assert rpc_args["_next_task_id"] is None
    assert rpc_args["_ai_text"] == "Try again — you can do it!"
    assert rpc_args["_ai_audio_path"] is None
    assert rpc_args["_ai_task_id"] == INTRO_TASK_ID  # stay on current task

    # current_task_id in response stays None (no advance pointer); end_lesson False.
    assert response.end_lesson_detected is False
    assert response.current_task_id is None


@pytest.mark.asyncio
async def test_submit_turn_final_task_completion_uses_wrapup_line(mock_supabase, sample_user_id):
    """Completing the last task: RPC called with no next_task_id + canned wrap-up line."""
    from app.services.stt_provider import StubSTTProvider
    from app.services.tutor_session_service import TutorSessionService

    # Session is on the LAST task (NEXT_TASK_ROW), and user matches its pattern.
    session_row = _make_active_session_row(sample_user_id, completed=[INTRO_TASK_ID])
    session_row["current_task_id"] = NEXT_TASK_ID
    updated_session_row = {
        **session_row,
        "current_task_id": None,
        "completed_task_ids": [INTRO_TASK_ID, NEXT_TASK_ID],
    }
    _wire_submit_turn_mocks(
        mock_supabase,
        session_row=session_row,
        tasks_rows=[INTRO_TASK_ROW, NEXT_TASK_ROW],
        updated_session_row=updated_session_row,
    )

    stt = StubSTTProvider(canned_text="What is your name?")
    service = TutorSessionService(mock_supabase, stt=stt)

    response = await service.submit_turn(
        user_id=sample_user_id,
        session_id=UUID(SESSION_ID),
        audio_bytes=b"audio",
        mime_type="audio/webm",
        current_task_id=UUID(NEXT_TASK_ID),
    )

    rpc_calls = [c for c in mock_supabase.rpc.call_args_list if c.args and c.args[0] == "record_tutor_exchange_tx"]
    assert len(rpc_calls) == 1
    rpc_args = rpc_calls[0].args[1]
    assert rpc_args["_completed_task_id"] == NEXT_TASK_ID
    assert rpc_args["_next_task_id"] is None
    assert rpc_args["_ai_text"] == "Great job! That was a really nice chat. Want to end here?"
    assert rpc_args["_ai_audio_path"] is None
    assert rpc_args["_ai_task_id"] is None

    assert response.end_lesson_detected is False
    assert response.current_task_id is None
