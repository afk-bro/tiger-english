"""
in_memory_skills.py — In-memory fallback for skill_scores when the DB table is absent.

When the skill_scores table exists in Supabase, data is read/written from there.
When it doesn't, this module stores EWMA-smoothed scores in memory for the current
server process lifecycle.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Optional

# user_id → { skill_key → {score, sample_size, last_updated_at} }
_store: Dict[str, Dict[str, dict]] = {}


def get_skill(user_id: str, skill_key: str) -> Optional[dict]:
    return _store.get(user_id, {}).get(skill_key)


def get_all_skills(user_id: str) -> list[dict]:
    return list(_store.get(user_id, {}).values())


def upsert_skill(user_id: str, skill_key: str, score: float, sample_size: int) -> None:
    if user_id not in _store:
        _store[user_id] = {}
    _store[user_id][skill_key] = {
        "skill": skill_key,
        "score": score,
        "sample_size": sample_size,
        "last_updated_at": datetime.now(timezone.utc).isoformat(),
    }


def has_any_data(user_id: str) -> bool:
    return bool(_store.get(user_id))
