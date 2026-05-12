import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { TutorPhrase } from "@/features/ai-tutor/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "defaultValue" in opts) return opts.defaultValue as string;
      return key;
    },
    i18n: { language: "en" },
  }),
}));

const mockPlay = vi.fn();
vi.mock("@/features/ai-tutor/audio/useTutorTTS", () => ({
  useTutorTTS: () => ({
    state: "idle",
    play: mockPlay,
    stop: vi.fn(),
  }),
}));

import { PhraseCard } from "@/features/ai-tutor/components/PhraseCard";

const phrase: TutorPhrase = {
  id: "phrase-1",
  phrase_en: "How are you?",
  translation_vi: "Bạn khỏe không?",
  audio_url: "https://example.com/audio/how-are-you.mp3",
  sort_order: 1,
};

describe("PhraseCard", () => {
  beforeEach(() => {
    mockPlay.mockReset();
  });

  it("renders English phrase and Vietnamese translation", () => {
    render(<PhraseCard phrase={phrase} />);
    expect(screen.getByText("How are you?")).toBeInTheDocument();
    expect(screen.getByText("Bạn khỏe không?")).toBeInTheDocument();
  });

  it("invokes tts.play with phrase text and audio_url when Listen is clicked", () => {
    render(<PhraseCard phrase={phrase} />);
    const listenButton = screen.getByRole("button", { name: /Listen/i });
    fireEvent.click(listenButton);
    expect(mockPlay).toHaveBeenCalledTimes(1);
    expect(mockPlay).toHaveBeenCalledWith({
      text: "How are you?",
      audioUrl: "https://example.com/audio/how-are-you.mp3",
    });
  });

  it("passes null audio_url through to tts.play (fallback path)", () => {
    render(<PhraseCard phrase={{ ...phrase, audio_url: null }} />);
    fireEvent.click(screen.getByRole("button", { name: /Listen/i }));
    expect(mockPlay).toHaveBeenCalledWith({
      text: "How are you?",
      audioUrl: null,
    });
  });
});
