from supabase import create_client, Client
from .config import settings

def get_supabase_admin() -> Client:
    """Get Supabase client with admin privileges (Supabase secret key)"""
    return create_client(
        settings.supabase_url,
        settings.supabase_secret_key
    )
