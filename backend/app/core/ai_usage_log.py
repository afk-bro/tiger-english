"""
ai_usage_log.py — In-memory AI usage log for development/demo environments.

Records every call to AI tutor endpoints (endpoint, model, tokens, cost).
Resets on server restart. For production, wire this to a real ai_usage_log table.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

# Circular list — oldest entries dropped when cap is hit
_log: List[Dict[str, Any]] = []
_MAX_ENTRIES = 500

# Approximate token prices (USD per 1k tokens) for Haiku and Sonnet
_PRICE_INPUT: Dict[str, float] = {
    "claude-haiku-4-5": 0.00025,
    "claude-sonnet-4-6": 0.003,
}
_PRICE_OUTPUT: Dict[str, float] = {
    "claude-haiku-4-5": 0.00125,
    "claude-sonnet-4-6": 0.015,
}


def _cost(model: str, input_tokens: int, output_tokens: int) -> float:
    pi = _PRICE_INPUT.get(model, 0.003)
    po = _PRICE_OUTPUT.get(model, 0.015)
    return (input_tokens * pi + output_tokens * po) / 1000


def record(
    user_id: str,
    endpoint: str,
    model: str,
    input_tokens: int,
    output_tokens: int,
    cache_input_tokens: int = 0,
    status: str = "ok",
) -> None:
    """Append one usage row to the in-memory log."""
    total_input = input_tokens + cache_input_tokens
    cache_hit_rate = (cache_input_tokens / total_input * 100) if total_input > 0 else 0.0
    cost = _cost(model, input_tokens, output_tokens)

    entry: Dict[str, Any] = {
        "id": len(_log) + 1,
        "user_id": user_id,
        "endpoint": endpoint,
        "model": model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cache_input_tokens": cache_input_tokens,
        "cache_hit_rate": round(cache_hit_rate, 1),
        "cost_estimate_usd": round(cost, 6),
        "status": status,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _log.append(entry)
    if len(_log) > _MAX_ENTRIES:
        _log.pop(0)


def get_recent(limit: int = 50) -> List[Dict[str, Any]]:
    """Return the most-recent *limit* entries, newest first."""
    return list(reversed(_log[-limit:]))


def get_summary() -> Dict[str, Any]:
    """Aggregate stats across all logged entries."""
    if not _log:
        return {
            "total_calls": 0,
            "total_cost_usd": 0.0,
            "cache_hit_rate": 0.0,
            "by_endpoint": [],
            "recent_calls": [],
        }

    total_cost = sum(e["cost_estimate_usd"] for e in _log)
    total_calls = len(_log)
    total_input = sum(e["input_tokens"] + e["cache_input_tokens"] for e in _log)
    total_cache = sum(e["cache_input_tokens"] for e in _log)
    cache_hit_rate = (total_cache / total_input * 100) if total_input > 0 else 0.0

    # Per-endpoint aggregation
    by_ep: Dict[str, Dict[str, Any]] = {}
    for entry in _log:
        ep = entry["endpoint"]
        if ep not in by_ep:
            by_ep[ep] = {"endpoint": ep, "calls": 0, "total_tokens": 0, "cost_estimate": 0.0}
        by_ep[ep]["calls"] += 1
        by_ep[ep]["total_tokens"] += entry["input_tokens"] + entry["output_tokens"]
        by_ep[ep]["cost_estimate"] += entry["cost_estimate_usd"]

    endpoint_list = []
    for v in by_ep.values():
        avg_tokens = v["total_tokens"] // max(1, v["calls"])
        endpoint_list.append({
            "endpoint": v["endpoint"],
            "calls": v["calls"],
            "avg_tokens": avg_tokens,
            "cost_estimate": round(v["cost_estimate"], 4),
        })

    return {
        "total_calls": total_calls,
        "total_cost_usd": round(total_cost, 4),
        "cache_hit_rate": round(cache_hit_rate, 1),
        "by_endpoint": endpoint_list,
        "recent_calls": get_recent(20),
    }
