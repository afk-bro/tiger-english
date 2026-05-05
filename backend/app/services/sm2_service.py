"""SM-2 spaced repetition scheduling.

The classic SuperMemo-2 algorithm:
    - ease_factor starts at 2.5
    - interval_days starts at 1, then 6, then ease_factor * previous
    - Quality: 0=blackout, 1=incorrect, 2=incorrect with hint, 3=correct with effort,
               4=correct, 5=perfect — mapped from our difficulty labels

Difficulty mapping (as used in the API):
    'incorrect' → quality 2
    'difficult'  → quality 3
    'got_it'     → quality 4
    'easy'       → quality 5

Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

DifficultyRating = Literal["incorrect", "difficult", "got_it", "easy"]

QUALITY_MAP: dict[DifficultyRating, int] = {
    "incorrect": 2,
    "difficult": 3,
    "got_it": 4,
    "easy": 5,
}

# Ease factor bounds
MIN_EASE = 1.3
MAX_EASE = 3.5


@dataclass
class SM2State:
    """Mutable SM-2 state for a single review item."""
    ease_factor: float = 2.5
    interval_days: int = 1
    streak_correct: int = 0

    def next_interval(self, difficulty: DifficultyRating) -> "SM2State":
        """Return a NEW SM2State after applying the difficulty rating."""
        q = QUALITY_MAP[difficulty]
        new_ease = _updated_ease(self.ease_factor, q)

        if q < 3:
            # Incorrect or barely right — reset to beginning
            return SM2State(ease_factor=new_ease, interval_days=1, streak_correct=0)

        streak = self.streak_correct + 1
        if streak == 1:
            new_interval = 1
        elif streak == 2:
            new_interval = 6
        else:
            new_interval = round(self.interval_days * new_ease)

        return SM2State(
            ease_factor=new_ease,
            interval_days=max(1, new_interval),
            streak_correct=streak,
        )


def _updated_ease(current_ease: float, quality: int) -> float:
    """Apply the SM-2 ease-factor update formula."""
    delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    new_ease = current_ease + delta
    return min(MAX_EASE, max(MIN_EASE, new_ease))


def schedule_next_review(
    *,
    ease_factor: float,
    interval_days: int,
    streak_correct: int,
    difficulty: DifficultyRating,
) -> tuple[float, int, int]:
    """Convenience wrapper — returns (new_ease_factor, new_interval_days, new_streak_correct)."""
    state = SM2State(
        ease_factor=ease_factor,
        interval_days=interval_days,
        streak_correct=streak_correct,
    )
    next_state = state.next_interval(difficulty)
    return next_state.ease_factor, next_state.interval_days, next_state.streak_correct
