import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SectionCard from "../components/SectionCard";
import type { SectionMeta } from "../lesson.types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "count" in opts) return `${key}:${opts.count}`;
      return key;
    },
    i18n: { language: "en" },
  }),
}));

const section: SectionMeta = { key: "grammar", title: "Grammar", estimatedMinutes: 8 };

describe("SectionCard", () => {
  it("renders the i18n section key instead of section.title", () => {
    render(
      <MemoryRouter>
        <SectionCard
          section={section}
          unitSlug="unit-1"
          progress={{ visited: false, completed: false }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("lessons.detail.sections.grammar")).toBeInTheDocument();
    expect(screen.queryByText("Grammar")).not.toBeInTheDocument();
  });
});
