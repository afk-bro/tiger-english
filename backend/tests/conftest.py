"""Shared pytest fixtures for the backend test suite."""

from unittest.mock import MagicMock
from uuid import UUID, uuid4

import pytest


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
