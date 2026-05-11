"""STT provider abstraction.

Provides a Protocol so the runtime can swap between Groq, a stub for tests,
and any future provider (OpenAI Whisper API, Azure, self-hosted, etc.) without
changing the call site.
"""
from typing import Protocol
from pydantic import BaseModel


class TranscriptResult(BaseModel):
    text: str
    language: str | None = None      # advisory only; never used for VI detection
    confidence: float | None = None
    duration_ms: int | None = None


class STTFailureError(Exception):
    """Raised by any STTProvider when transcription cannot be produced."""
    def __init__(self, reason: str, *, http_status: int | None = None):
        super().__init__(reason)
        self.reason = reason
        self.http_status = http_status


class STTProvider(Protocol):
    async def transcribe(
        self,
        audio: bytes,
        mime_type: str,
        prompt: str | None = None,
    ) -> TranscriptResult: ...


# Re-exports for ergonomic imports
from .stub_provider import StubSTTProvider  # noqa: E402
from .groq_provider import GroqSTTProvider  # noqa: E402

__all__ = ["TranscriptResult", "STTFailureError", "STTProvider", "StubSTTProvider", "GroqSTTProvider"]
