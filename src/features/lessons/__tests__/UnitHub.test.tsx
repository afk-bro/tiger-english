import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import UnitHub from "../pages/UnitHub";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "number" in opts) return `${key}:${opts.number}`;
      if (opts && "count" in opts) return `${key}:${opts.count}`;
      return key;
    },
    i18n: mockI18n,
  }),
}));

const heroMockState = { withImage: false };
vi.mock("../data/getUnit", async () => {
  const actual = await vi.importActual<typeof import("../data/getUnit")>("../data/getUnit");
  return {
    ...actual,
    getUnit: (slug: string) => {
      const real = actual.getUnit(slug);
      if (slug === "unit-1" && real && heroMockState.withImage) {
        return { ...real, imageUrl: "https://example.com/hero.png" };
      }
      return real;
    },
  };
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/lessons/:unitSlug" element={<UnitHub />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("UnitHub header", () => {
  beforeEach(() => {
    mockI18n.language = "en";
  });

  it("renders English topic and grammarFocus by default", () => {
    renderAt("/lessons/unit-1");
    expect(screen.getByText("Personal information & meeting people")).toBeInTheDocument();
    expect(screen.getByText("Present tense of 'to be' (am / is / are)")).toBeInTheDocument();
  });

  it("renders Thai topic and grammarFocus when language is th", () => {
    mockI18n.language = "th";
    renderAt("/lessons/unit-1");
    expect(screen.getByText("ข้อมูลส่วนตัวและการพบปะผู้คน")).toBeInTheDocument();
    expect(screen.getByText("กาลปัจจุบันของ 'to be' (am / is / are)")).toBeInTheDocument();
  });
});

describe("UnitHub unit hero image", () => {
  beforeEach(() => {
    mockI18n.language = "en";
    heroMockState.withImage = false;
  });

  it("renders a hero image when unit.imageUrl is set", () => {
    heroMockState.withImage = true;
    const { container } = renderAt("/lessons/unit-1");
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toBe("https://example.com/hero.png");
  });

  it("does not render a hero image when unit.imageUrl is undefined", () => {
    heroMockState.withImage = false;
    const { container } = renderAt("/lessons/unit-1");
    expect(container.querySelector("img")).toBeNull();
  });
});
