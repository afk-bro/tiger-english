import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { TutorScenarioSummary } from "@/features/ai-tutor/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "defaultValue" in opts) return opts.defaultValue as string;
      return key;
    },
    i18n: { language: "en" },
  }),
}));

const mockListScenarios = vi.fn();
vi.mock("@/features/ai-tutor/api/tutor", () => ({
  tutorAPI: {
    listScenarios: () => mockListScenarios(),
  },
}));

const mockUseUserStore = vi.fn();
vi.mock("@/stores/useUserStore", () => ({
  useUserStore: (selector: (s: unknown) => unknown) =>
    mockUseUserStore(selector),
}));

vi.mock("sonner", () => ({ toast: vi.fn() }));

import AiTutorHomePage from "@/pages/ai-tutor/AiTutorHomePage";

const scenarios: TutorScenarioSummary[] = [
  {
    slug: "meeting-someone-new",
    title_en: "Meeting someone new",
    title_vi: "Gặp người mới",
    level: "A1",
    mode: "free_talk",
    is_free: true,
  },
  {
    slug: "ordering-coffee",
    title_en: "Ordering coffee",
    title_vi: "Gọi cà phê",
    level: "A1",
    mode: "free_talk",
    is_free: true,
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <AiTutorHomePage />
    </MemoryRouter>,
  );
}

describe("AiTutorHomePage", () => {
  beforeEach(() => {
    mockListScenarios.mockReset();
    mockUseUserStore.mockReset();
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ profile: { native_language: "vi" } }),
    );
  });

  it("renders featured scenario + free-talk grid after load", async () => {
    mockListScenarios.mockResolvedValue(scenarios);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Gặp người mới")).toBeInTheDocument();
    });

    // Featured + free-talk both rendered
    expect(screen.getByText("Meeting someone new")).toBeInTheDocument();
    expect(screen.getByText("Gọi cà phê")).toBeInTheDocument();
    expect(screen.getByText("Ordering coffee")).toBeInTheDocument();

    // Lessons + Free Talk section headers
    expect(screen.getByText(/Lessons/i)).toBeInTheDocument();
    expect(screen.getByText(/Free Talk/i)).toBeInTheDocument();
  });

  it("renders the free-talk anchor id even when only the featured scenario exists", async () => {
    mockListScenarios.mockResolvedValue([scenarios[0]]);
    const { container } = renderPage();
    await waitFor(() => {
      expect(screen.getByText("Gặp người mới")).toBeInTheDocument();
    });
    expect(container.querySelector("#free-talk")).not.toBeNull();
    expect(screen.getByText(/More scenarios coming soon/i)).toBeInTheDocument();
  });

  it("shows the VI banner for non-Vietnamese learners and hides it on dismiss", async () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ profile: { native_language: "en" } }),
    );
    mockListScenarios.mockResolvedValue(scenarios);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Gặp người mới")).toBeInTheDocument();
    });

    const banner = screen.getByText(/optimized for Vietnamese learners/i);
    expect(banner).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(
      screen.queryByText(/optimized for Vietnamese learners/i),
    ).not.toBeInTheDocument();
  });

  it("does NOT show the VI banner for Vietnamese learners", async () => {
    mockListScenarios.mockResolvedValue(scenarios);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Gặp người mới")).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/optimized for Vietnamese learners/i),
    ).not.toBeInTheDocument();
  });

  it("renders an error message when listScenarios rejects", async () => {
    mockListScenarios.mockRejectedValue(new Error("boom"));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("boom")).toBeInTheDocument();
    });
  });

  it("renders an empty-state when the scenarios list is empty", async () => {
    mockListScenarios.mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByText(/No scenarios available yet/i),
      ).toBeInTheDocument();
    });
  });
});
