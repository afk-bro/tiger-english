import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const useProgressSummaryMock = vi.fn();
vi.mock("@/features/dashboard/useProgressSummary", () => ({
  useProgressSummary: () => useProgressSummaryMock(),
}));

const useDashboardMock = vi.fn();
vi.mock("@/features/dashboard/useDashboard", () => ({
  useDashboard: () => useDashboardMock(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts) {
        const flat = Object.entries(opts).map(([k, v]) => `${k}=${v}`).join(",");
        return `${key}::${flat}`;
      }
      return key;
    },
    i18n: { language: "en" },
  }),
}));

beforeEach(() => {
  useProgressSummaryMock.mockReset();
  useDashboardMock.mockReset();
  useDashboardMock.mockReturnValue({
    handleLogout: vi.fn(),
    profile: { first_name: "Alex", timezone: "UTC" },
  });
});

const sampleSummary = {
  sections_completed: [],
  exercise_attempts: { total: 50, correct: 40 },
  flashcards: { reviewed_total: 100, currently_known: 25 },
  streak: { current_days: 3 },
  study_days_this_week: 4,
  last_active_at: new Date().toISOString(),
  activity: {
    lessons_completed: 2,
    exercises_attempted: 50,
    exercises_correct: 40,
    flashcards_reviewed: 100,
    flashcards_mastered: 25,
  },
};

describe("Dashboard page", () => {
  it("shows the loading state", async () => {
    useProgressSummaryMock.mockReturnValue({ data: null, isLoading: true, error: null });
    const { default: Dashboard } = await import("@/pages/Dashboard");
    render(<Dashboard />);
    expect(screen.getByText("dashboard.loading")).toBeInTheDocument();
  });

  it("shows the error state", async () => {
    useProgressSummaryMock.mockReturnValue({ data: null, isLoading: false, error: new Error("nope") });
    const { default: Dashboard } = await import("@/pages/Dashboard");
    render(<Dashboard />);
    expect(screen.getByText("dashboard.error")).toBeInTheDocument();
  });

  it("renders the widgets with real data", async () => {
    useProgressSummaryMock.mockReturnValue({ data: sampleSummary, isLoading: false, error: null });
    const { default: Dashboard } = await import("@/pages/Dashboard");
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/dashboard\.welcome\.greeting::name=Alex/)).toBeInTheDocument();
      expect(screen.getByText("dashboard.yourProgress.heading")).toBeInTheDocument();
      expect(screen.getByText(/lessonsCompleted::count=2/)).toBeInTheDocument();
    });
  });
});
