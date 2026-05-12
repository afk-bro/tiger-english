from . import TranscriptResult, STTFailureError


class StubSTTProvider:
    """Deterministic stub for tests. Returns canned text or raises on demand."""

    def __init__(self, canned_text: str = "", simulate_failure: bool = False, language: str = "en"):
        self.canned_text = canned_text
        self.simulate_failure = simulate_failure
        self.language = language

    async def transcribe(self, audio: bytes, mime_type: str, prompt: str | None = None) -> TranscriptResult:
        if self.simulate_failure:
            raise STTFailureError("stub_simulated_failure", http_status=503)
        return TranscriptResult(text=self.canned_text, language=self.language, confidence=1.0)
