import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTutorTTS } from "../useTutorTTS";
import { reportTutorEvent } from "../../api/events";

vi.mock("../../api/events", () => ({ reportTutorEvent: vi.fn() }));

describe("useTutorTTS", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Provide a minimal speechSynthesis mock
    vi.stubGlobal("speechSynthesis", {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
      speaking: false,
    });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      vi.fn(function (this: {
        text: string;
        onend: (() => void) | null;
        onerror: (() => void) | null;
        voice: SpeechSynthesisVoice | null;
        lang: string;
      }, text: string) {
        this.text = text;
        this.onend = null;
        this.onerror = null;
        this.voice = null;
        this.lang = "";
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("falls back to SpeechSynthesis when audioUrl is missing", async () => {
    const { result } = renderHook(() => useTutorTTS());
    (
      speechSynthesis.speak as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation((u: SpeechSynthesisUtterance) => {
      // Simulate immediate end
      setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 0);
    });

    await act(async () => {
      await result.current.play({ text: "hello", audioUrl: null });
    });

    expect(reportTutorEvent).toHaveBeenCalledWith("audio.fallback", {
      reason: "missing",
    });
    expect(speechSynthesis.speak).toHaveBeenCalled();
    expect(result.current.state).toBe("ended");
  });

  it("plays Audio when audioUrl is set; no fallback telemetry", async () => {
    class MockAudio {
      onplaying: (() => void) | null = null;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      preload = "none";
      currentTime = 0;
      constructor(public src: string) {}
      pause() {}
      play() {
        setTimeout(() => {
          this.onplaying?.();
          this.onended?.();
        }, 0);
        return Promise.resolve();
      }
    }
    vi.stubGlobal("Audio", MockAudio as unknown as typeof Audio);

    const { result } = renderHook(() => useTutorTTS());
    await act(async () => {
      await result.current.play({
        text: "hi",
        audioUrl: "https://example.com/x.mp3",
      });
    });

    expect(reportTutorEvent).not.toHaveBeenCalled();
    expect(speechSynthesis.speak).not.toHaveBeenCalled();
    expect(result.current.state).toBe("ended");
  });

  it("falls back to synthesis on Audio error AND fires telemetry", async () => {
    class MockAudio {
      onplaying: (() => void) | null = null;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      preload = "none";
      currentTime = 0;
      constructor(public src: string) {}
      pause() {}
      play() {
        setTimeout(() => this.onerror?.(), 0);
        return Promise.resolve();
      }
    }
    vi.stubGlobal("Audio", MockAudio as unknown as typeof Audio);
    (
      speechSynthesis.speak as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation((u: SpeechSynthesisUtterance) => {
      setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 0);
    });

    const { result } = renderHook(() => useTutorTTS());
    await act(async () => {
      await result.current.play({
        text: "hi",
        audioUrl: "https://example.com/missing.mp3",
      });
    });

    expect(reportTutorEvent).toHaveBeenCalledWith(
      "audio.fallback",
      expect.objectContaining({
        reason: "load_error",
        audio_path: "https://example.com/missing.mp3",
      }),
    );
    expect(speechSynthesis.speak).toHaveBeenCalled();
  });

  it("stop() cancels playback and resets state to idle", () => {
    const { result } = renderHook(() => useTutorTTS());
    act(() => result.current.stop());
    expect(result.current.state).toBe("idle");
    expect(() => result.current.stop()).not.toThrow();
  });
});
