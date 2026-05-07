"""Smoke tests for top-level routes on the FastAPI app.

Pins the lightweight /health probe used by Railway and any other host
platform — important that it stays cheap (no DB roundtrip) so per-
second healthchecks don't hammer Supabase.
"""
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_returns_200_and_status_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_does_not_touch_supabase(monkeypatch):
    """Regression guard: the platform-level liveness probe must not
    perform any DB I/O. If a future edit accidentally calls Supabase
    here, this test will fail because get_supabase_admin gets monkey-
    patched to raise."""
    from app.core import supabase as supabase_module

    def _explode():
        raise AssertionError("/health must not call Supabase")

    monkeypatch.setattr(supabase_module, "get_supabase_admin", _explode)
    response = client.get("/health")
    assert response.status_code == 200


def test_root_returns_200():
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "Gain English API"
    assert "docs" in body
