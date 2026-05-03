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
