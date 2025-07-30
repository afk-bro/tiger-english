from supabase import create_client, Client
from .config import settings

def get_supabase_admin() -> Client:
    """Get Supabase client with admin privileges (service role key)"""
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key
    )
