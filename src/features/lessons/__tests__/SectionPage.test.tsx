import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SectionPage from "../pages/SectionPage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "count" in opts) return `${key}:${opts.count}`;
      if (opts && "number" in opts) return `${key}:${opts.number}`;
      return key;
    },
    i18n: { language: "en" },
  }),
}));

describe("SectionPage sticky header", () => {
  it("renders the section title from i18n key", () => {
    render(
      <MemoryRouter initialEntries={["/lessons/unit-1/grammar"]}>
        <Routes>
          <Route path="/lessons/:unitSlug/:sectionKey" element={<SectionPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "lessons.detail.sections.grammar" })).toBeInTheDocument();
  });
});
