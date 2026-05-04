"""Tests for ProgressService — mocked Supabase client."""

from datetime import date, datetime, timezone
from unittest.mock import MagicMock
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


def test_review_flashcard_calls_rpc(mock_supabase, sample_user_id):
    from app.services.progress_service import ProgressService

    flashcard_id = UUID("22222222-2222-2222-2222-222222222222")
    expected_row = {"id": 99, "reviewed_at": "2026-05-03T10:05:00+00:00"}
    mock_supabase.rpc.return_value.execute.return_value.data = expected_row

    service = ProgressService(mock_supabase)
    result = service.review_flashcard(sample_user_id, flashcard_id, "known")

    mock_supabase.rpc.assert_called_once_with(
        "review_flashcard_tx",
        {
            "p_user_id": "11111111-1111-1111-1111-111111111111",
            "p_flashcard_id": "22222222-2222-2222-2222-222222222222",
            "p_status": "known",
        },
    )
    assert result == expected_row


def test_review_flashcard_accepts_unknown_status(mock_supabase, sample_user_id):
    from app.services.progress_service import ProgressService

    flashcard_id = UUID("22222222-2222-2222-2222-222222222222")
    mock_supabase.rpc.return_value.execute.return_value.data = {}

    service = ProgressService(mock_supabase)
    service.review_flashcard(sample_user_id, flashcard_id, "unknown")

    args, _ = mock_supabase.rpc.call_args
    assert args[1]["p_status"] == "unknown"


def test_get_summary_assembles_all_components(mock_supabase, sample_user_id, monkeypatch):
    """Verify get_summary calls the right Supabase queries and assembles
    the response shape correctly. We don't test the SQL itself here —
    that's verified end-to-end in the manual walkthrough."""
    from app.services.progress_service import ProgressService

    # Mock the chained .table().select()...execute() calls
    def make_table_mock(data=None, count=None):
        m = MagicMock()
        m.select.return_value = m
        m.eq.return_value = m
        m.order.return_value = m
        m.limit.return_value = m
        m.single.return_value = m
        m.execute.return_value.data = data
        m.execute.return_value.count = count
        return m

    table_mocks = {
        "profiles": make_table_mock(data={"timezone": "UTC"}),
        "lesson_section_progress": make_table_mock(data=[
            {"unit_slug": "unit-1", "section_key": "overview"},
            {"unit_slug": "unit-1", "section_key": "grammar"},
            {"unit_slug": "unit-1", "section_key": "vocabulary"},
            {"unit_slug": "unit-1", "section_key": "dialogues"},
            {"unit_slug": "unit-1", "section_key": "activities"},
            {"unit_slug": "unit-2", "section_key": "overview"},
        ]),
        "exercise_attempts": make_table_mock(count=10),
        "flashcard_reviews": make_table_mock(count=42),
        "user_card_progress": make_table_mock(count=12),
        "user_activity_log": make_table_mock(data=[{"created_at": "2026-05-03T10:00:00+00:00"}]),
    }
    mock_supabase.table = lambda name: table_mocks[name]
    mock_supabase.rpc.return_value.execute.return_value.data = [{"day": "2026-05-03"}]

    monkeypatch.setattr("app.services.progress_service._today_in_tz", lambda tz: date(2026, 5, 3))

    service = ProgressService(mock_supabase)
    summary = service.get_summary(sample_user_id)

    assert summary["activity"]["lessons_completed"] == 1  # only unit-1 has all 5 sections
    assert summary["streak"]["current_days"] == 1
    assert summary["last_active_at"] == "2026-05-03T10:00:00+00:00"
