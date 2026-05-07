"""Tests for the /me/conversations/turn endpoint and the
conversation_turn / system-prompt helpers it depends on.

These pin the contract changes from phase 2a:
- /turn now calls real AiTutorService instead of a stub
- /turn returns 503 + ai_disabled when settings.ai_tutor_enabled is False
- system prompt steers toward `remaining_targets` and changes when the
  list is empty
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient


# ── system-prompt builder (pure function) ───────────────────────────────────


def test_system_prompt_includes_scenario_roles_and_targets():
    from app.services.ai_tutor_service import _build_conversation_system_prompt

    scenario = {
        "ai_role": "A barista at a café",
        "learner_role": "A customer",
        "description": "Order a coffee politely.",
        "target_grammar": ["Can I have…?", "Please / thank you"],
    }
    prompt = _build_conversation_system_prompt(
        scenario, remaining_targets=["coffee", "please"], cefr_level="A1"
    )

    assert "A barista at a café" in prompt
    assert "A customer" in prompt
    assert "Order a coffee politely." in prompt
    assert "Can I have…?" in prompt
    # The steering line names the unused targets
    assert "coffee" in prompt
    assert "please" in prompt
    # CEFR is mentioned so the model adapts difficulty
    assert "A1" in prompt
    # Anti-repetition instruction is present
    assert "repeat" in prompt.lower()


def test_system_prompt_switches_to_closing_message_when_no_targets_left():
    from app.services.ai_tutor_service import _build_conversation_system_prompt

    scenario = {
        "ai_role": "A friend",
        "learner_role": "A friend",
        "description": "Casual chat.",
        "target_grammar": [],
    }
    prompt = _build_conversation_system_prompt(
        scenario, remaining_targets=[], cefr_level="A2"
    )

    # When the list is empty the steering line flips to a closing instruction
    assert "every target word" in prompt or "closing" in prompt.lower()
    assert "Wrap" in prompt or "wrap" in prompt


def test_system_prompt_handles_missing_optional_scenario_fields():
    from app.services.ai_tutor_service import _build_conversation_system_prompt

    # Scenarios without target_grammar should fall back to a sensible default
    prompt = _build_conversation_system_prompt(
        {"ai_role": "Someone", "learner_role": "You", "description": ""},
        remaining_targets=["hello"],
        cefr_level="A1",
    )
    assert "natural conversational English" in prompt


# ── /turn endpoint ──────────────────────────────────────────────────────────


@pytest.fixture
def client_with_mocked_service(sample_user_id, monkeypatch):
    """TestClient with AiTutorService mocked + ai_tutor_enabled forced True."""
    from app.main import app
    from app.api.v1.ai_tutor import get_ai_tutor_service
    from app.core.security import get_current_user
    from app.services.ai_tutor_service import AiTutorService
    from app.core.config import settings

    # Force the gate open so we exercise the success / error branches
    monkeypatch.setattr(type(settings), "ai_tutor_enabled", property(lambda self: True))

    mock_service = MagicMock(spec=AiTutorService)
    app.dependency_overrides[get_ai_tutor_service] = lambda: mock_service
    app.dependency_overrides[get_current_user] = lambda: sample_user_id

    yield TestClient(app), mock_service

    app.dependency_overrides.clear()


@pytest.fixture
def client_with_ai_disabled(sample_user_id, monkeypatch):
    """TestClient where settings.ai_tutor_enabled returns False."""
    from app.main import app
    from app.core.security import get_current_user
    from app.core.config import settings

    monkeypatch.setattr(type(settings), "ai_tutor_enabled", property(lambda self: False))

    app.dependency_overrides[get_current_user] = lambda: sample_user_id

    yield TestClient(app)

    app.dependency_overrides.clear()


class TestConversationTurn:
    def test_returns_503_ai_disabled_when_key_not_configured(self, client_with_ai_disabled):
        client = client_with_ai_disabled
        resp = client.post(
            "/api/v1/me/conversations/turn",
            json={
                "scenario_slug": "introduce-yourself-a1",
                "message": "Hello!",
                "history": [],
                "remaining_targets": ["hello"],
            },
        )
        assert resp.status_code == 503
        body = resp.json()
        assert body["code"] == "ai_disabled"

    def test_returns_404_for_unknown_scenario(self, client_with_mocked_service):
        client, _ = client_with_mocked_service
        resp = client.post(
            "/api/v1/me/conversations/turn",
            json={
                "scenario_slug": "this-scenario-does-not-exist",
                "message": "Hi.",
                "history": [],
                "remaining_targets": [],
            },
        )
        assert resp.status_code == 404

    def test_calls_service_with_scenario_history_and_remaining_targets(
        self, client_with_mocked_service
    ):
        client, service = client_with_mocked_service
        service.conversation_turn = AsyncMock(return_value="Welcome to our café!")

        resp = client.post(
            "/api/v1/me/conversations/turn",
            json={
                "scenario_slug": "order-coffee-a1",
                "message": "I want coffee please.",
                "history": [
                    {"role": "ai", "text": "Hi! What can I get for you?"},
                ],
                "remaining_targets": ["thank you", "how much"],
            },
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["reply"] == "Welcome to our café!"
        assert body["turn_index"] == 2  # 1 prior + this one

        # Service was called with the right arguments
        service.conversation_turn.assert_awaited_once()
        kwargs = service.conversation_turn.await_args.kwargs
        assert kwargs["scenario"]["slug"] == "order-coffee-a1"
        assert kwargs["message"] == "I want coffee please."
        assert kwargs["remaining_targets"] == ["thank you", "how much"]
        assert kwargs["cefr_level"] == "A1"
        # History was forwarded as a list of dicts (not Pydantic models)
        assert kwargs["history"] == [{"role": "ai", "text": "Hi! What can I get for you?"}]

    def test_returns_503_when_service_raises_ai_disabled_at_runtime(
        self, client_with_mocked_service
    ):
        """The settings gate may pass at request time but a missing
        anthropic package or unexpected key issue can still surface from
        the service layer. Both must yield ai_disabled, not 500."""
        client, service = client_with_mocked_service
        from app.services.ai_tutor_service import AiDisabledException

        service.conversation_turn = AsyncMock(
            side_effect=AiDisabledException("anthropic not installed")
        )

        resp = client.post(
            "/api/v1/me/conversations/turn",
            json={
                "scenario_slug": "introduce-yourself-a1",
                "message": "Hi.",
                "history": [],
                "remaining_targets": [],
            },
        )
        assert resp.status_code == 503
        assert resp.json()["code"] == "ai_disabled"

    def test_returns_500_for_unexpected_service_failure(self, client_with_mocked_service):
        client, service = client_with_mocked_service
        service.conversation_turn = AsyncMock(side_effect=RuntimeError("boom"))

        resp = client.post(
            "/api/v1/me/conversations/turn",
            json={
                "scenario_slug": "introduce-yourself-a1",
                "message": "Hi.",
                "history": [],
                "remaining_targets": [],
            },
        )
        assert resp.status_code == 500

    def test_remaining_targets_defaults_to_empty(self, client_with_mocked_service):
        """Old clients that don't yet send remaining_targets must keep
        working — the field defaults to [] on the request model."""
        client, service = client_with_mocked_service
        service.conversation_turn = AsyncMock(return_value="ok")

        resp = client.post(
            "/api/v1/me/conversations/turn",
            json={
                "scenario_slug": "introduce-yourself-a1",
                "message": "Hi.",
                "history": [],
            },
        )
        assert resp.status_code == 200
        kwargs = service.conversation_turn.await_args.kwargs
        assert kwargs["remaining_targets"] == []
