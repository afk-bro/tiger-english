"""Helpers for resolving Supabase Storage paths to public URLs."""
from .config import settings


def public_url(bucket: str, path: str | None) -> str | None:
    if not path:
        return None
    base = settings.supabase_url.rstrip("/")
    return f"{base}/storage/v1/object/public/{bucket}/{path.lstrip('/')}"


def tutor_audio_url(path: str | None) -> str | None:
    return public_url(settings.tutor_audio_bucket, path)
