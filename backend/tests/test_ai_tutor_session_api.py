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


# ----------------------------------------------------------------------
# Session lifecycle endpoints (Task 5.2)
# ----------------------------------------------------------------------

from datetime import datetime, timezone


SAMPLE_SESSION_ID = UUID("55555555-5555-5555-5555-555555555555")
SAMPLE_TURN_ID = UUID("66666666-6666-6666-6666-666666666666")


def _turn_dict():
    return {
        "id": str(SAMPLE_TURN_ID),
        "speaker": "ai",
        "text_en": "Hi! What can I get you?",
        "audio_url": None,
        "correction": None,
        "task_completed": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def _session_dto_dict():
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": str(SAMPLE_SESSION_ID),
        "scenario_slug": "coffee-shop",
        "status": "active",
        "current_task_id": str(SAMPLE_TASK_ID),
        "completed_task_ids": [],
        "mistake_count": 0,
        "xp_awarded": 0,
        "started_at": now,
        "last_activity_at": now,
        "completed_at": None,
    }


@pytest.fixture
def client_with_mock_session_service():
    """Returns (TestClient, mock_service) where TutorSessionService is
    replaced via patch and auth + supabase are stubbed."""
    from app.main import app
    from app.core.security import get_current_user
    from app.core.supabase import get_supabase_admin

    mock_service = MagicMock()
    app.dependency_overrides[get_current_user] = lambda: SAMPLE_USER_ID
    app.dependency_overrides[get_supabase_admin] = lambda: MagicMock()

    with patch(
        "app.api.v1.ai_tutor_session.TutorSessionService",
        return_value=mock_service,
    ):
        with TestClient(app) as c:
            yield c, mock_service

    app.dependency_overrides.clear()


def test_start_session_success(client_with_mock_session_service):
    from app.models.tutor import StartSessionResponse, TutorTurnDTO

    client, service = client_with_mock_session_service
    service.start_session.return_value = StartSessionResponse(
        session_id=SAMPLE_SESSION_ID,
        status="active",
        current_task_id=SAMPLE_TASK_ID,
        opening_turn=TutorTurnDTO(**_turn_dict()),
    )

    res = client.post(
        "/api/v1/me/ai-tutor/sessions",
        json={"scenario_slug": "coffee-shop", "mode": "fresh"},
        headers={"Authorization": "Bearer fake-token"},
    )

    assert res.status_code == 200
    body = res.json()
    assert body["session_id"] == str(SAMPLE_SESSION_ID)
    assert body["status"] == "active"
    assert body["current_task_id"] == str(SAMPLE_TASK_ID)
    service.start_session.assert_called_once()


def test_start_session_scenario_not_found(client_with_mock_session_service):
    from app.services.tutor_session_service import ScenarioNotFoundError

    client, service = client_with_mock_session_service
    service.start_session.side_effect = ScenarioNotFoundError("missing")

    res = client.post(
        "/api/v1/me/ai-tutor/sessions",
        json={"scenario_slug": "nope", "mode": "fresh"},
        headers={"Authorization": "Bearer fake-token"},
    )

    assert res.status_code == 404


def test_get_session_success():
    """GET /sessions/{id} reads supabase directly — patch the dep to return
    a mock client whose chained calls produce a session row."""
    from app.main import app
    from app.core.security import get_current_user
    from app.core.supabase import get_supabase_admin

    session_row = {
        "id": str(SAMPLE_SESSION_ID),
        "user_id": str(SAMPLE_USER_ID),
        "scenario_slug": "coffee-shop",
        "status": "active",
    }
    supabase_mock = MagicMock()
    chain = supabase_mock.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value
    chain.execute.return_value = MagicMock(data=session_row)

    app.dependency_overrides[get_current_user] = lambda: SAMPLE_USER_ID
    app.dependency_overrides[get_supabase_admin] = lambda: supabase_mock

    with TestClient(app) as c:
        res = c.get(
            f"/api/v1/me/ai-tutor/sessions/{SAMPLE_SESSION_ID}",
            headers={"Authorization": "Bearer fake-token"},
        )

    app.dependency_overrides.clear()
    assert res.status_code == 200
    assert res.json()["id"] == str(SAMPLE_SESSION_ID)


