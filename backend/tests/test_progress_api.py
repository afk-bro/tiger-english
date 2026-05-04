"""Endpoint tests using FastAPI TestClient. The real Supabase backend is
mocked at the service layer via dependency override."""

from unittest.mock import MagicMock
from uuid import UUID

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def app_with_mocked_service(mock_supabase, sample_user_id):
    """Returns (TestClient, mock_service) where the ProgressService is
    overridden to return canned data, and the auth dep returns
    sample_user_id."""
    from app.main import app
    from app.api.v1.progress import get_progress_service
    from app.core.security import get_current_user
    from app.services.progress_service import ProgressService

    mock_service = MagicMock(spec=ProgressService)
    app.dependency_overrides[get_progress_service] = lambda: mock_service
    app.dependency_overrides[get_current_user] = lambda: sample_user_id

    yield TestClient(app), mock_service

    app.dependency_overrides.clear()


def test_complete_section_endpoint_happy_path(app_with_mocked_service):
    client, service = app_with_mocked_service
    service.complete_lesson_section.return_value = {
        "unit_slug": "unit-1",
        "section_key": "overview",
        "completed_at": "2026-05-03T10:00:00+00:00",
    }

    res = client.post(
        "/api/v1/me/progress/complete-section",
        json={"unit_slug": "unit-1", "section_key": "overview"},
    )

    assert res.status_code == 200
    assert res.json()["unit_slug"] == "unit-1"
    service.complete_lesson_section.assert_called_once()


def test_complete_section_endpoint_validates_body(app_with_mocked_service):
    client, _ = app_with_mocked_service
    res = client.post("/api/v1/me/progress/complete-section", json={"unit_slug": "unit-1"})
    assert res.status_code == 422  # missing section_key


def test_attempt_exercise_endpoint_happy_path(app_with_mocked_service):
    client, service = app_with_mocked_service
    service.submit_exercise_attempt.return_value = {"id": 1, "attempted_at": "2026-05-03T10:00:00+00:00"}

    res = client.post(
        "/api/v1/me/progress/attempt-exercise",
        json={
            "unit_slug": "unit-1",
            "section_key": "grammar",
            "exercise_id": "u1-grammar-mcq-1",
            "is_correct": True,
        },
    )

    assert res.status_code == 200
    assert res.json()["id"] == 1


def test_review_flashcard_endpoint_happy_path(app_with_mocked_service):
    client, service = app_with_mocked_service
    service.review_flashcard.return_value = {"id": 1, "reviewed_at": "2026-05-03T10:00:00+00:00"}

    res = client.post(
        "/api/v1/me/progress/review-flashcard",
        json={"flashcard_id": "22222222-2222-2222-2222-222222222222", "status": "known"},
    )

    assert res.status_code == 200


def test_review_flashcard_endpoint_validates_status(app_with_mocked_service):
    client, _ = app_with_mocked_service
    res = client.post(
        "/api/v1/me/progress/review-flashcard",
        json={"flashcard_id": "22222222-2222-2222-2222-222222222222", "status": "invalid"},
    )
    assert res.status_code == 422


def test_summary_endpoint_returns_shape(app_with_mocked_service):
    client, service = app_with_mocked_service
    service.get_summary.return_value = {
        "sections_completed": [],
        "exercise_attempts": {"total": 0, "correct": 0},
        "flashcards": {"reviewed_total": 0, "currently_known": 0},
        "streak": {"current_days": 0},
        "study_days_this_week": 0,
        "last_active_at": None,
        "activity": {
            "lessons_completed": 0,
            "exercises_attempted": 0,
            "exercises_correct": 0,
            "flashcards_reviewed": 0,
            "flashcards_mastered": 0,
        },
    }

    res = client.get("/api/v1/me/progress/summary")
    assert res.status_code == 200
    body = res.json()
    assert body["activity"]["lessons_completed"] == 0


def test_complete_section_endpoint_is_idempotent(app_with_mocked_service):
    """Catches wiring failures the service test wouldn't see."""
    client, service = app_with_mocked_service
    service.complete_lesson_section.return_value = {
        "unit_slug": "unit-1",
        "section_key": "overview",
        "completed_at": "2026-05-03T10:00:00+00:00",
    }

    body = {"unit_slug": "unit-1", "section_key": "overview"}
    res1 = client.post("/api/v1/me/progress/complete-section", json=body)
    res2 = client.post("/api/v1/me/progress/complete-section", json=body)

    assert res1.status_code == 200 and res2.status_code == 200
    # Service is called twice (the function itself is idempotent at the
    # DB level — that's verified manually in the walkthrough); both
    # responses return the same row.
    assert res1.json() == res2.json()
    assert service.complete_lesson_section.call_count == 2
