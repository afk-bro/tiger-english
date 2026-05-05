"""Admin API endpoints — /api/v1/admin/…

Restricted to super-admin users (configured via SUPER_ADMIN_USER_IDS env var).
"""
from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from ...core.config import settings
from ...core.security import get_current_user
from ...core import ai_usage_log

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_super_admin(user_id: UUID = Depends(get_current_user)) -> UUID:
    """Dependency that gates endpoints to super-admin users only.

    In development mode (no super-admin IDs configured), all authenticated
    users are treated as super-admin so the dashboard is visible.
    """
    admin_ids = settings.super_admin_ids
    if admin_ids and str(user_id) not in admin_ids:
        raise HTTPException(status_code=403, detail="Super-admin access required")
    return user_id


@router.get("/ai-usage-log", summary="Return AI usage log (super-admin only)")
async def get_ai_usage_log(
    limit: int = 50,
    _user_id: UUID = Depends(_require_super_admin),
):
    """Return recent AI usage entries newest-first."""
    return {"entries": ai_usage_log.get_recent(limit)}


@router.get("/ai-usage-summary", summary="Return AI usage aggregate stats (super-admin only)")
async def get_ai_usage_summary(
    _user_id: UUID = Depends(_require_super_admin),
):
    """Return aggregated AI usage statistics."""
    return ai_usage_log.get_summary()
