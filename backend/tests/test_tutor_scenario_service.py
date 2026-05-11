"""Tests for TutorScenarioService — read-only catalog access."""

from unittest.mock import MagicMock
from uuid import UUID

import pytest


SCENARIO_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
TASK_ID_1 = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
TASK_ID_2 = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
PHRASE_ID = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
SESSION_ID = UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")


def make_table_mock(data=None):
    """Chainable mock for supabase.table(...).select().eq().order().limit().execute()."""
    m = MagicMock()
    m.select.return_value = m
    m.eq.return_value = m
    m.order.return_value = m
    m.limit.return_value = m
    m.execute.return_value.data = data
    return m


@pytest.fixture(autouse=True)
def _configure_settings(monkeypatch):
    """Pin supabase_url + tutor_audio_bucket so the URL builder is predictable."""
    from app.core.config import settings
    monkeypatch.setattr(settings, "supabase_url", "https://test.supabase.co")
    monkeypatch.setattr(settings, "tutor_audio_bucket", "ai-tutor-audio")


def test_list_scenarios_returns_summaries(mock_supabase):
    from app.services.tutor_scenario_service import TutorScenarioService
    from app.models.tutor import TutorScenarioSummary

    rows = [
        {
            "slug": "coffee-shop",
            "title_en": "Coffee shop",
            "title_vi": "Quán cà phê",
            "level": "A2",
            "mode": "course",
            "is_free": True,
            "sort_order": 1,
        },
        {
            "slug": "free-talk",
            "title_en": "Free talk",
            "title_vi": "Trò chuyện tự do",
            "level": "B1",
            "mode": "free_talk",
            "is_free": False,
            "sort_order": 2,
        },
    ]
    mock_supabase.table.return_value = make_table_mock(data=rows)

    service = TutorScenarioService(mock_supabase)
    result = service.list_scenarios()

    assert len(result) == 2
    assert all(isinstance(s, TutorScenarioSummary) for s in result)
    assert result[0].slug == "coffee-shop"
    assert result[0].mode == "course"
    assert result[0].is_free is True
    assert result[1].slug == "free-talk"
    assert result[1].mode == "free_talk"
    mock_supabase.table.assert_called_with("ai_tutor_scenarios")


def test_list_scenarios_empty_on_error(mock_supabase):
    from app.services.tutor_scenario_service import TutorScenarioService

    mock_supabase.table.side_effect = Exception("transient supabase error")

    service = TutorScenarioService(mock_supabase)
    result = service.list_scenarios()

    assert result == []


