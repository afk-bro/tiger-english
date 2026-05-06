"""Tests for AiTutorService — all Anthropic SDK calls are mocked."""
from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID

import pytest


# ── Helpers ──────────────────────────────────────────────────────────────────

def _make_message(text: str):
    """Fake anthropic.types.Message with a single TextBlock."""
    block = MagicMock()
    block.text = text
    msg = MagicMock()
    msg.content = [block]
    return msg


# ── Service-level tests ───────────────────────────────────────────────────────


class TestAiTutorServiceExplain:
    @pytest.mark.asyncio
    async def test_explain_returns_explanation(self):
        from app.services.ai_tutor_service import AiTutorService

        fake_client = MagicMock()
        fake_client.messages.create = AsyncMock(
            return_value=_make_message("Present simple is used for habits.")
        )

        with (
            patch("app.services.ai_tutor_service._ANTHROPIC_AVAILABLE", True),
            patch("app.services.ai_tutor_service.settings") as mock_settings,
            patch("app.services.ai_tutor_service._build_client", return_value=fake_client),
        ):
            mock_settings.ai_tutor_enabled = True
            mock_settings.ai_default_model = "claude-haiku-4-5"

            service = AiTutorService()
            result = await service.explain(
                question="What is present simple?",
                context=None,
                learner_language="en",
                cefr_level="A1",
            )

        assert result.explanation == "Present simple is used for habits."

    @pytest.mark.asyncio
    async def test_explain_includes_context_in_prompt(self):
        from app.services.ai_tutor_service import AiTutorService

        fake_client = MagicMock()
        fake_client.messages.create = AsyncMock(return_value=_make_message("Good question."))
        captured = {}

        async def capture(*args, **kwargs):
            captured["messages"] = kwargs.get("messages", [])
            return _make_message("Good question.")

        fake_client.messages.create = capture

        with (
            patch("app.services.ai_tutor_service._ANTHROPIC_AVAILABLE", True),
            patch("app.services.ai_tutor_service.settings") as mock_settings,
            patch("app.services.ai_tutor_service._build_client", return_value=fake_client),
        ):
            mock_settings.ai_tutor_enabled = True
            mock_settings.ai_default_model = "claude-haiku-4-5"

            service = AiTutorService()
            await service.explain(
                question="Why is this?",
                context="Unit 1 lesson on to be.",
                learner_language="vi",
                cefr_level="A1",
            )

        user_content = captured["messages"][0]["content"]
        assert "Unit 1 lesson on to be." in user_content

    @pytest.mark.asyncio
    async def test_explain_raises_when_ai_disabled(self):
        from app.services.ai_tutor_service import AiDisabledException, AiTutorService

        with (
            patch("app.services.ai_tutor_service._ANTHROPIC_AVAILABLE", False),
        ):
            service = AiTutorService()
            with pytest.raises(AiDisabledException):
                await service.explain("q", None, "en", "A1")


class TestAiTutorServiceCorrect:
    @pytest.mark.asyncio
    async def test_correct_parses_valid_json(self):
        from app.services.ai_tutor_service import AiTutorService

        payload = {
            "original": "I go to market yesterday",
            "corrected": "I went to the market yesterday.",
            "explanation": "Use past simple for completed past actions.",
            "explanation_l1": "Dùng quá khứ đơn cho hành động đã hoàn thành.",
            "try_again_prompt": "Complete: Yesterday I ___ to the market.",
            "try_again_answer": "went",
        }
        fake_client = MagicMock()
        fake_client.messages.create = AsyncMock(
            return_value=_make_message(json.dumps(payload))
        )

        with (
            patch("app.services.ai_tutor_service._ANTHROPIC_AVAILABLE", True),
            patch("app.services.ai_tutor_service.settings") as mock_settings,
            patch("app.services.ai_tutor_service._build_client", return_value=fake_client),
        ):
            mock_settings.ai_tutor_enabled = True
            mock_settings.ai_default_model = "claude-haiku-4-5"

            service = AiTutorService()
            result = await service.correct("I go to market yesterday", "vi", "A1")

        assert result.corrected == "I went to the market yesterday."
        assert result.try_again_answer == "went"
        assert "quá khứ" in result.explanation_l1

    @pytest.mark.asyncio
    async def test_correct_handles_malformed_json_gracefully(self):
        from app.services.ai_tutor_service import AiTutorService

        fake_client = MagicMock()
        fake_client.messages.create = AsyncMock(
            return_value=_make_message("not json at all")
        )

        with (
            patch("app.services.ai_tutor_service._ANTHROPIC_AVAILABLE", True),
            patch("app.services.ai_tutor_service.settings") as mock_settings,
            patch("app.services.ai_tutor_service._build_client", return_value=fake_client),
        ):
            mock_settings.ai_tutor_enabled = True
            mock_settings.ai_default_model = "claude-haiku-4-5"

            service = AiTutorService()
            result = await service.correct("bad sentence", "en", "A1")

        # Falls back gracefully — original is preserved
        assert result.original == "bad sentence"
        assert result.corrected == "bad sentence"


