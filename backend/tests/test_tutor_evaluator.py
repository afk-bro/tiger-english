import pytest

INTRO_TASK = {
    "id": "00000000-0000-0000-0000-000000000001",
    "task_key": "introduce_self",
    "title_en": "Introduce yourself",
    "accept_patterns": ["my name is", "i am", "i'm", {"regex": r"^call me \w+"}],
    "correction_templates": [
        {
            "match_regex": r"^my name (\w+)$",
            "corrected_en_template": "My name is {1}.",
            "explanation_vi": "Bạn cần thêm 'is' sau 'name'.",
            "explanation_key": "missing_be_verb_intro",
            "severity": "minor",
        }
    ],
}


def test_accept_pattern_substring_matches():
    from app.services.tutor_evaluator_service import TutorEvaluatorService
    e = TutorEvaluatorService()
    res = e.evaluate("My name is Tom.", INTRO_TASK)
    assert res.task_completed is True
    assert res.severity == "none"
    assert res.correction is None
    assert res.should_advance is True


def test_accept_pattern_regex_matches():
    from app.services.tutor_evaluator_service import TutorEvaluatorService
    e = TutorEvaluatorService()
    res = e.evaluate("Call me Tom", INTRO_TASK)
    assert res.task_completed is True


def test_no_match_returns_not_completed():
    from app.services.tutor_evaluator_service import TutorEvaluatorService
    e = TutorEvaluatorService()
    res = e.evaluate("Hello there friend", INTRO_TASK)
    assert res.task_completed is False
    assert res.should_advance is False


def test_correction_template_matched_advances_with_correction():
    from app.services.tutor_evaluator_service import TutorEvaluatorService
    e = TutorEvaluatorService()
    res = e.evaluate("My name Tom", INTRO_TASK)
    # Template matched → corrected variant; severity minor → still advances
    assert res.task_completed is True
    assert res.correction is not None
    assert res.correction.corrected_en == "My name is Tom."
    assert res.correction.explanation_vi == "Bạn cần thêm 'is' sau 'name'."
    assert res.severity == "minor"
    assert res.should_advance is True


def test_normalization_strips_punctuation_and_lowercases():
    from app.services.tutor_evaluator_service import TutorEvaluatorService
    e = TutorEvaluatorService()
    res = e.evaluate("MY NAME IS TOM!!!", INTRO_TASK)
    assert res.task_completed is True
