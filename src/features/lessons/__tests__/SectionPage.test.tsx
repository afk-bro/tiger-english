import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SectionPage from "../pages/SectionPage";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "count" in opts) return `${key}:${opts.count}`;
      if (opts && "number" in opts) return `${key}:${opts.number}`;
      return key;
    },
    i18n: mockI18n,
  }),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/lessons/:unitSlug/:sectionKey" element={<SectionPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SectionPage sticky header", () => {
  beforeEach(() => {
    mockI18n.language = "en";
  });

  it("renders the section title from i18n key", () => {
    renderAt("/lessons/unit-1/grammar");
    expect(screen.getByRole("heading", { level: 1, name: "lessons.detail.sections.grammar" })).toBeInTheDocument();
  });
});

describe("SectionPage coming-soon branch", () => {
  beforeEach(() => {
    mockI18n.language = "en";
  });

  it("renders the localized unit title when language is th", () => {
    mockI18n.language = "th";
    renderAt("/lessons/unit-2/grammar");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("To Be: คำถามใช่/ไม่ใช่");
  });
});
