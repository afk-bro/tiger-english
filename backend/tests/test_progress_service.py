"""Tests for ProgressService — mocked Supabase client."""

from datetime import datetime, timezone
from uuid import UUID

import pytest


def test_complete_lesson_section_calls_rpc_with_idempotency_key(mock_supabase, sample_user_id):
    from app.services.progress_service import ProgressService

    expected_row = {
        "unit_slug": "unit-1",
        "section_key": "overview",
        "completed_at": datetime(2026, 5, 3, 10, 0, 0, tzinfo=timezone.utc).isoformat(),
    }
    mock_supabase.rpc.return_value.execute.return_value.data = expected_row

    service = ProgressService(mock_supabase)
    result = service.complete_lesson_section(sample_user_id, "unit-1", "overview")

    mock_supabase.rpc.assert_called_once_with(
        "complete_lesson_section_tx",
        {
            "p_user_id": "11111111-1111-1111-1111-111111111111",
            "p_unit_slug": "unit-1",
            "p_section_key": "overview",
            "p_idempotency_key": "11111111-1111-1111-1111-111111111111:unit-1:overview:completed",
        },
    )
    assert result == expected_row


def test_submit_exercise_attempt_calls_rpc(mock_supabase, sample_user_id):
    from app.services.progress_service import ProgressService

    expected_row = {"id": 42, "attempted_at": "2026-05-03T10:00:00+00:00"}
    mock_supabase.rpc.return_value.execute.return_value.data = expected_row

    service = ProgressService(mock_supabase)
    result = service.submit_exercise_attempt(
        sample_user_id, "unit-2", "grammar", "u2-grammar-mcq-1", True
    )

    mock_supabase.rpc.assert_called_once_with(
        "submit_exercise_attempt_tx",
        {
            "p_user_id": "11111111-1111-1111-1111-111111111111",
            "p_unit_slug": "unit-2",
            "p_section_key": "grammar",
            "p_exercise_id": "u2-grammar-mcq-1",
            "p_is_correct": True,
        },
    )
    assert result == expected_row


def test_submit_exercise_attempt_records_incorrect(mock_supabase, sample_user_id):
    """Wrong answers must also be recorded — incorrect attempts are
    a meaningful signal for the recommendation engine in Phase 2."""
    from app.services.progress_service import ProgressService

    mock_supabase.rpc.return_value.execute.return_value.data = {"id": 43}

    service = ProgressService(mock_supabase)
    service.submit_exercise_attempt(sample_user_id, "unit-1", "grammar", "u1-grammar-mcq-1", False)

    args, _ = mock_supabase.rpc.call_args
    assert args[1]["p_is_correct"] is False
