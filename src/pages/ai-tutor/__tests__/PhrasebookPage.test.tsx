import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { TutorScenarioDetail } from "@/features/ai-tutor/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "defaultValue" in opts) return opts.defaultValue as string;
      return key;
    },
    i18n: { language: "en" },
  }),
}));

const mockUseScenario = vi.fn();
vi.mock("@/features/ai-tutor/hooks/useScenario", () => ({
  useScenario: (slug: string | undefined) => mockUseScenario(slug),
}));

vi.mock("@/features/ai-tutor/audio/useTutorTTS", () => ({
  useTutorTTS: () => ({
    state: "idle",
    play: vi.fn(),
    stop: vi.fn(),
  }),
}));

import PhrasebookPage from "@/pages/ai-tutor/PhrasebookPage";

const scenario: TutorScenarioDetail = {
  id: "scenario-1",
  slug: "ordering-coffee",
  mode: "free_talk",
  level: "A1",
  title_en: "Ordering coffee",
  title_vi: "Gọi cà phê",
  description_en: null,
  description_vi: null,
  goal_en: null,
  goal_vi: null,
  ai_persona: null,
  opening_line_en: "Hi there!",
  opening_audio_url: null,
  is_free: true,
  tasks: [],
  phrases: [
    {
      id: "p1",
      phrase_en: "Can I have a coffee?",
      translation_vi: "Cho tôi một ly cà phê?",
      audio_url: null,
      sort_order: 1,
    },
    {
      id: "p2",
      phrase_en: "How much is it?",
      translation_vi: "Bao nhiêu tiền?",
      audio_url: null,
      sort_order: 2,
    },
  ],
  existing_active_session_id: null,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/ai-tutor/scenarios/ordering-coffee/phrasebook"]}>
      <Routes>
        <Route
          path="/ai-tutor/scenarios/:slug/phrasebook"
          element={<PhrasebookPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PhrasebookPage", () => {
  beforeEach(() => {
    mockUseScenario.mockReset();
  });

  it("renders loading state", () => {
    mockUseScenario.mockReturnValue({
      scenario: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("renders error state", () => {
    mockUseScenario.mockReturnValue({
      scenario: null,
      isLoading: false,
      error: new Error("Network down"),
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByText("Network down")).toBeInTheDocument();
  });

  it("renders all phrases and a Next link to the briefing page", () => {
    mockUseScenario.mockReturnValue({
      scenario,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();

    expect(screen.getByText("Can I have a coffee?")).toBeInTheDocument();
    expect(screen.getByText("Cho tôi một ly cà phê?")).toBeInTheDocument();
    expect(screen.getByText("How much is it?")).toBeInTheDocument();
    expect(screen.getByText("Bao nhiêu tiền?")).toBeInTheDocument();

    const nextLink = screen.getByRole("link", { name: /Next/i });
    expect(nextLink).toHaveAttribute(
      "href",
      "/ai-tutor/scenarios/ordering-coffee/briefing",
    );
  });
});
