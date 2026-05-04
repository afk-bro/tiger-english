from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from ...models.auth import UserRegister, MessageResponse, UsernameCheckResponse, UpdateProfile, ProfileResponse
from ...services.auth_service import AuthService
from ...core.supabase import get_supabase_admin
from ...core.security import get_current_user
from ...utils.exceptions import AuthException
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


def get_auth_service(supabase=Depends(get_supabase_admin)) -> AuthService:
    return AuthService(supabase)


@router.post("/register", response_model=MessageResponse)
async def register_user(
    user_data: UserRegister,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Register a new user account"""
    try:
        result = await auth_service.register_user(user_data)
        return MessageResponse(**result)

    except AuthException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": e.message,
                "field": e.field
            }
        )
    except Exception as e:
        logger.exception("Unexpected error in register_user: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "message": "An unexpected error occurred"
            }
        )


@router.get("/check-username/{username}", response_model=UsernameCheckResponse)
async def check_username_availability(
    username: str,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Check if username is available"""
    try:
        is_available = await auth_service.check_username_availability(username)
        return UsernameCheckResponse(available=is_available)

    except Exception as e:
        logger.exception("Error checking username availability: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Error checking username availability"}
        )


@router.post("/logout")
async def logout_user():
    """Logout user (client-side token removal)"""
    return {"success": True, "message": "Logged out successfully"}


@router.patch("/profile", response_model=ProfileResponse)
async def update_profile(
    profile_data: UpdateProfile,
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
):
    """Update the authenticated user's profile."""
    try:
        update_payload: dict = {}
        fields_set = profile_data.model_fields_set
        if "native_language" in fields_set:
            update_payload["native_language"] = profile_data.native_language
        if "timezone" in fields_set:
            update_payload["timezone"] = profile_data.timezone

        user_id_str = str(user_id)

        if update_payload:
            update_result = supabase.table('profiles').update(
                update_payload
            ).eq('id', user_id_str).execute()
            if not update_result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={"success": False, "message": "Profile not found"},
                )

        result = supabase.table('profiles').select(
            'id, username, first_name, last_name, native_language'
        ).eq('id', user_id_str).single().execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Profile not found"},
            )

        return ProfileResponse(**result.data)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in update_profile: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": "An unexpected error occurred"},
        )