class TestAiTutorServicePractice:
    @pytest.mark.asyncio
    async def test_practice_returns_items(self):
        from app.services.ai_tutor_service import AiTutorService

        payload = {
            "items": [
                {"question": "She ___ (be) happy.", "answer": "is", "hint": "3rd person singular"},
                {"question": "They ___ (be) tired.", "answer": "are", "hint": "plural"},
            ]
        }
        fake_client = MagicMock()
        fake_client.messages.create = AsyncMock(
            return_value=_make_message(json.dumps(payload))
        )

        with (
            patch("app.services.ai_tutor_service._ANTHROPIC_AVAILABLE", True),
            patch("app.services.ai_tutor_service.settings") as mock_settings,
            patch("app.services.ai_tutor_service._build_client", return_value=fake_client),
        ):
            mock_settings.ai_tutor_enabled = True
            mock_settings.ai_default_model = "claude-haiku-4-5"

            service = AiTutorService()
            result = await service.practice("grammar", "to be", "A1", "en", 2)

        assert len(result.items) == 2
        assert result.items[0].answer == "is"
        assert result.items[1].hint == "plural"

    @pytest.mark.asyncio
    async def test_practice_handles_bad_json(self):
        from app.services.ai_tutor_service import AiTutorService

        fake_client = MagicMock()
        fake_client.messages.create = AsyncMock(
            return_value=_make_message("```json\nnot valid\n```")
        )

        with (
            patch("app.services.ai_tutor_service._ANTHROPIC_AVAILABLE", True),
            patch("app.services.ai_tutor_service.settings") as mock_settings,
            patch("app.services.ai_tutor_service._build_client", return_value=fake_client),
        ):
            mock_settings.ai_tutor_enabled = True
            mock_settings.ai_default_model = "claude-haiku-4-5"

            service = AiTutorService()
            result = await service.practice("grammar", None, "A1", "en", 3)

        assert result.items == []


class TestAiTutorServiceWritingCoach:
    @pytest.mark.asyncio
    async def test_writing_coach_parses_response(self):
        from app.services.ai_tutor_service import AiTutorService

        payload = {
            "scores": [
                {"skill": "Grammar", "score": 6, "comment": "Good overall, a few tense errors."},
                {"skill": "Vocabulary", "score": 7, "comment": "Adequate range."},
            ],
            "inline_annotations": [
                {"offset": 10, "length": 4, "issue": "Wrong tense", "suggestion": "went"},
            ],
            "rewritten_exemplar": "Yesterday I went to the market and bought some food.",
        }
        fake_client = MagicMock()
        fake_client.messages.create = AsyncMock(
            return_value=_make_message(json.dumps(payload))
        )

        with (
            patch("app.services.ai_tutor_service._ANTHROPIC_AVAILABLE", True),
            patch("app.services.ai_tutor_service.settings") as mock_settings,
            patch("app.services.ai_tutor_service._build_client", return_value=fake_client),
        ):
            mock_settings.ai_tutor_enabled = True
            mock_settings.ai_haiku_model = "claude-haiku-4-5"

            service = AiTutorService()
            result = await service.writing_coach(
                "Yesterday I go to market and buyed some food.",
                "en",
                "A2",
            )

        assert len(result.scores) == 2
        assert result.scores[0].skill == "Grammar"
        assert result.inline_annotations[0].suggestion == "went"
        assert "went to the market" in result.rewritten_exemplar


class TestAiDisabledFallback:
    """When the anthropic SDK is not available, the service raises AiDisabledException."""

    @pytest.mark.asyncio
    async def test_all_methods_raise_when_package_missing(self):
        from app.services.ai_tutor_service import AiDisabledException, AiTutorService

        with patch("app.services.ai_tutor_service._ANTHROPIC_AVAILABLE", False):
            svc = AiTutorService()
            with pytest.raises(AiDisabledException):
                await svc.explain("q", None, "en", "A1")
            with pytest.raises(AiDisabledException):
                await svc.correct("s", "en", "A1")
            with pytest.raises(AiDisabledException):
                await svc.practice("grammar", None, "A1", "en", 3)
            with pytest.raises(AiDisabledException):
                await svc.writing_coach("text", "en", "A1")
