import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FeaturedLessonCard } from "@/features/ai-tutor/components/FeaturedLessonCard";
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

const scenario: TutorScenarioSummary = {
  slug: "meeting-someone-new",
  title_en: "Meeting someone new",
  title_vi: "Gặp người mới",
  level: "A1",
  mode: "free_talk",
  is_free: true,
};

function renderCard(s: TutorScenarioSummary = scenario) {
  return render(
    <MemoryRouter>
      <FeaturedLessonCard scenario={s} />
    </MemoryRouter>,
  );
}

describe("FeaturedLessonCard", () => {
  it("renders the Vietnamese title prominently and English title underneath", () => {
    renderCard();
    expect(screen.getByText("Gặp người mới")).toBeInTheDocument();
    expect(screen.getByText("Meeting someone new")).toBeInTheDocument();
  });

  it("shows the Free pill when is_free", () => {
    renderCard();
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("hides the Free pill when not is_free", () => {
    renderCard({ ...scenario, is_free: false });
    expect(screen.queryByText("Free")).not.toBeInTheDocument();
  });

  it("Start link points to the phrasebook URL for the scenario", () => {
    renderCard();
    const link = screen.getByRole("link", { name: /start/i });
    expect(link).toHaveAttribute(
      "href",
      "/ai-tutor/scenarios/meeting-someone-new/phrasebook",
    );
  });
});
