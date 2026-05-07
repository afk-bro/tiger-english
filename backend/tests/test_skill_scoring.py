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


# ── Regression: in-memory stores can be reset on demand ─────────────────────
#
# Pins the test-pollution fix from PR #126: the cleanup helper actually
# clears every store registered with it. Order-independent so it survives
# pytest randomization / parallelization / file reordering.


def test_reset_in_memory_stores_clears_all_known_stores():
    """The conftest helper is the single source of truth for which
    process-lifetime stores get cleaned between tests. If a new in-memory
    fallback is added without registering it in reset_in_memory_stores(),
    it'll silently leak across tests until someone hits the same flake we
    fixed for skill_scores. This test populates all currently-known stores,
    calls the helper, and asserts they're empty — making the failure mode
    loud and obvious."""
    from app.core import ai_usage_log, in_memory_skills
    from tests.conftest import reset_in_memory_stores

    user_id = "f1ee1abe-0000-4000-8000-000000000001"

    in_memory_skills.upsert_skill(user_id, "grammar_accuracy", 4.2, 12)
    ai_usage_log._log.append({"endpoint": "test", "user_id": user_id})

    assert in_memory_skills.has_any_data(user_id)
    assert ai_usage_log._log

    cleared = reset_in_memory_stores()

    assert not in_memory_skills.has_any_data(user_id)
    assert not ai_usage_log._log
    # Helper reports which modules it actually cleared — guards against
    # silent drop if a module is renamed and the helper falls through.
    assert set(cleared) == {
        "app.core.in_memory_skills",
        "app.core.ai_usage_log",
    }
