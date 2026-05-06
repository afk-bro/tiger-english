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
