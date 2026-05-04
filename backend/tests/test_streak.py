"""Pure-Python tests for the streak derivation helper. No DB, no mocks."""

from datetime import date, timedelta


def test_streak_empty_returns_zero():
    from app.services.progress_service import _derive_streak
    assert _derive_streak([], "UTC") == 0


def test_streak_today_only_returns_one(monkeypatch):
    from app.services.progress_service import _derive_streak
    today = date(2026, 5, 3)
    monkeypatch.setattr("app.services.progress_service._today_in_tz", lambda tz: today)
    assert _derive_streak([today], "UTC") == 1


def test_streak_today_and_yesterday_returns_two(monkeypatch):
    from app.services.progress_service import _derive_streak
    today = date(2026, 5, 3)
    monkeypatch.setattr("app.services.progress_service._today_in_tz", lambda tz: today)
    assert _derive_streak([today, today - timedelta(days=1)], "UTC") == 2


def test_streak_with_gap_resets_at_break(monkeypatch):
    from app.services.progress_service import _derive_streak
    today = date(2026, 5, 3)
    monkeypatch.setattr("app.services.progress_service._today_in_tz", lambda tz: today)
    # today + 2 days ago (gap) → only today counts
    assert _derive_streak([today, today - timedelta(days=2)], "UTC") == 1


def test_streak_yesterday_only_returns_one(monkeypatch):
    """User active yesterday but not yet today — streak still counts."""
    from app.services.progress_service import _derive_streak
    today = date(2026, 5, 3)
    monkeypatch.setattr("app.services.progress_service._today_in_tz", lambda tz: today)
    assert _derive_streak([today - timedelta(days=1)], "UTC") == 1


def test_streak_two_days_ago_only_returns_zero(monkeypatch):
    """Streak is broken — last activity is too old."""
    from app.services.progress_service import _derive_streak
    today = date(2026, 5, 3)
    monkeypatch.setattr("app.services.progress_service._today_in_tz", lambda tz: today)
    assert _derive_streak([today - timedelta(days=2)], "UTC") == 0


def test_streak_five_consecutive_days(monkeypatch):
    from app.services.progress_service import _derive_streak
    today = date(2026, 5, 3)
    monkeypatch.setattr("app.services.progress_service._today_in_tz", lambda tz: today)
    days = [today - timedelta(days=i) for i in range(5)]  # today + 4 prior
    assert _derive_streak(days, "UTC") == 5


def test_streak_respects_timezone_boundary(monkeypatch):
    """The most likely real-world bug:
    Event 1 at 23:30 local + Event 2 at 00:30 next-day local should count
    as 2 distinct study days, even though both might fall in the same
    UTC day. The DB function user_study_days handles the cast; here we
    just verify the Python-side derivation walks the days correctly.
    """
    from app.services.progress_service import _derive_streak
    today = date(2026, 5, 4)  # in Bangkok local
    monkeypatch.setattr("app.services.progress_service._today_in_tz",
                        lambda tz: today if tz == "Asia/Bangkok" else date(2026, 5, 3))
    # SQL would have returned (in DESC order):
    #   2026-05-04 (from the 00:30 Bangkok event)
    #   2026-05-03 (from the 23:30 Bangkok event)
    days = [date(2026, 5, 4), date(2026, 5, 3)]
    assert _derive_streak(days, "Asia/Bangkok") == 2