def test_get_session_not_found():
    from app.main import app
    from app.core.security import get_current_user
    from app.core.supabase import get_supabase_admin

    supabase_mock = MagicMock()
    chain = supabase_mock.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value
    chain.execute.return_value = MagicMock(data=None)

    app.dependency_overrides[get_current_user] = lambda: SAMPLE_USER_ID
    app.dependency_overrides[get_supabase_admin] = lambda: supabase_mock

    with TestClient(app) as c:
        res = c.get(
            f"/api/v1/me/ai-tutor/sessions/{SAMPLE_SESSION_ID}",
            headers={"Authorization": "Bearer fake-token"},
        )

    app.dependency_overrides.clear()
    assert res.status_code == 404


def test_submit_turn_too_large(client_with_mock_session_service):
    client, service = client_with_mock_session_service
    # 3MB blob — exceeds 2MB cap
    big = b"\x00" * (3 * 1024 * 1024)
    files = {"audio": ("audio.webm", big, "audio/webm")}
    data = {"current_task_id": str(SAMPLE_TASK_ID)}

    res = client.post(
        f"/api/v1/me/ai-tutor/sessions/{SAMPLE_SESSION_ID}/turns",
        files=files,
        data=data,
        headers={"Authorization": "Bearer fake-token"},
    )

    assert res.status_code == 413


def test_submit_turn_stt_failure(client_with_mock_session_service):
    from app.services.tutor_session_service import TurnSTTFailure

    client, service = client_with_mock_session_service

    async def _raise(*_args, **_kwargs):
        raise TurnSTTFailure("test_reason")

    service.submit_turn = _raise
    files = {"audio": ("audio.webm", b"hello", "audio/webm")}
    data = {"current_task_id": str(SAMPLE_TASK_ID)}

    res = client.post(
        f"/api/v1/me/ai-tutor/sessions/{SAMPLE_SESSION_ID}/turns",
        files=files,
        data=data,
        headers={"Authorization": "Bearer fake-token"},
    )

    assert res.status_code == 503
    body = res.json()
    assert body["detail"]["error"] == "stt_failed"
    assert body["detail"]["retryable"] is True
    assert body["detail"]["reason"] == "test_reason"


def test_submit_turn_session_not_active(client_with_mock_session_service):
    from app.services.tutor_session_service import SessionNotActiveError

    client, service = client_with_mock_session_service

    async def _raise(*_args, **_kwargs):
        raise SessionNotActiveError("not active")

    service.submit_turn = _raise
    files = {"audio": ("audio.webm", b"hello", "audio/webm")}
    data = {"current_task_id": str(SAMPLE_TASK_ID)}

    res = client.post(
        f"/api/v1/me/ai-tutor/sessions/{SAMPLE_SESSION_ID}/turns",
        files=files,
        data=data,
        headers={"Authorization": "Bearer fake-token"},
    )

    assert res.status_code == 409


def test_finish_session_success(client_with_mock_session_service):
    from app.models.tutor import FinishResponse, TutorSessionDTO

    client, service = client_with_mock_session_service
    completed = _session_dto_dict()
    completed["status"] = "completed"
    completed["completed_at"] = datetime.now(timezone.utc).isoformat()
    service.finish_session.return_value = FinishResponse(
        session=TutorSessionDTO(**completed),
        xp_awarded=20,
        all_corrections=[],
    )

    res = client.post(
        f"/api/v1/me/ai-tutor/sessions/{SAMPLE_SESSION_ID}/finish",
        headers={"Authorization": "Bearer fake-token"},
    )

    assert res.status_code == 200
    body = res.json()
    assert body["xp_awarded"] == 20
    assert body["session"]["status"] == "completed"
    service.finish_session.assert_called_once()


def test_abandon_session_success(client_with_mock_session_service):
    client, service = client_with_mock_session_service
    service.abandon_session.return_value = None

    res = client.post(
        f"/api/v1/me/ai-tutor/sessions/{SAMPLE_SESSION_ID}/abandon",
        headers={"Authorization": "Bearer fake-token"},
    )

    assert res.status_code == 200
    assert res.json() == {"ok": True}
    service.abandon_session.assert_called_once()


# ----------------------------------------------------------------------
# Frontend telemetry events endpoint (Task 5.3)
# ----------------------------------------------------------------------


