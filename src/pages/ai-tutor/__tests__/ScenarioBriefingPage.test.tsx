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

const mockUseResumeOrStart = vi.fn();
vi.mock("@/features/ai-tutor/hooks/useResumeOrStart", () => ({
  useResumeOrStart: (opts: unknown) => mockUseResumeOrStart(opts),
}));

import ScenarioBriefingPage from "@/pages/ai-tutor/ScenarioBriefingPage";

const baseScenario: TutorScenarioDetail = {
  id: "scenario-1",
  slug: "ordering-coffee",
  mode: "free_talk",
  level: "A1",
  title_en: "Ordering coffee",
  title_vi: "Gọi cà phê",
  description_en: "Order coffee at a cafe.",
  description_vi: "Gọi cà phê ở quán.",
  goal_en: "Order a drink",
  goal_vi: "Gọi một thức uống",
  ai_persona: null,
  opening_line_en: "Hello!",
  opening_audio_url: null,
  is_free: true,
  tasks: [
    {
      id: "task-1",
      task_key: "greet",
      title_en: "Greet the barista",
      title_vi: "Chào nhân viên pha chế",
      sort_order: 1,
      next_ai_line_en: null,
      next_ai_line_audio_url: null,
    },
    {
      id: "task-2",
      task_key: "order",
      title_en: "Place your order",
      title_vi: "Đặt hàng",
      sort_order: 2,
      next_ai_line_en: null,
      next_ai_line_audio_url: null,
    },
  ],
  phrases: [],
  existing_active_session_id: null,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/ai-tutor/scenarios/ordering-coffee/briefing"]}>
      <Routes>
        <Route
          path="/ai-tutor/scenarios/:slug/briefing"
          element={<ScenarioBriefingPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ScenarioBriefingPage", () => {
  beforeEach(() => {
    mockUseScenario.mockReset();
    mockUseResumeOrStart.mockReset();
  });

  it("shows a single 'Start lesson' button when there is no active session", () => {
    mockUseScenario.mockReturnValue({
      scenario: baseScenario,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseResumeOrStart.mockReturnValue({
      existingActiveSessionId: null,
      startFresh: vi.fn(),
      startContinue: vi.fn(),
      isStarting: false,
      error: null,
    });

    renderPage();

    // Vi-prominent + En-muted titles
    expect(screen.getByText("Gọi cà phê")).toBeInTheDocument();
    expect(screen.getByText("Ordering coffee")).toBeInTheDocument();

    // Tasks rendered
    expect(screen.getByText("Chào nhân viên pha chế")).toBeInTheDocument();
    expect(screen.getByText("Đặt hàng")).toBeInTheDocument();

    // Single start button
    expect(
      screen.getByRole("button", { name: /Start lesson/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Continue where you left off/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Start fresh/i }),
    ).not.toBeInTheDocument();
  });

  it("shows BOTH Continue and Start fresh when an active session exists", () => {
    mockUseScenario.mockReturnValue({
      scenario: {
        ...baseScenario,
        existing_active_session_id: "session-abc",
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseResumeOrStart.mockReturnValue({
      existingActiveSessionId: "session-abc",
      startFresh: vi.fn(),
      startContinue: vi.fn(),
      isStarting: false,
      error: null,
    });

    renderPage();

    expect(
      screen.getByRole("button", { name: /Continue where you left off/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Start fresh/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Start lesson$/i }),
    ).not.toBeInTheDocument();
  });

  it("disables start buttons while isStarting is true", () => {
    mockUseScenario.mockReturnValue({
      scenario: baseScenario,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseResumeOrStart.mockReturnValue({
      existingActiveSessionId: null,
      startFresh: vi.fn(),
      startContinue: vi.fn(),
      isStarting: true,
      error: null,
    });

    renderPage();

    const btn = screen.getByRole("button", { name: /Start lesson/i });
    expect(btn).toBeDisabled();
  });
});
