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

vi.mock("../data/sectionRegistry", async () => {
  const actual = await vi.importActual<typeof import("../data/sectionRegistry")>("../data/sectionRegistry");
  const cache = new Map<string, ReturnType<typeof actual.lookupSection>>();
  return {
    ...actual,
    lookupSection: (slug: string, key: string) => {
      const cacheKey = `${slug}:${key}`;
      if (cache.has(cacheKey)) return cache.get(cacheKey);
      const real = actual.lookupSection(slug, key as never);
      const result = slug === "unit-1" && key === "grammar" && real
        ? { ...real, imageUrl: "https://example.com/sec.png" }
        : real;
      cache.set(cacheKey, result);
      return result;
    },
  };
});

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

describe("SectionPage section header image", () => {
  beforeEach(() => { mockI18n.language = "en"; });

  it("renders a banner image when section.imageUrl is set", () => {
    const { container } = renderAt("/lessons/unit-1/grammar");
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toBe("https://example.com/sec.png");
  });

  it("does not render a banner image when section.imageUrl is undefined", () => {
    const { container } = renderAt("/lessons/unit-1/vocabulary");
    expect(container.querySelector("img")).toBeNull();
  });
});
