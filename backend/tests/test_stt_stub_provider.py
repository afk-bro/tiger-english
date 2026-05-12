import pytest

@pytest.mark.asyncio
async def test_stub_returns_canned_transcript():
    from app.services.stt_provider import StubSTTProvider, TranscriptResult
    provider = StubSTTProvider(canned_text="my name is tom")
    result = await provider.transcribe(b"\x00\x00", mime_type="audio/webm")
    assert isinstance(result, TranscriptResult)
    assert result.text == "my name is tom"

@pytest.mark.asyncio
async def test_stub_can_simulate_failure():
    from app.services.stt_provider import StubSTTProvider, STTFailureError
    provider = StubSTTProvider(simulate_failure=True)
    with pytest.raises(STTFailureError):
        await provider.transcribe(b"", mime_type="audio/webm")
