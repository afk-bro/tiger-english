import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UnitCard from "../components/UnitCard";
import type { Unit } from "../lesson.types";

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

const unit: Unit = {
  slug: "unit-1",
  number: 1,
  title: "To Be: Introduction",
  topic: "Personal information & meeting people",
  grammarFocus: "Present tense of 'to be' (am / is / are)",
  estimatedMinutes: 30,
  status: "available",
  sections: [],
  translations: {
    th: {
      title: "To Be: บทนำ",
      topic: "ข้อมูลส่วนตัวและการพบปะผู้คน",
      grammarFocus: "กาลปัจจุบันของ 'to be' (am / is / are)",
    },
  },
};

describe("UnitCard", () => {
  it("renders English by default", () => {
    mockI18n.language = "en";
    render(<MemoryRouter><UnitCard unit={unit} /></MemoryRouter>);
    expect(screen.getByText("To Be: Introduction")).toBeInTheDocument();
    expect(screen.getByText("Personal information & meeting people")).toBeInTheDocument();
    expect(screen.getByText("Present tense of 'to be' (am / is / are)")).toBeInTheDocument();
  });

  it("renders Thai when learner language is th", () => {
    mockI18n.language = "th";
    render(<MemoryRouter><UnitCard unit={unit} /></MemoryRouter>);
    expect(screen.getByText("To Be: บทนำ")).toBeInTheDocument();
    expect(screen.getByText("ข้อมูลส่วนตัวและการพบปะผู้คน")).toBeInTheDocument();
  });

  it("falls back to English when the learner translation is missing", () => {
    mockI18n.language = "vi";
    render(<MemoryRouter><UnitCard unit={unit} /></MemoryRouter>);
    expect(screen.getByText("To Be: Introduction")).toBeInTheDocument();
  });
});
