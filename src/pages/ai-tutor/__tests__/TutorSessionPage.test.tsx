import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type {
  TutorScenarioDetail,
  TutorTurnDTO,
} from "@/features/ai-tutor/types";
import type { SessionState } from "@/features/ai-tutor/state/sessionMachine";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const template =
        opts && "defaultValue" in opts ? (opts.defaultValue as string) : key;
      if (!opts) return template;
      // Tiny {{var}} interpolator so tests can assert on interpolated text.
      return template.replace(/\{\{(\w+)\}\}/g, (_m, name) => {
        const v = (opts as Record<string, unknown>)[name];
        return v === undefined ? `{{${name}}}` : String(v);
      });
    },
    i18n: { language: "en" },
  }),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const mockIsBrowserSupported = vi.fn();
vi.mock("@/features/ai-tutor/audio/audioUtils", () => ({
  isBrowserSupported: () => mockIsBrowserSupported(),
}));

const mockReportTutorEvent = vi.fn();
vi.mock("@/features/ai-tutor/api/events", () => ({
  reportTutorEvent: (...args: unknown[]) => mockReportTutorEvent(...args),
}));

const mockUseScenario = vi.fn();
vi.mock("@/features/ai-tutor/hooks/useScenario", () => ({
  useScenario: (slug: string | undefined) => mockUseScenario(slug),
}));

const mockUseTutorSession = vi.fn();
vi.mock("@/features/ai-tutor/hooks/useTutorSession", () => ({
  useTutorSession: (opts: unknown) => mockUseTutorSession(opts),
}));

// Stub heavy presentational deps to keep the smoke tests focused on
// orchestration logic in TutorSessionPage itself.
vi.mock("@/features/ai-tutor/components/RecordingPanel", () => ({
  RecordingPanel: ({ mode }: { mode: string }) => (
    <div data-testid="recording-panel">recording:{mode}</div>
  ),
}));
vi.mock("@/features/ai-tutor/components/TaskProgressBanner", () => ({
  TaskProgressBanner: ({
    currentTaskEn,
  }: {
    currentTaskEn: string;
  }) => <div data-testid="task-banner">{currentTaskEn}</div>,
}));

import TutorSessionPage from "@/pages/ai-tutor/TutorSessionPage";

const openingTurn: TutorTurnDTO = {
  id: "turn-open",
  speaker: "ai",
  text_en: "Hello there!",
  audio_url: null,
  correction: null,
  task_completed: false,
  created_at: "2026-05-11T00:00:00Z",
};

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
  opening_line_en: "Hello there!",
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
  ],
  phrases: [],
  existing_active_session_id: null,
};

function makeSession(state: SessionState) {
  return {
    state,
    dispatch: vi.fn(),
    tts: { state: "idle", play: vi.fn(), stop: vi.fn() },
    mic: {
      state: "idle",
      error: null,
      blob: null,
      mimeType: "",
      stream: null,
      start: vi.fn(),
      stop: vi.fn(),
      cancel: vi.fn(),
      reset: vi.fn(),
    },
    submitTurn: vi.fn(),
    finishSession: vi.fn(),
  };
}

function renderPage(routerState: unknown = null) {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/ai-tutor/scenarios/ordering-coffee/session/sess-1",
          state: routerState,
        },
      ]}
    >
      <Routes>
        <Route
          path="/ai-tutor/scenarios/:slug/session/:sessionId"
          element={<TutorSessionPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("TutorSessionPage", () => {
  beforeEach(() => {
    mockIsBrowserSupported.mockReset();
    mockReportTutorEvent.mockReset();
    mockUseScenario.mockReset();
    mockUseTutorSession.mockReset();
  });

  it("renders the unsupported-browser screen and fires telemetry when MediaRecorder is missing", async () => {
    mockIsBrowserSupported.mockReturnValue({
      ok: false,
      missing: ["MediaRecorder"],
    });
    mockUseScenario.mockReturnValue({
      scenario: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTutorSession.mockReturnValue(makeSession({ kind: "loading" }));

    renderPage();

    expect(
      screen.getByText(/doesn’t support recording/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockReportTutorEvent).toHaveBeenCalledWith(
        "unsupported_browser",
        expect.objectContaining({ missing: ["MediaRecorder"] }),
      );
    });
  });

  it("renders the opening turn supplied via router state once scenario is loaded", async () => {
    mockIsBrowserSupported.mockReturnValue({ ok: true, missing: [] });
    mockUseScenario.mockReturnValue({
      scenario: baseScenario,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    const sess = makeSession({ kind: "ai_speaking", turn: openingTurn });
    mockUseTutorSession.mockReturnValue(sess);

    renderPage({ openingTurn, currentTaskId: "task-1" });

    await waitFor(() => {
      expect(screen.getByText("Hello there!")).toBeInTheDocument();
    });
    expect(screen.getByTestId("task-banner").textContent).toContain(
      "Greet the barista",
    );
    expect(screen.getByTestId("recording-panel")).toBeInTheDocument();
  });

  it("renders the EndLessonModal when state.kind === 'end_lesson_confirm'", async () => {
    mockIsBrowserSupported.mockReturnValue({ ok: true, missing: [] });
    mockUseScenario.mockReturnValue({
      scenario: baseScenario,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTutorSession.mockReturnValue(
      makeSession({
        kind: "end_lesson_confirm",
        tasksDone: 1,
        tasksTotal: 2,
      }),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(screen.getByText(/Finish lesson\?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/completed 1 of 2 tasks/i),
    ).toBeInTheDocument();
  });

  it("renders the LessonCompleteScreen when state.kind === 'lesson_complete'", async () => {
    mockIsBrowserSupported.mockReturnValue({ ok: true, missing: [] });
    mockUseScenario.mockReturnValue({
      scenario: baseScenario,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseTutorSession.mockReturnValue(
      makeSession({
        kind: "lesson_complete",
        corrections: [],
        xpAwarded: 25,
      }),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Lesson finished/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/\+25 XP/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Continue/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /View dashboard/i }),
    ).toBeInTheDocument();
  });
});
