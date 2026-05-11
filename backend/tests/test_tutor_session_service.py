"""Tests for TutorSessionService — session lifecycle.

This file covers Task 4.3 (`start_session`). Tasks 4.4 (`submit_turn`) and
4.5 (`finish_session` / `abandon_session`) extend this suite later.
"""

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
