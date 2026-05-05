"""Endpoint tests for the AI tutor router using FastAPI TestClient.
All Anthropic SDK calls are replaced with mocked AiTutorService methods.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import UUID

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def app_with_ai_tutor(sample_user_id):
    """TestClient whose AiTutorService and auth dep are both mocked."""
    from app.main import app
    from app.api.v1.ai_tutor import get_ai_tutor_service
    from app.core.security import get_current_user
    from app.services.ai_tutor_service import AiTutorService

    mock_service = MagicMock(spec=AiTutorService)
    app.dependency_overrides[get_ai_tutor_service] = lambda: mock_service
    app.dependency_overrides[get_current_user] = lambda: sample_user_id

    yield TestClient(app), mock_service

    app.dependency_overrides.clear()


@pytest.fixture
def app_with_ai_disabled(sample_user_id):
    """TestClient where the service raises AiDisabledException on every call."""
    from app.main import app
    from app.api.v1.ai_tutor import get_ai_tutor_service
    from app.core.security import get_current_user
    from app.services.ai_tutor_service import AiDisabledException, AiTutorService

    mock_service = MagicMock(spec=AiTutorService)
    mock_service.explain = AsyncMock(side_effect=AiDisabledException("no key"))
    mock_service.correct = AsyncMock(side_effect=AiDisabledException("no key"))
    mock_service.practice = AsyncMock(side_effect=AiDisabledException("no key"))
    mock_service.writing_coach = AsyncMock(side_effect=AiDisabledException("no key"))
    app.dependency_overrides[get_ai_tutor_service] = lambda: mock_service
    app.dependency_overrides[get_current_user] = lambda: sample_user_id

    yield TestClient(app), mock_service

    app.dependency_overrides.clear()


# ── /explain ─────────────────────────────────────────────────────────────────


class TestExplainEndpoint:
    def test_explain_returns_200_with_explanation(self, app_with_ai_tutor):
        client, service = app_with_ai_tutor
        from app.models.ai_tutor import ExplainResponse
        service.explain = AsyncMock(return_value=ExplainResponse(
            explanation="Present simple describes habits."
        ))

        res = client.post("/api/v1/me/ai-tutor/explain", json={
            "question": "What is present simple?",
            "cefr_level": "A1",
            "learner_language": "en",
        })

        assert res.status_code == 200
        assert res.json()["explanation"] == "Present simple describes habits."

    def test_explain_requires_question_field(self, app_with_ai_tutor):
        client, _ = app_with_ai_tutor
        res = client.post("/api/v1/me/ai-tutor/explain", json={"cefr_level": "A1"})
        assert res.status_code == 422  # missing required 'question'

    def test_explain_rejects_empty_question(self, app_with_ai_tutor):
        client, _ = app_with_ai_tutor
        res = client.post("/api/v1/me/ai-tutor/explain", json={"question": ""})
        assert res.status_code == 422

    def test_explain_returns_ai_disabled_when_no_key(self, app_with_ai_disabled):
        client, _ = app_with_ai_disabled
        res = client.post("/api/v1/me/ai-tutor/explain", json={
            "question": "What is grammar?",
        })
        assert res.status_code == 200
        assert res.json()["code"] == "ai_disabled"


# ── /correct ─────────────────────────────────────────────────────────────────


class TestCorrectEndpoint:
    def test_correct_returns_full_correction(self, app_with_ai_tutor):
        client, service = app_with_ai_tutor
        from app.models.ai_tutor import CorrectionResponse
        service.correct = AsyncMock(return_value=CorrectionResponse(
            original="I go to market yesterday",
            corrected="I went to the market yesterday.",
            explanation="Use past simple.",
            explanation_l1="Dùng quá khứ đơn.",
            try_again_prompt="Yesterday I ___ to the market.",
            try_again_answer="went",
        ))

        res = client.post("/api/v1/me/ai-tutor/correct", json={
            "sentence": "I go to market yesterday",
            "learner_language": "vi",
            "cefr_level": "A1",
        })

        assert res.status_code == 200
        body = res.json()
        assert body["corrected"] == "I went to the market yesterday."
        assert body["try_again_answer"] == "went"
        assert "explanation_l1" in body

    def test_correct_returns_ai_disabled_when_no_key(self, app_with_ai_disabled):
        client, _ = app_with_ai_disabled
        res = client.post("/api/v1/me/ai-tutor/correct", json={"sentence": "I go market."})
        assert res.status_code == 200
        assert res.json()["code"] == "ai_disabled"


# ── /practice ────────────────────────────────────────────────────────────────


class TestPracticeEndpoint:
    def test_practice_returns_items(self, app_with_ai_tutor):
        client, service = app_with_ai_tutor
        from app.models.ai_tutor import PracticeItem, PracticeResponse
        service.practice = AsyncMock(return_value=PracticeResponse(items=[
            PracticeItem(question="She ___ (be) happy.", answer="is", hint="3rd person"),
            PracticeItem(question="They ___ (be) tired.", answer="are"),
        ]))

        res = client.post("/api/v1/me/ai-tutor/practice", json={
            "skill": "grammar",
            "cefr_level": "A1",
            "count": 2,
        })

        assert res.status_code == 200
        items = res.json()["items"]
        assert len(items) == 2
        assert items[0]["answer"] == "is"

    def test_practice_rejects_invalid_skill(self, app_with_ai_tutor):
        client, _ = app_with_ai_tutor
        res = client.post("/api/v1/me/ai-tutor/practice", json={"skill": "dancing"})
        assert res.status_code == 422

    def test_practice_returns_ai_disabled_when_no_key(self, app_with_ai_disabled):
        client, _ = app_with_ai_disabled
        res = client.post("/api/v1/me/ai-tutor/practice", json={"skill": "grammar"})
        assert res.status_code == 200
        assert res.json()["code"] == "ai_disabled"


# ── /writing-coach ───────────────────────────────────────────────────────────


class TestWritingCoachEndpoint:
    def test_writing_coach_returns_scores_and_annotations(self, app_with_ai_tutor):
        client, service = app_with_ai_tutor
        from app.models.ai_tutor import (
            InlineAnnotation,
            WritingCoachResponse,
            WritingScore,
        )
        service.writing_coach = AsyncMock(return_value=WritingCoachResponse(
            scores=[
                WritingScore(skill="Grammar", score=6, comment="A few tense errors."),
            ],
            inline_annotations=[
                InlineAnnotation(offset=10, length=4, issue="Wrong tense", suggestion="went"),
            ],
            rewritten_exemplar="Yesterday I went to the market.",
        ))

        res = client.post("/api/v1/me/ai-tutor/writing-coach", json={
            "text": "Yesterday I go to the market and buyed some food.",
        })

        assert res.status_code == 200
        body = res.json()
        assert body["scores"][0]["skill"] == "Grammar"
        assert body["inline_annotations"][0]["suggestion"] == "went"
        assert "went to the market" in body["rewritten_exemplar"]

    def test_writing_coach_rejects_short_text(self, app_with_ai_tutor):
        client, _ = app_with_ai_tutor
        res = client.post("/api/v1/me/ai-tutor/writing-coach", json={"text": "Hi."})
        assert res.status_code == 422  # min_length=10

    def test_writing_coach_returns_ai_disabled(self, app_with_ai_disabled):
        client, _ = app_with_ai_disabled
        res = client.post("/api/v1/me/ai-tutor/writing-coach", json={
            "text": "Yesterday I go to market and buyed some food.",
        })
        assert res.status_code == 200
        assert res.json()["code"] == "ai_disabled"


# ── Auth guard ───────────────────────────────────────────────────────────────


class TestAuthGuard:
    """Endpoints must reject unauthenticated requests with 401."""

    @pytest.fixture
    def unauthenticated_client(self, mock_supabase):
        from app.main import app
        from app.api.v1.ai_tutor import get_ai_tutor_service
        from app.core.supabase import get_supabase_admin

        # Mock supabase so the Supabase client doesn't try to reach a real server.
        # get_current_user will still 401 because there's no Authorization header.
        app.dependency_overrides[get_supabase_admin] = lambda: mock_supabase
        app.dependency_overrides.pop(get_ai_tutor_service, None)
        yield TestClient(app, raise_server_exceptions=False)
        app.dependency_overrides.clear()

    def test_explain_requires_auth(self, unauthenticated_client):
        res = unauthenticated_client.post("/api/v1/me/ai-tutor/explain", json={"question": "What?"})
        assert res.status_code == 401

    def test_correct_requires_auth(self, unauthenticated_client):
        res = unauthenticated_client.post("/api/v1/me/ai-tutor/correct", json={"sentence": "I go."})
        assert res.status_code == 401

    def test_practice_requires_auth(self, unauthenticated_client):
        res = unauthenticated_client.post("/api/v1/me/ai-tutor/practice", json={"skill": "grammar"})
        assert res.status_code == 401

    def test_writing_coach_requires_auth(self, unauthenticated_client):
        res = unauthenticated_client.post(
            "/api/v1/me/ai-tutor/writing-coach",
            json={"text": "This is a test sentence."},
        )
        assert res.status_code == 401
