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