def test_get_detail_returns_nested_models_with_no_active_session(mock_supabase, sample_user_id):
    from app.services.tutor_scenario_service import TutorScenarioService
    from app.models.tutor import TutorScenarioDetail

    scenario_row = {
        "id": str(SCENARIO_ID),
        "slug": "coffee-shop",
        "mode": "course",
        "level": "A2",
        "title_en": "Coffee shop",
        "title_vi": "Quán cà phê",
        "description_en": "Order a coffee",
        "description_vi": "Đặt cà phê",
        "goal_en": "Complete the order",
        "goal_vi": "Hoàn thành đơn đặt hàng",
        "ai_persona": "Friendly barista",
        "opening_line_en": "Hi, what can I get for you?",
        "opening_audio_path": "scenarios/coffee-shop/opening.mp3",
        "is_free": True,
    }
    tasks_rows = [
        {
            "id": str(TASK_ID_1),
            "task_key": "greet",
            "title_en": "Greet the barista",
            "title_vi": "Chào nhân viên",
            "sort_order": 1,
            "accept_patterns": ["hi", "hello"],
            "correction_templates": [],
            "next_ai_line_en": "What would you like?",
            "next_ai_line_audio_path": "scenarios/coffee-shop/t1.mp3",
        },
        {
            "id": str(TASK_ID_2),
            "task_key": "order",
            "title_en": "Order coffee",
            "title_vi": "Đặt cà phê",
            "sort_order": 2,
            "accept_patterns": ["coffee"],
            "correction_templates": None,
            "next_ai_line_en": None,
            "next_ai_line_audio_path": None,
        },
    ]
    phrases_rows = [
        {
            "id": str(PHRASE_ID),
            "phrase_en": "I'd like a coffee, please.",
            "translation_vi": "Cho tôi một ly cà phê.",
            "audio_path": "scenarios/coffee-shop/p1.mp3",
            "sort_order": 1,
        },
    ]

    table_routes = {
        "ai_tutor_scenarios": make_table_mock(data=[scenario_row]),
        "ai_tutor_scenario_tasks": make_table_mock(data=tasks_rows),
        "ai_tutor_scenario_phrases": make_table_mock(data=phrases_rows),
        "ai_tutor_sessions": make_table_mock(data=[]),
    }
    mock_supabase.table.side_effect = lambda name: table_routes[name]

    service = TutorScenarioService(mock_supabase)
    detail = service.get_detail("coffee-shop", sample_user_id)

    assert isinstance(detail, TutorScenarioDetail)
    assert detail.slug == "coffee-shop"
    assert detail.id == SCENARIO_ID
    assert detail.opening_audio_url == (
        "https://test.supabase.co/storage/v1/object/public/ai-tutor-audio/"
        "scenarios/coffee-shop/opening.mp3"
    )
    assert len(detail.tasks) == 2
    assert detail.tasks[0].id == TASK_ID_1
    assert detail.tasks[0].next_ai_line_audio_url == (
        "https://test.supabase.co/storage/v1/object/public/ai-tutor-audio/"
        "scenarios/coffee-shop/t1.mp3"
    )
    assert detail.tasks[1].next_ai_line_audio_url is None
    assert detail.tasks[1].correction_templates == []
    assert len(detail.phrases) == 1
    assert detail.phrases[0].audio_url == (
        "https://test.supabase.co/storage/v1/object/public/ai-tutor-audio/"
        "scenarios/coffee-shop/p1.mp3"
    )
    assert detail.existing_active_session_id is None


def test_get_detail_returns_active_session_id(mock_supabase, sample_user_id):
    from app.services.tutor_scenario_service import TutorScenarioService

    scenario_row = {
        "id": str(SCENARIO_ID),
        "slug": "coffee-shop",
        "mode": "course",
        "level": "A2",
        "title_en": "Coffee shop",
        "title_vi": "Quán cà phê",
        "description_en": None,
        "description_vi": None,
        "goal_en": None,
        "goal_vi": None,
        "ai_persona": None,
        "opening_line_en": "Hi!",
        "opening_audio_path": None,
        "is_free": True,
    }

    table_routes = {
        "ai_tutor_scenarios": make_table_mock(data=[scenario_row]),
        "ai_tutor_scenario_tasks": make_table_mock(data=[]),
        "ai_tutor_scenario_phrases": make_table_mock(data=[]),
        "ai_tutor_sessions": make_table_mock(data=[{"id": str(SESSION_ID)}]),
    }
    mock_supabase.table.side_effect = lambda name: table_routes[name]

    service = TutorScenarioService(mock_supabase)
    detail = service.get_detail("coffee-shop", sample_user_id)

    assert detail is not None
    assert detail.existing_active_session_id == SESSION_ID
    assert detail.opening_audio_url is None
    assert detail.tasks == []
    assert detail.phrases == []


def test_get_detail_returns_none_for_missing_slug(mock_supabase, sample_user_id):
    from app.services.tutor_scenario_service import TutorScenarioService

    table_routes = {
        "ai_tutor_scenarios": make_table_mock(data=[]),
    }
    mock_supabase.table.side_effect = lambda name: table_routes[name]

    service = TutorScenarioService(mock_supabase)
    detail = service.get_detail("nonexistent", sample_user_id)

    assert detail is None
