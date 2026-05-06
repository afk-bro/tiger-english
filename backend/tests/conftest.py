"""Shared pytest fixtures for the backend test suite."""

import os
from unittest.mock import MagicMock
from uuid import UUID, uuid4

import pytest

# ── Provide required Settings values so tests don't need a real .env file ───
# These are set before any app module is imported (conftest is loaded first).
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SECRET_KEY", "test-secret-key")
os.environ.setdefault("SECRET_KEY", "test-secret-signing-key")


@pytest.fixture
def sample_user_id() -> UUID:
    """A stable, deterministic UUID for tests that need to pretend a
    user is authenticated. Not registered with Supabase — these tests
    don't hit the real DB."""
    return UUID("11111111-1111-1111-1111-111111111111")


@pytest.fixture
def fresh_user_id() -> UUID:
    """A new UUID per test, for tests that need uniqueness across runs."""
    return uuid4()


@pytest.fixture
def mock_supabase():
    """A MagicMock standing in for a Supabase client. Configure return
    values per test using `mock_supabase.rpc.return_value.execute.return_value.data = ...`.
    """
    return MagicMock()


@pytest.fixture(autouse=True)
def _reset_in_memory_stores():
    """Clear module-level in-memory stores before each test to prevent
    state leaking across tests in the same suite run.

    Three modules keep process-lifetime stores as fallbacks for when their
    backing Supabase tables are absent: in_memory_skills, pending_reviews,
    and ai_usage_log. Without this fixture, tests that exercise the
    skill-scoring write path (e.g. test_progress_service) populate
    in_memory_skills._store, which then makes
    test_skill_scoring::test_get_summary_handles_db_exception read non-zero
    scores via the same fallback path it intends to exercise. Same risk
    applies to the other two stores even if no current test hits it.

    Runs before every test (autouse) and is self-contained: imports happen
    inside the fixture so a missing module doesn't break collection.
    """
    from app.core import in_memory_skills, pending_reviews, ai_usage_log

    in_memory_skills._store.clear()
    pending_reviews._pending.clear()
    ai_usage_log._log.clear()
    yield
    # No teardown needed — the next test's setup will clear again.
