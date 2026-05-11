def test_tutor_audio_url_handles_none():
    from app.core.storage import tutor_audio_url
    assert tutor_audio_url(None) is None


def test_tutor_audio_url_handles_empty_string():
    from app.core.storage import tutor_audio_url
    assert tutor_audio_url("") is None


def test_tutor_audio_url_builds_public_path(monkeypatch):
    from app.core import storage
    from app.core.config import settings
    monkeypatch.setattr(settings, "supabase_url", "https://abc.supabase.co")
    monkeypatch.setattr(settings, "tutor_audio_bucket", "ai-tutor-audio")
    assert storage.tutor_audio_url("scenarios/x/opening.mp3") == \
        "https://abc.supabase.co/storage/v1/object/public/ai-tutor-audio/scenarios/x/opening.mp3"
