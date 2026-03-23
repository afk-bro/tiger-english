from datetime import datetime
from supabase import Client
from ..models.auth import UserRegister, UserLogin
from ..utils.exceptions import AuthException

class AuthService:
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    async def check_username_availability(self, username: str) -> bool:
        """Check if username is available"""
        try:
            response = self.supabase.table('profiles').select('username').eq('username', username).execute()
            return len(response.data) == 0
        except Exception as e:
            print(f"Error checking username availability: {e}")
            # For safety, assume unavailable if we can't check
            return False
    
    async def register_user(self, user_data: UserRegister) -> dict:
        """Register a new user. Profile and user_stats are created by the
        handle_new_user DB trigger — do not insert into those tables here."""

        # Pre-check username before creating the auth user
        if not await self.check_username_availability(user_data.username):
            raise AuthException("Username is already taken", field="username")

        # Create Supabase auth user with metadata so the trigger can use it
        try:
            auth_response = self.supabase.auth.admin.create_user({
                "email": user_data.email,
                "password": user_data.password,
                "email_confirm": True,
                "user_metadata": {
                    "username": user_data.username,
                    "first_name": user_data.first_name,
                    "last_name": user_data.last_name,
                },
            })

            if not auth_response.user:
                raise AuthException("Failed to create user account")

            # The DB trigger creates profiles synchronously during create_user.
            # Write native_language now if provided — null is fine (skipped).
            if user_data.native_language is not None:
                self.supabase.table('profiles').update(
                    {"native_language": user_data.native_language}
                ).eq('id', auth_response.user.id).execute()

        except AuthException:
            raise
        except Exception as e:
            error_message = str(e).lower()
            if "already registered" in error_message or "user already exists" in error_message:
                raise AuthException("Email is already registered", field="email")
            raise AuthException(f"Registration failed: {str(e)}")

        # profiles + user_stats are created synchronously by the handle_new_user
        # trigger during the create_user call above — they exist by the time we return.
        return {
            "success": True,
            "message": "Account created successfully! Please log in to continue.",
        }
    
    async def login_user(self, login_data: UserLogin) -> dict:
        """Login user and return JWT token"""
        try:
            # Use Supabase auth to verify credentials
            auth_response = self.supabase.auth.sign_in_with_password({
                "email": login_data.email,
                "password": login_data.password
            })
            
            if not auth_response.user:
                raise AuthException("Invalid email or password", field="email")
            
            # Get user profile
            profile_response = self.supabase.table('profiles').select('*').eq('id', auth_response.user.id).single().execute()
            
            if not profile_response.data:
                raise AuthException("User profile not found")
            
            profile = profile_response.data
            
            # Update last login
            self.supabase.table('user_stats').update({
                "last_login": datetime.utcnow().isoformat()
            }).eq('user_id', auth_response.user.id).execute()
            
            return {
                "access_token": auth_response.session.access_token,
                "token_type": "bearer",
                "user": {
                    "id": profile["id"],
                    "email": profile["email"],
                    "username": profile["username"],
                    "first_name": profile["first_name"],
                    "last_name": profile["last_name"]
                }
            }
            
        except AuthException:
            raise
        except Exception as e:
            error_message = str(e).lower()
            if "invalid" in error_message or "credentials" in error_message:
                raise AuthException("Invalid email or password", field="email")
            raise AuthException(f"Login failed: {str(e)}")
