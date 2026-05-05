"""Tests for SkillScoringService and the EWMA helpers."""
from unittest.mock import MagicMock
from uuid import UUID

import pytest


# ── EWMA helpers ──────────────────────────────────────────────────────────────


def test_compute_alpha_grows_with_sample():
    from app.services.skill_scoring_service import compute_alpha

    a1 = compute_alpha(1)
    a10 = compute_alpha(10)
    a30 = compute_alpha(30)
    # More samples → smaller alpha (less weight on new observations)
    assert a1 > a10 > a30


def test_compute_alpha_caps_at_window():
    from app.services.skill_scoring_service import compute_alpha, SAMPLE_WINDOW

    assert compute_alpha(SAMPLE_WINDOW) == compute_alpha(SAMPLE_WINDOW + 100)


def test_update_skill_score_first_observation():
    from app.services.skill_scoring_service import update_skill_score

    new_score, new_size = update_skill_score(0.0, 0, 5.0)
    assert new_size == 1
    # With alpha=1 (first observation), score == observed
    assert new_score == pytest.approx(5.0, rel=0.01)


def test_update_skill_score_clamps_to_5():
    from app.services.skill_scoring_service import update_skill_score

    new_score, _ = update_skill_score(4.9, 5, 10.0)
    assert new_score <= 5.0


def test_update_skill_score_clamps_to_0():
    from app.services.skill_scoring_service import update_skill_score

    new_score, _ = update_skill_score(0.1, 5, -10.0)
    assert new_score >= 0.0


def test_update_skill_score_sample_size_increments():
    from app.services.skill_scoring_service import update_skill_score

    _, s1 = update_skill_score(2.5, 10, 3.0)
    assert s1 == 11


def test_update_skill_score_caps_sample_at_30():
    from app.services.skill_scoring_service import update_skill_score

    _, s = update_skill_score(2.5, 30, 3.0)
    assert s == 30


# ── SkillScoringService ───────────────────────────────────────────────────────


def test_get_summary_returns_all_11_skills(mock_supabase):
    from app.services.skill_scoring_service import SkillScoringService
    from app.models.skills import ALL_SKILL_KEYS

    # DB returns empty — all skills should be zero-initialised
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []

    svc = SkillScoringService(mock_supabase)
    skills = svc.get_summary(UUID("11111111-1111-1111-1111-111111111111"))

    assert len(skills) == 11
    assert {s.skill for s in skills} == set(ALL_SKILL_KEYS)


def test_get_summary_maps_db_rows(mock_supabase):
    from app.services.skill_scoring_service import SkillScoringService

    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"skill": "grammar_accuracy", "score": 3.5, "sample_size": 8, "last_updated_at": "2026-05-01T00:00:00Z"},
    ]

    svc = SkillScoringService(mock_supabase)
    skills = svc.get_summary(UUID("11111111-1111-1111-1111-111111111111"))
    grammar = next(s for s in skills if s.skill == "grammar_accuracy")

    assert grammar.score == pytest.approx(3.5)
    assert grammar.sample_size == 8
    assert grammar.last_updated_at == "2026-05-01T00:00:00Z"


def test_get_summary_handles_db_exception(mock_supabase):
    from app.services.skill_scoring_service import SkillScoringService

    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.side_effect = Exception("no table")

    svc = SkillScoringService(mock_supabase)
    skills = svc.get_summary(UUID("11111111-1111-1111-1111-111111111111"))

    # Should fall back to 11 zero-score items rather than raising
    assert len(skills) == 11
    assert all(s.score == 0.0 for s in skills)
