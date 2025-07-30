from fastapi import APIRouter, Depends, HTTPException, status
from ...models.auth import UserRegister, UserLogin, MessageResponse, TokenResponse, UsernameCheckResponse
from ...services.auth_service import AuthService
from ...core.supabase import get_supabase_admin
from ...utils.exceptions import AuthException

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=MessageResponse)
async def register_user(
    user_data: UserRegister,
    supabase = Depends(get_supabase_admin)
):
    """Register a new user account"""
    try:
        auth_service = AuthService(supabase)
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
        print(f"Unexpected error in register_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "message": "An unexpected error occurred"
            }
        )

@router.post("/login", response_model=TokenResponse)
async def login_user(
    login_data: UserLogin,
    supabase = Depends(get_supabase_admin)
):
    """Login user and return access token"""
    try:
        auth_service = AuthService(supabase)
        result = await auth_service.login_user(login_data)
        return TokenResponse(**result)
        
    except AuthException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": e.message,
                "field": e.field
            }
        )
    except Exception as e:
        print(f"Unexpected error in login_user: {e}")
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
    supabase = Depends(get_supabase_admin)
):
    """Check if username is available"""
    try:
        auth_service = AuthService(supabase)
        is_available = await auth_service.check_username_availability(username)
        return UsernameCheckResponse(available=is_available)
        
    except Exception as e:
        print(f"Error checking username availability: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Error checking username availability"}
        )

@router.post("/logout")
async def logout_user():
    """Logout user (client-side token removal)"""
    return {"success": True, "message": "Logged out successfully"}
