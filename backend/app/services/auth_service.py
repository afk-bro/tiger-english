from datetime import datetime
from supabase import Client
from ..models.auth import UserRegister, UserLogin, UserResponse
from ..core.security import get_password_hash, verify_password
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
        """Register a new user - mirrors your existing TypeScript logic"""
        
        # Step 0: Pre-check username availability FIRST (before creating auth user)
        if not await self.check_username_availability(user_data.username):
            raise AuthException("Username is already taken", field="username")
        
        # Step 1: Sign up user with Supabase Auth (only after username is confirmed available)
        try:
            auth_response = self.supabase.auth.admin.create_user({
                "email": user_data.email,
                "password": user_data.password,
                "email_confirm": True  # Auto-confirm for development
            })
            
            if not auth_response.user:
                raise AuthException("Failed to create user account")
                
            user_id = auth_response.user.id
            
        except Exception as e:
            error_message = str(e).lower()
            if "already registered" in error_message or "user already exists" in error_message:
                raise AuthException("Email is already registered", field="email")
            raise AuthException(f"Registration failed: {str(e)}")
        
        # Check if user already exists (Supabase might return success but user already exists)
        if not auth_response.user:
            raise AuthException("No user object returned from registration")
        
        # Step 2: Insert profile info
        try:
            profile_data = {
                "id": user_id,
                "email": user_data.email,
                "username": user_data.username,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name
            }
            
            profile_response = self.supabase.table('profiles').insert(profile_data).execute()
            
        except Exception as e:
            # Cleanup auth user since profile creation failed
            await self._cleanup_auth_user(user_id)
            
            error_message = str(e).lower()
            if "duplicate" in error_message or "unique constraint" in error_message:
                if "username" in error_message:
                    raise AuthException("Username is already taken", field="username")
                elif "email" in error_message:
                    raise AuthException("Email is already registered", field="email")
            
            raise AuthException(f"Profile creation failed: {str(e)}")
        
        # Step 3: Insert user stats
        try:
            stats_data = {
                "user_id": user_id,
                "xp": 0,
                "level": 1,
                "study_streak": 0,
                "last_login": datetime.utcnow().isoformat()
            }
            
            stats_response = self.supabase.table('user_stats').insert(stats_data).execute()
            
        except Exception as e:
            # Cleanup both auth user and profile
            await self._cleanup_auth_user(user_id)
            try:
                self.supabase.table('profiles').delete().eq('id', user_id).execute()
            except:
                pass  # Best effort cleanup
            
            raise AuthException(f"Stats creation failed: {str(e)}")
        
        return {
            "success": True,
            "message": "Account created successfully! Please log in to continue."
        }
    
    async def _cleanup_auth_user(self, user_id: str):
        """Cleanup auth user if registration fails"""
        try:
            self.supabase.auth.admin.delete_user(user_id)
            print(f"Successfully cleaned up auth user: {user_id}")
        except Exception as e:
            print(f"Failed to cleanup auth user {user_id}: {e}")
    
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
