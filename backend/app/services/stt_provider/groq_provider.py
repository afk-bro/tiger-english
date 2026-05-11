"""Groq Whisper STT provider — OpenAI-compatible /audio/transcriptions endpoint."""
import httpx

from . import TranscriptResult, STTFailureError


GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions"


class GroqSTTProvider:
    """Groq Whisper API client. OpenAI-compatible /audio/transcriptions endpoint."""

    def __init__(self, api_key: str, model: str, timeout_s: int):
        self.api_key = api_key
        self.model = model
        self.timeout_s = timeout_s

    async def transcribe(
        self, audio: bytes, mime_type: str, prompt: str | None = None
    ) -> TranscriptResult:
        files = {"file": ("audio.bin", audio, mime_type)}
        data = {"model": self.model, "language": "en", "response_format": "verbose_json"}
        if prompt:
            data["prompt"] = prompt[:200]  # Groq prompt cap

        try:
            async with httpx.AsyncClient(timeout=self.timeout_s) as client:
                resp = await client.post(
                    GROQ_URL,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    data=data,
                    files=files,
                )
        except httpx.TimeoutException as exc:
            raise STTFailureError("timeout", http_status=None) from exc
        except httpx.HTTPError as exc:
            raise STTFailureError("network", http_status=None) from exc

        if resp.status_code >= 500:
            raise STTFailureError("upstream_5xx", http_status=resp.status_code)
        if resp.status_code >= 400:
            raise STTFailureError("upstream_4xx", http_status=resp.status_code)

        body = resp.json()
        text = (body.get("text") or "").strip()
        if len(text) < 2:
            raise STTFailureError("empty_transcript", http_status=resp.status_code)

        duration = body.get("duration")
        return TranscriptResult(
            text=text,
            language=body.get("language"),
            duration_ms=int(duration * 1000) if duration is not None else None,
        )