def _events_client(supabase_mock):
    """Build a TestClient with auth bypassed and a custom supabase mock."""
    from app.main import app
    from app.core.security import get_current_user
    from app.core.supabase import get_supabase_admin

    app.dependency_overrides[get_current_user] = lambda: SAMPLE_USER_ID
    app.dependency_overrides[get_supabase_admin] = lambda: supabase_mock
    return app, TestClient(app)


def test_post_event_success():
    supabase_mock = MagicMock()
    insert_mock = supabase_mock.table.return_value.insert
    insert_mock.return_value.execute.return_value = MagicMock(data=[{}])

    app, client = _events_client(supabase_mock)
    try:
        with client as c:
            res = c.post(
                "/api/v1/me/ai-tutor/events",
                json={
                    "event_type": "mic.denied",
                    "payload": {"reason": "user_blocked"},
                    "session_id": str(SAMPLE_SESSION_ID),
                },
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.clear()

    assert res.status_code == 204
    supabase_mock.table.assert_called_with("ai_tutor_events")
    args, _kwargs = insert_mock.call_args
    inserted = args[0]
    assert inserted["user_id"] == str(SAMPLE_USER_ID)
    assert inserted["session_id"] == str(SAMPLE_SESSION_ID)
    assert inserted["event_type"] == "mic.denied"
    assert inserted["payload"] == {"reason": "user_blocked"}


def test_post_event_invalid_event_type():
    supabase_mock = MagicMock()
    app, client = _events_client(supabase_mock)
    try:
        with client as c:
            res = c.post(
                "/api/v1/me/ai-tutor/events",
                json={"event_type": "foo.bar", "payload": {}},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.clear()

    # Pydantic Literal rejects with 422, OR server-side whitelist with 400 —
    # either is an acceptable defense.
    assert res.status_code in (400, 422)
    # And no insert was attempted.
    supabase_mock.table.return_value.insert.assert_not_called()


def test_post_event_rate_limited():
    supabase_mock = MagicMock()
    app, client = _events_client(supabase_mock)
    try:
        with patch("app.api.v1.ai_tutor_session._rate_check", return_value=7):
            with client as c:
                res = c.post(
                    "/api/v1/me/ai-tutor/events",
                    json={"event_type": "audio.fallback", "payload": {}},
                    headers={"Authorization": "Bearer fake-token"},
                )
    finally:
        app.dependency_overrides.clear()

    assert res.status_code == 429
    assert res.headers.get("Retry-After") == "7"
    supabase_mock.table.return_value.insert.assert_not_called()


# ----------------------------------------------------------------------
# Test-mode STT stub-transcript header (Task 18.1)
#
# `_get_stt(request)` reads `X-Test-Stub-Transcript` from the incoming
# request when running in stub mode outside production. This lets e2e
# tests script a transcript per turn without hitting Groq. The guard
# requires BOTH stt_provider == "stub" AND environment != "production".
# ----------------------------------------------------------------------


def test_get_stt_uses_header_in_stub_dev_mode():
    """When stub provider + non-prod env, _get_stt reads the header.

    ASCII headers round-trip unchanged through `unquote`.
    """
    from unittest.mock import MagicMock
    from app.api.v1.ai_tutor_session import _get_stt
    from app.core.config import settings

    request = MagicMock()
    request.headers = {"x-test-stub-transcript": "my name is Tom"}

    original_provider = settings.stt_provider
    original_env = settings.environment
    try:
        settings.stt_provider = "stub"
        settings.environment = "development"
        provider = _get_stt(request)
        assert provider.__class__.__name__ == "StubSTTProvider"
        assert provider.canned_text == "my name is Tom"
    finally:
        settings.stt_provider = original_provider
        settings.environment = original_env


def test_get_stt_decodes_percent_encoded_header():
    """Non-ASCII transcripts arrive percent-encoded (HTTP header constraint).

    The Vietnamese end-lesson trigger "kết thúc bài học" is the
    representative case — Playwright `route.continue` rejects raw
    non-ASCII header values, so the spec encodes them client-side.
    """
    from unittest.mock import MagicMock
    from urllib.parse import quote
    from app.api.v1.ai_tutor_session import _get_stt
    from app.core.config import settings

    request = MagicMock()
    request.headers = {"x-test-stub-transcript": quote("kết thúc bài học")}

    original_provider = settings.stt_provider
    original_env = settings.environment
    try:
        settings.stt_provider = "stub"
        settings.environment = "development"
        provider = _get_stt(request)
        assert provider.canned_text == "kết thúc bài học"
    finally:
        settings.stt_provider = original_provider
        settings.environment = original_env


def test_get_stt_ignores_header_in_production():
    """Production safety: header is ignored even with stub provider."""
    from unittest.mock import MagicMock
    from app.api.v1.ai_tutor_session import _get_stt
    from app.core.config import settings

    request = MagicMock()
    request.headers = {"x-test-stub-transcript": "this should be ignored"}

    original_provider = settings.stt_provider
    original_env = settings.environment
    try:
        settings.stt_provider = "stub"
        settings.environment = "production"
        provider = _get_stt(request)
        assert provider.__class__.__name__ == "StubSTTProvider"
        assert provider.canned_text == ""
    finally:
        settings.stt_provider = original_provider
        settings.environment = original_env


def test_get_stt_without_request_uses_empty_stub():
    """Calling _get_stt() with no request returns a default stub provider."""
    from app.api.v1.ai_tutor_session import _get_stt
    from app.core.config import settings

    original_provider = settings.stt_provider
    try:
        settings.stt_provider = "stub"
        provider = _get_stt(None)
        assert provider.__class__.__name__ == "StubSTTProvider"
        assert provider.canned_text == ""
    finally:
        settings.stt_provider = original_provider


def test_submit_turn_passes_header_to_stub(client_with_mock_session_service):
    """End-to-end: header on /turns reaches StubSTTProvider via _get_stt."""
    from unittest.mock import patch
    from app.core.config import settings

    client, service = client_with_mock_session_service

    captured: dict = {}

    async def _fake_submit(**kwargs):
        # Synthesize the expected TurnResponse shape; the contents don't
        # matter — we only care that submit_turn was invoked with a stub
        # provider built from the header.
        from app.models.tutor import TurnResponse, TutorSessionDTO, EvaluationResult
        session = TutorSessionDTO(**_session_dto_dict())
        return TurnResponse(
            transcript="hello world",
            session=session,
            new_turns=[],
            evaluation=EvaluationResult(),
            current_task_id=SAMPLE_TASK_ID,
            tasks_done=0,
            tasks_total=4,
            end_lesson_detected=False,
        )

    service.submit_turn = _fake_submit

    original_provider = settings.stt_provider
    original_env = settings.environment
    try:
        settings.stt_provider = "stub"
        settings.environment = "development"

        # Wrap the original _get_stt to capture the provider built from the
        # request without changing behavior. (Patch the symbol in the
        # router module so the endpoint picks up the wrapper.)
        from app.api.v1 import ai_tutor_session as router_mod

        original_get_stt = router_mod._get_stt

        def _wrapper(request=None):
            provider = original_get_stt(request)
            captured["text"] = provider.canned_text
            return provider

        with patch.object(router_mod, "_get_stt", side_effect=_wrapper):
            files = {"audio": ("audio.webm", b"\x00" * 16, "audio/webm")}
            data = {"current_task_id": str(SAMPLE_TASK_ID)}
            res = client.post(
                f"/api/v1/me/ai-tutor/sessions/{SAMPLE_SESSION_ID}/turns",
                files=files,
                data=data,
                headers={
                    "Authorization": "Bearer fake-token",
                    "X-Test-Stub-Transcript": "hello world",
                },
            )
    finally:
        settings.stt_provider = original_provider
        settings.environment = original_env

    assert res.status_code == 200
    assert captured.get("text") == "hello world"


def test_post_event_swallows_supabase_error():
    supabase_mock = MagicMock()
    supabase_mock.table.return_value.insert.return_value.execute.side_effect = RuntimeError("db down")

    app, client = _events_client(supabase_mock)
    try:
        with client as c:
            res = c.post(
                "/api/v1/me/ai-tutor/events",
                json={"event_type": "turn.failed.network", "payload": {"code": 500}},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.clear()

    # Telemetry write failure must NOT fail the calling page.
    assert res.status_code == 204
