// scripts/lib/tutor-audio-providers.ts
// TTS provider abstraction for the AI Tutor audio pre-generation pipeline.
// Author-time only — never imported by the FastAPI runtime or the SPA bundle.
//
// The interface intentionally takes raw text and returns raw MP3 bytes so
// the calling script (generate-tutor-audio.ts) owns Supabase Storage uploads
// and DB writes. Adding a new provider (OpenAI TTS, Azure, etc.) requires
// only a new class plus a `getProvider` case.

export interface TtsProvider {
  name: string;
  synth(input: { text: string; voiceId?: string }): Promise<Buffer>;
}

// Default voice id "EXAVITQu4vr4xnSDxMaL" is ElevenLabs' built-in Sarah
// voice — high-quality, female, English, available on the free tier
// (10k chars/month). See https://elevenlabs.io/docs/api-reference/voices
// for the full list. Swap by passing voiceId per call if a scenario
// later needs a male voice or different persona.
export class ElevenLabsProvider implements TtsProvider {
  name = "elevenlabs";
  constructor(
    private apiKey: string,
    private defaultVoiceId: string = "EXAVITQu4vr4xnSDxMaL",
  ) {}

  async synth(input: { text: string; voiceId?: string }): Promise<Buffer> {
    const voiceId = input.voiceId ?? this.defaultVoiceId;
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: input.text,
          voice_settings: { stability: 0.5, similarity_boost: 0.5 },
        }),
      },
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => "<no body>");
      throw new Error(`ElevenLabs TTS failed: ${res.status} ${errText}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }
}

export function getProvider(
  name: string,
  env: Record<string, string | undefined>,
): TtsProvider {
  switch (name) {
    case "elevenlabs": {
      // NOTE: env var is ELEVEN_LABS_API_KEY (with underscore) to match
      // backend/.env conventions — NOT ELEVENLABS_API_KEY.
      const key = env.ELEVEN_LABS_API_KEY;
      if (!key) throw new Error("ELEVEN_LABS_API_KEY not set in backend/.env");
      return new ElevenLabsProvider(key);
    }
    case "openai-tts":
      throw new Error("OpenAI TTS provider not implemented yet");
    case "browser-skip":
      throw new Error(
        "browser-skip provider is for runtime; the gen script needs a real TTS provider",
      );
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}
