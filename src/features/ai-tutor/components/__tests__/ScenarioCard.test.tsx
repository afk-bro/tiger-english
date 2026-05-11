import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ScenarioCard } from "@/features/ai-tutor/components/ScenarioCard";
import type { TutorScenarioSummary } from "@/features/ai-tutor/types";

const scenario: TutorScenarioSummary = {
  slug: "ordering-coffee",
  title_en: "Ordering coffee",
  title_vi: "Gọi cà phê",
  level: "A1",
  mode: "free_talk",
  is_free: true,
};

describe("ScenarioCard", () => {
  it("renders both Vietnamese and English titles", () => {
    render(
      <MemoryRouter>
        <ScenarioCard scenario={scenario} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Gọi cà phê")).toBeInTheDocument();
    expect(screen.getByText("Ordering coffee")).toBeInTheDocument();
  });

  it("wraps the whole card in a link to the phrasebook URL", () => {
    render(
      <MemoryRouter>
        <ScenarioCard scenario={scenario} />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "/ai-tutor/scenarios/ordering-coffee/phrasebook",
    );
  });
});
