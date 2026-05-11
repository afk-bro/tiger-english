"""Endpoint tests for the AI tutor scenario read endpoints.

Service layer is overridden via FastAPI's ``app.dependency_overrides`` so
these tests run without a real Supabase connection. Auth is similarly
bypassed by overriding ``get_current_user``.
"""

from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest
from fastapi.testclient import TestClient


SAMPLE_USER_ID = UUID("11111111-1111-1111-1111-111111111111")
SAMPLE_SCENARIO_ID = UUID("22222222-2222-2222-2222-222222222222")
SAMPLE_TASK_ID = UUID("33333333-3333-3333-3333-333333333333")
SAMPLE_PHRASE_ID = UUID("44444444-4444-4444-4444-444444444444")


def _summary_dict(slug: str = "coffee-shop"):
    return {
        "slug": slug,
        "title_en": "At a Coffee Shop",
        "title_vi": "Tại quán cà phê",
        "level": "A1",
        "mode": "course",
        "is_free": True,
    }


def _detail_dict(slug: str = "coffee-shop"):
    return {
        "id": str(SAMPLE_SCENARIO_ID),
        "slug": slug,
        "mode": "course",
        "level": "A1",
        "title_en": "At a Coffee Shop",
        "title_vi": "Tại quán cà phê",
        "description_en": "Order a drink in English.",
        "description_vi": "Gọi đồ uống bằng tiếng Anh.",
        "goal_en": "Practice ordering",
        "goal_vi": "Luyện gọi món",
        "ai_persona": "Friendly barista",
        "opening_line_en": "Hi! What can I get you?",
        "opening_audio_url": None,
        "is_free": True,
        "tasks": [
            {
                "id": str(SAMPLE_TASK_ID),
                "task_key": "order_drink",
                "title_en": "Order a drink",
                "title_vi": "Gọi đồ uống",
                "sort_order": 1,
                "accept_patterns": [],
                "correction_templates": [],
                "next_ai_line_en": "Coming right up!",
                "next_ai_line_audio_url": None,
            }
        ],
        "phrases": [
            {
                "id": str(SAMPLE_PHRASE_ID),
                "phrase_en": "I'd like a coffee",
                "translation_vi": "Tôi muốn một ly cà phê",
                "audio_url": None,
                "sort_order": 1,
            }
        ],
        "existing_active_session_id": None,
    }


@pytest.fixture
def client_with_mock_service():
    """Returns (TestClient, mock_service) where TutorScenarioService is
    replaced with a MagicMock, auth is bypassed, and Supabase is stubbed."""
    from app.main import app
    from app.core.security import get_current_user
    from app.core.supabase import get_supabase_admin

    mock_service = MagicMock()
    app.dependency_overrides[get_current_user] = lambda: SAMPLE_USER_ID
    app.dependency_overrides[get_supabase_admin] = lambda: MagicMock()

    # Patch the service class in the router module so both endpoints
    # construct our mock instead of the real one.
    with patch(
        "app.api.v1.ai_tutor_session.TutorScenarioService",
        return_value=mock_service,
    ):
        with TestClient(app) as c:
            yield c, mock_service

    app.dependency_overrides.clear()


def test_list_scenarios_returns_summaries(client_with_mock_service):
    from app.models.tutor import TutorScenarioSummary

    client, service = client_with_mock_service
    service.list_scenarios.return_value = [TutorScenarioSummary(**_summary_dict())]

    res = client.get(
        "/api/v1/ai-tutor/scenarios",
        headers={"Authorization": "Bearer fake-token"},
    )

    assert res.status_code == 200
    body = res.json()
    assert isinstance(body, list)
    assert len(body) == 1
    assert body[0]["slug"] == "coffee-shop"
    service.list_scenarios.assert_called_once()


def test_get_scenario_returns_detail(client_with_mock_service):
    from app.models.tutor import TutorScenarioDetail

    client, service = client_with_mock_service
    service.get_detail.return_value = TutorScenarioDetail(**_detail_dict())

    res = client.get(
        "/api/v1/ai-tutor/scenarios/coffee-shop",
        headers={"Authorization": "Bearer fake-token"},
    )

    assert res.status_code == 200
    body = res.json()
    assert body["slug"] == "coffee-shop"
    assert body["title_en"] == "At a Coffee Shop"
    assert len(body["tasks"]) == 1
    assert len(body["phrases"]) == 1
    service.get_detail.assert_called_once()


def test_get_scenario_returns_404_for_missing_slug(client_with_mock_service):
    client, service = client_with_mock_service
    service.get_detail.return_value = None

    res = client.get(
        "/api/v1/ai-tutor/scenarios/does-not-exist",
        headers={"Authorization": "Bearer fake-token"},
    )

    assert res.status_code == 404


def test_list_scenarios_requires_auth():
    """No Authorization header → 401 from get_current_user.

    Doesn't use the fixture because the fixture overrides the auth dep.
    """
    from app.main import app

    # Ensure no stale overrides leak in from another test in this module.
    app.dependency_overrides.clear()

    with TestClient(app) as c:
        res = c.get("/api/v1/ai-tutor/scenarios")

    assert res.status_code == 401
