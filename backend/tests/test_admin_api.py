"""Authorization tests for /api/v1/admin/* endpoints.

The super-admin gate must fail CLOSED: an empty SUPER_ADMIN_USER_IDS denies
access in any non-"development" environment. Auth is bypassed by overriding
``get_current_user``; ``settings`` is mutated via monkeypatch per case.
"""
from uuid import UUID

import pytest
from fastapi.testclient import TestClient


SAMPLE_USER_ID = UUID("11111111-1111-1111-1111-111111111111")
ADMIN_USER_ID = UUID("22222222-2222-2222-2222-222222222222")


@pytest.fixture
def client_as(monkeypatch):
    """Returns a factory: configure(env, admin_ids, user_id) -> TestClient.

    Overrides get_current_user to the given user and patches the admin
    allowlist + environment on the live settings object.
    """
    from app.main import app
    from app.core.security import get_current_user
    from app.core.config import settings

    def configure(*, environment: str, admin_ids: list[str], user_id: UUID = SAMPLE_USER_ID):
        import json

        monkeypatch.setattr(settings, "environment", environment)
        monkeypatch.setattr(settings, "super_admin_user_ids", json.dumps(admin_ids))
        app.dependency_overrides[get_current_user] = lambda: user_id
        return TestClient(app)

    yield configure
    app.dependency_overrides.clear()


def test_empty_allowlist_in_production_denies(client_as):
    """Regression: fail-closed. Empty allowlist + production => 403, not open."""
    client = client_as(environment="production", admin_ids=[])
    response = client.get("/api/v1/admin/ai-usage-summary")
    assert response.status_code == 403


def test_empty_allowlist_in_development_allows(client_as):
    """Dev convenience: empty allowlist + development => any authed user passes."""
    client = client_as(environment="development", admin_ids=[])
    response = client.get("/api/v1/admin/ai-usage-summary")
    assert response.status_code == 200


def test_non_admin_user_denied_when_allowlist_set(client_as):
    client = client_as(
        environment="production",
        admin_ids=[str(ADMIN_USER_ID)],
        user_id=SAMPLE_USER_ID,
    )
    response = client.get("/api/v1/admin/ai-usage-summary")
    assert response.status_code == 403


def test_admin_user_allowed_when_allowlist_set(client_as):
    client = client_as(
        environment="production",
        admin_ids=[str(ADMIN_USER_ID)],
        user_id=ADMIN_USER_ID,
    )
    response = client.get("/api/v1/admin/ai-usage-summary")
    assert response.status_code == 200
