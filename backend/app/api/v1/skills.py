"""Skills API endpoints — /api/v1/me/skills/…"""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends

from ...core.security import get_current_user
from ...core.supabase import get_supabase_admin
from ...models.skills import SkillSummaryResponse
from ...services.skill_scoring_service import SkillScoringService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/me/skills", tags=["skills"])


def get_skill_service(supabase=Depends(get_supabase_admin)) -> SkillScoringService:
    return SkillScoringService(supabase)


@router.get(
    "/summary",
    response_model=SkillSummaryResponse,
    summary="Return all 11 skill scores for the authenticated user",
)
async def get_skills_summary(
    user_id: UUID = Depends(get_current_user),
    service: SkillScoringService = Depends(get_skill_service),
):
    skills = service.get_summary(user_id)
    return SkillSummaryResponse(skills=skills)
