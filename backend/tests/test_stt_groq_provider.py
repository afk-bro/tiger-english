"""Tests for the Groq Whisper STT provider (Task 2.4)."""
import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_groq_success():
    from app.services.stt_provider import GroqSTTProvider, TranscriptResult
    fake_resp = AsyncMock()
    fake_resp.status_code = 200
    fake_resp.json = lambda: {"text": "my name is tom", "language": "en", "duration": 1.4}
    fake_resp.raise_for_status = lambda: None
    fake_post = AsyncMock(return_value=fake_resp)
    with patch("httpx.AsyncClient.post", fake_post):
        provider = GroqSTTProvider(api_key="test", model="whisper-large-v3", timeout_s=10)
        out = await provider.transcribe(b"\x00\x00", mime_type="audio/webm", prompt="Introduce yourself")
    assert isinstance(out, TranscriptResult)
    assert out.text == "my name is tom"
    assert out.duration_ms == 1400


@pytest.mark.asyncio
async def test_groq_5xx_raises():
    from app.services.stt_provider import GroqSTTProvider, STTFailureError
    fake_resp = AsyncMock()
    fake_resp.status_code = 503
    fake_resp.raise_for_status = AsyncMock(side_effect=Exception("upstream"))
    with patch("httpx.AsyncClient.post", AsyncMock(return_value=fake_resp)):
        with pytest.raises(STTFailureError):
            await GroqSTTProvider("k", "whisper-large-v3", 10).transcribe(b"x", "audio/webm")


@pytest.mark.asyncio
async def test_groq_timeout_raises():
    import httpx
    from app.services.stt_provider import GroqSTTProvider, STTFailureError
    with patch("httpx.AsyncClient.post", AsyncMock(side_effect=httpx.TimeoutException("timeout"))):
        with pytest.raises(STTFailureError) as exc_info:
            await GroqSTTProvider("k", "whisper-large-v3", 10).transcribe(b"x", "audio/webm")
    assert "timeout" in exc_info.value.reason


@pytest.mark.asyncio
async def test_groq_empty_transcript_raises():
    from app.services.stt_provider import GroqSTTProvider, STTFailureError
    fake_resp = AsyncMock()
    fake_resp.status_code = 200
    fake_resp.json = lambda: {"text": "  ", "language": "en"}
    fake_resp.raise_for_status = lambda: None
    with patch("httpx.AsyncClient.post", AsyncMock(return_value=fake_resp)):
        with pytest.raises(STTFailureError):
            await GroqSTTProvider("k", "whisper-large-v3", 10).transcribe(b"x", "audio/webm")


@pytest.mark.asyncio
async def test_groq_very_short_transcript_raises():
    """A 1-char transcript should be treated the same as empty (STT failure)."""
    from app.services.stt_provider import GroqSTTProvider, STTFailureError
    fake_resp = AsyncMock()
    fake_resp.status_code = 200
    fake_resp.json = lambda: {"text": "a", "language": "en"}
    fake_resp.raise_for_status = lambda: None
    with patch("httpx.AsyncClient.post", AsyncMock(return_value=fake_resp)):
        with pytest.raises(STTFailureError):
            await GroqSTTProvider("k", "whisper-large-v3", 10).transcribe(b"x", "audio/webm")
