"""
pending_reviews.py — In-memory store for vocab review items added via conversation missions.

Since the review_items table may not exist in the DB yet, we keep a per-user list
of recently added items in memory (keyed by user_id). The /review/due endpoint
merges these with DB-backed items so they appear in the drill queue immediately.

Items are kept up to 7 days after insertion and are removed once rated (as if
they were cleared from the DB).
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Dict, List
from uuid import uuid4

# user_id (str) → list of pending items
_pending: Dict[str, List[dict]] = {}

_TTL_DAYS = 7


def add_vocab_items(user_id: str, words: List[str], scenario_slug: str) -> List[dict]:
    """Add missed vocabulary words to the in-memory pending queue.

    Returns the list of newly created items.
    """
    now = datetime.now(timezone.utc)
    new_items: List[dict] = []
    for word in words:
        item = {
            "id": str(uuid4()),
            "user_id": user_id,
            "item_type": "word",
            "prompt": f"How do you use '{word}' in a sentence?",
            "answer": word,
            "note": f"Missed in '{scenario_slug}' conversation",
            "ease_factor": 2.5,
            "interval_days": 1,
            "streak_correct": 0,
            "next_review_at": now.isoformat(),
            "created_at": now.isoformat(),
            "expires_at": (now + timedelta(days=_TTL_DAYS)).isoformat(),
        }
        new_items.append(item)

    if user_id not in _pending:
        _pending[user_id] = []
    _pending[user_id].extend(new_items)
    return new_items


def get_due_items(user_id: str) -> List[dict]:
    """Return pending items that are due now and not yet expired."""
    now = datetime.now(timezone.utc)
    items = _pending.get(user_id, [])
    due = []
    for item in items:
        try:
            expires = datetime.fromisoformat(item["expires_at"])
            next_rev = datetime.fromisoformat(item["next_review_at"])
            if expires > now and next_rev <= now:
                due.append(item)
        except (KeyError, ValueError):
            pass
    return due


def get_count(user_id: str) -> int:
    """Return count of due pending items."""
    return len(get_due_items(user_id))


def remove_item(user_id: str, item_id: str) -> None:
    """Remove an item once rated (consumed)."""
    items = _pending.get(user_id, [])
    _pending[user_id] = [i for i in items if i["id"] != item_id]


def update_item(user_id: str, item_id: str, updates: dict) -> bool:
    """Update fields on a pending item (e.g. after SM-2 rating)."""
    for item in _pending.get(user_id, []):
        if item["id"] == item_id:
            item.update(updates)
            return True
    return False
