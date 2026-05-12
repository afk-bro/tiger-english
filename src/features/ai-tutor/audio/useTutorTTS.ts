import { useCallback, useEffect, useRef, useState } from "react";
import { reportTutorEvent } from "../api/events";

export type TtsState = "idle" | "loading" | "playing" | "ended" | "error";

export interface UseTutorTTS {
  state: TtsState;
  play: (input: { text: string; audioUrl?: string | null }) => Promise<void>;
  stop: () => void;
}

const MODULE_VOICE_CACHE: {
  voice: SpeechSynthesisVoice | null;
  resolved: boolean;
} = {
  voice: null,
  resolved: false,
};

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (MODULE_VOICE_CACHE.resolved) return MODULE_VOICE_CACHE.voice;
  if (typeof speechSynthesis === "undefined") return null;
  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return null; // not yet loaded; try again later
  const enUS =
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en-")) ??
    voices[0];
  MODULE_VOICE_CACHE.voice = enUS ?? null;
  MODULE_VOICE_CACHE.resolved = true;
  return MODULE_VOICE_CACHE.voice;
}

export function useTutorTTS(): UseTutorTTS {
  const [state, setState] = useState<TtsState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // ignore — element may already be detached
      }
      audioRef.current = null;
    }
    if (
      typeof speechSynthesis !== "undefined" &&
      (speechSynthesis.speaking || utteranceRef.current)
    ) {
      try {
        speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    utteranceRef.current = null;
    setState("idle");
  }, []);

  const speakViaSynthesis = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (
        typeof speechSynthesis === "undefined" ||
        typeof SpeechSynthesisUtterance === "undefined"
      ) {
        setState("error");
        resolve();
        return;
      }
      const utt = new SpeechSynthesisUtterance(text);
      const voice = pickEnglishVoice();
      if (voice) utt.voice = voice;
      utt.lang = "en-US";
      utt.onend = () => {
        setState("ended");
        utteranceRef.current = null;
        resolve();
      };
      utt.onerror = () => {
        setState("error");
        utteranceRef.current = null;
        resolve();
      };
      utteranceRef.current = utt;
      setState("playing");
      speechSynthesis.speak(utt);
    });
  }, []);

  const play = useCallback(
    async ({
      text,
      audioUrl,
    }: {
      text: string;
      audioUrl?: string | null;
    }): Promise<void> => {
      stop();

      if (!audioUrl) {
        void reportTutorEvent("audio.fallback", { reason: "missing" });
        await speakViaSynthesis(text);
        return;
      }

      setState("loading");
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.preload = "auto";

      return new Promise<void>((resolve) => {
        let resolved = false;
        const finish = () => {
          if (resolved) return;
          resolved = true;
          resolve();
        };

        audio.onplaying = () => {
          if (audioRef.current === audio) setState("playing");
        };
        audio.onended = () => {
          if (audioRef.current === audio) {
            setState("ended");
            audioRef.current = null;
          }
          finish();
        };
        audio.onerror = () => {
          // fall back to synthesis
          void reportTutorEvent("audio.fallback", {
            reason: "load_error",
            audio_path: audioUrl,
          });
          if (audioRef.current === audio) audioRef.current = null;
          speakViaSynthesis(text).then(finish);
        };

        const playResult = audio.play();
        if (playResult && typeof playResult.catch === "function") {
          playResult.catch(() => {
            // play() rejection (e.g., autoplay-blocked without a user gesture).
            // `onerror` is NOT guaranteed to fire for policy rejections, so
            // without an explicit fallback here the UI could stay stuck in
            // 'loading' forever. Fall back to synthesis ourselves.
            if (resolved) return;
            void reportTutorEvent("audio.fallback", {
              reason: "play_rejected",
              audio_path: audioUrl,
            });
            if (audioRef.current === audio) audioRef.current = null;
            speakViaSynthesis(text).then(finish);
          });
        }
      });
    },
    [stop, speakViaSynthesis],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { state, play, stop };
}
