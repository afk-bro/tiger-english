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


def test_system_prompt_includes_opening_line_so_model_knows_context():
    from app.services.ai_tutor_service import _build_conversation_system_prompt

    scenario = {
        "ai_role": "Barista",
        "learner_role": "Customer",
        "description": "",
        "opening_line": "Good morning! What can I get for you?",
    }
    prompt = _build_conversation_system_prompt(scenario, [], "A1")
    # The opening line is shown to the user in the UI but isn't in the
    # messages array (Anthropic requires the array to start with a user
    # turn). Carrying it in the system prompt is what keeps the model
    # consistent with what the learner just saw.
    assert "Good morning! What can I get for you?" in prompt


# ── _history_to_anthropic_messages helper ────────────────────────────────


class TestHistoryToAnthropicMessages:
    """Pin the role-mapping + alternation invariants. Anthropic's
    messages.create rejects sequences that don't start with `user` or
    that have consecutive same-role turns; we ensure neither can leak
    out of the service layer."""

    def test_maps_tutor_to_assistant_and_learner_to_user(self):
        from app.services.ai_tutor_service import _history_to_anthropic_messages

        msgs = _history_to_anthropic_messages(
            history=[
                {"role": "learner", "text": "Hello"},
                {"role": "tutor", "text": "Hi! How are you?"},
            ],
            latest_user_message="I'm good, thanks.",
        )
        assert msgs == [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi! How are you?"},
            {"role": "user", "content": "I'm good, thanks."},
        ]

    def test_drops_leading_assistant_turns(self):
        """The seeded scenario opening line lives in `history` as a
        tutor turn at index 0. Anthropic requires the array to start
        with a user turn, so we drop leading assistant entries. The
        opening is preserved separately in the system prompt."""
        from app.services.ai_tutor_service import _history_to_anthropic_messages

        msgs = _history_to_anthropic_messages(
            history=[
                {"role": "tutor", "text": "Welcome to the café."},
                {"role": "tutor", "text": "What would you like?"},
            ],
            latest_user_message="A coffee, please.",
        )
        assert msgs == [{"role": "user", "content": "A coffee, please."}]

    def test_collapses_consecutive_same_role_turns(self):
        from app.services.ai_tutor_service import _history_to_anthropic_messages

        msgs = _history_to_anthropic_messages(
            history=[
                {"role": "learner", "text": "Hi"},
                {"role": "learner", "text": "I want coffee"},
                {"role": "tutor", "text": "Sure!"},
            ],
            latest_user_message="Black, please.",
        )
        # Consecutive learner messages are merged
        assert msgs == [
            {"role": "user", "content": "Hi\nI want coffee"},
            {"role": "assistant", "content": "Sure!"},
            {"role": "user", "content": "Black, please."},
        ]

    def test_merges_latest_message_into_trailing_user_turn(self):
        """If after stripping we'd end on a user turn followed by
        another user turn, merge so the array stays alternating."""
        from app.services.ai_tutor_service import _history_to_anthropic_messages

        msgs = _history_to_anthropic_messages(
            history=[
                {"role": "tutor", "text": "Welcome!"},  # leading, dropped
                {"role": "learner", "text": "Hi"},
            ],
            latest_user_message="I want coffee.",
        )
        assert msgs == [{"role": "user", "content": "Hi\nI want coffee."}]

    def test_skips_unknown_roles_without_failing(self):
        """An unknown role would 422 at the request layer, but defend
        the service layer too in case a future caller bypasses
        TurnRequest validation."""
        from app.services.ai_tutor_service import _history_to_anthropic_messages

        msgs = _history_to_anthropic_messages(
            history=[
                {"role": "system", "text": "internal note"},  # unknown
                {"role": "learner", "text": "Hello"},
            ],
            latest_user_message="follow-up",
        )
        assert msgs == [{"role": "user", "content": "Hello\nfollow-up"}]

    def test_empty_history_yields_single_user_message(self):
        from app.services.ai_tutor_service import _history_to_anthropic_messages

        msgs = _history_to_anthropic_messages([], latest_user_message="Hi.")
        assert msgs == [{"role": "user", "content": "Hi."}]


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
        """Mirrors the actual frontend payload: ChatMessage uses
        role values "tutor" / "learner" (NOT "ai" / "user"). The service
        layer is responsible for mapping these onto Anthropic's roles."""
        client, service = client_with_mocked_service
        service.conversation_turn = AsyncMock(return_value="Welcome to our café!")

        resp = client.post(
            "/api/v1/me/conversations/turn",
            json={
                "scenario_slug": "order-coffee-a1",
                "message": "I want coffee please.",
                "history": [
                    {"role": "tutor", "text": "Hi! What can I get for you?"},
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
        # History forwarded with the frontend roles intact; service does the mapping
        assert kwargs["history"] == [{"role": "tutor", "text": "Hi! What can I get for you?"}]

    def test_rejects_unknown_role_value(self, client_with_mocked_service):
        """TurnMessage.role is now Literal["tutor","learner"] — anything
        else (e.g. an old "ai" or "user") should fail validation rather
        than silently producing a broken Anthropic call."""
        client, _ = client_with_mocked_service
        resp = client.post(
            "/api/v1/me/conversations/turn",
            json={
                "scenario_slug": "introduce-yourself-a1",
                "message": "Hi.",
                "history": [
                    {"role": "ai", "text": "Hello!"},  # legacy/wrong role
                ],
                "remaining_targets": [],
            },
        )
        assert resp.status_code == 422  # Pydantic validation error

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
