"""Tests for the SM-2 spaced repetition algorithm."""
import pytest
from app.services.sm2_service import SM2State, schedule_next_review, _updated_ease


class TestEaseFactor:
    def test_perfect_increases_ease(self):
        old = 2.5
        new = _updated_ease(old, 5)
        assert new > old

    def test_difficult_decreases_ease(self):
        old = 2.5
        new = _updated_ease(old, 3)
        assert new < old

    def test_incorrect_decreases_ease_more(self):
        old = 2.5
        new_diff = _updated_ease(old, 3)
        new_incorrect = _updated_ease(old, 2)
        assert new_incorrect < new_diff

    def test_ease_clamps_at_minimum(self):
        # Repeatedly marking incorrect should not go below MIN_EASE
        ease = 2.5
        for _ in range(20):
            ease = _updated_ease(ease, 2)
        assert ease >= 1.3

    def test_ease_clamps_at_maximum(self):
        ease = 2.5
        for _ in range(20):
            ease = _updated_ease(ease, 5)
        assert ease <= 3.5


class TestSM2State:
    def test_initial_state_defaults(self):
        s = SM2State()
        assert s.ease_factor == 2.5
        assert s.interval_days == 1
        assert s.streak_correct == 0

    def test_first_correct_gives_interval_1(self):
        s = SM2State()
        next_s = s.next_interval("got_it")
        assert next_s.interval_days == 1
        assert next_s.streak_correct == 1

    def test_second_correct_gives_interval_6(self):
        s = SM2State(streak_correct=1)
        next_s = s.next_interval("got_it")
        assert next_s.interval_days == 6

    def test_third_correct_uses_ease_factor(self):
        s = SM2State(ease_factor=2.5, interval_days=6, streak_correct=2)
        next_s = s.next_interval("got_it")
        # Should be roughly 6 * 2.5 ≈ 15
        assert next_s.interval_days >= 12

    def test_incorrect_resets_interval_to_1(self):
        s = SM2State(ease_factor=2.5, interval_days=30, streak_correct=5)
        next_s = s.next_interval("incorrect")
        assert next_s.interval_days == 1
        assert next_s.streak_correct == 0

    def test_incorrect_resets_streak(self):
        s = SM2State(streak_correct=4)
        next_s = s.next_interval("incorrect")
        assert next_s.streak_correct == 0

    def test_easy_schedules_further_than_difficult(self):
        s = SM2State(ease_factor=2.5, interval_days=6, streak_correct=2)
        easy_next = s.next_interval("easy")
        diff_next = s.next_interval("difficult")
        assert easy_next.interval_days >= diff_next.interval_days

    def test_interval_never_below_1(self):
        s = SM2State(ease_factor=1.3, interval_days=1, streak_correct=10)
        next_s = s.next_interval("difficult")
        assert next_s.interval_days >= 1


class TestScheduleNextReview:
    def test_returns_three_values(self):
        result = schedule_next_review(
            ease_factor=2.5,
            interval_days=1,
            streak_correct=0,
            difficulty="got_it",
        )
        assert len(result) == 3

    def test_easy_gives_higher_interval_than_got_it(self):
        base = dict(ease_factor=2.5, interval_days=6, streak_correct=2)
        _, easy_interval, _ = schedule_next_review(**base, difficulty="easy")
        _, normal_interval, _ = schedule_next_review(**base, difficulty="got_it")
        assert easy_interval >= normal_interval

    def test_incorrect_resets(self):
        _, interval, streak = schedule_next_review(
            ease_factor=2.5,
            interval_days=30,
            streak_correct=5,
            difficulty="incorrect",
        )
        assert interval == 1
        assert streak == 0
