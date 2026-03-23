# backend/app/core/languages.py

SUPPORTED_LANGUAGES: frozenset[str] = frozenset({'th', 'zh', 'vi'})


def validate_native_language(value: str | None) -> str | None:
    """Return value if valid, None if None, raise ValueError for unknown codes."""
    if value is None:
        return None
    if value not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Unsupported language code: {value!r}")
    return value
