import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LessonsIndex from "../pages/LessonsIndex";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "count" in opts) return `${key}:${opts.count}`;
      if (opts && "defaultValue" in opts) return opts.defaultValue as string;
      return key;
    },
    i18n: { language: "en" },
  }),
}));

describe("LessonsIndex", () => {
  it("renders the page heading", () => {
    render(<MemoryRouter><LessonsIndex /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("shows a CEFR level section for A1", () => {
    render(<MemoryRouter><LessonsIndex /></MemoryRouter>);
    // All current units are A1, so there should be an A1 section heading
    expect(screen.getByRole("region", { name: /A1/i })).toBeInTheDocument();
  });

  it("shows the CEFR level label for A1", () => {
    render(<MemoryRouter><LessonsIndex /></MemoryRouter>);
    // CEFR_LEVEL_LABELS["A1"] = "A1 – Beginner"
    expect(screen.getByText("A1 – Beginner")).toBeInTheDocument();
  });

  it("renders unit-1 under the A1 section", () => {
    render(<MemoryRouter><LessonsIndex /></MemoryRouter>);
    // Title also appears in the teacher-assigned rail, so >=1 match is the correct invariant.
    expect(screen.getAllByText("To Be: Introduction").length).toBeGreaterThan(0);
  });

  it("renders unit-2 under the A1 section", () => {
    render(<MemoryRouter><LessonsIndex /></MemoryRouter>);
    expect(screen.getByText("To Be + Location")).toBeInTheDocument();
  });

  it("does not show a section for B2 (no units at that level)", () => {
    render(<MemoryRouter><LessonsIndex /></MemoryRouter>);
    expect(screen.queryByText("B2 – Upper Intermediate")).not.toBeInTheDocument();
  });

  it("does not show a section for C1 (no units at that level)", () => {
    render(<MemoryRouter><LessonsIndex /></MemoryRouter>);
    expect(screen.queryByText("C1 – Advanced")).not.toBeInTheDocument();
  });
});
