// src/features/lessons/__tests__/SectionRenderer.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SectionRenderer from "../components/SectionRenderer";
import type { Section } from "../lesson.types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "th" },
  }),
}));

const testSection: Section = {
  id: "test",
  unitSlug: "unit-1",
  key: "overview",
  title: "Test Section",
  blocks: [
    { id: "b1", type: "heading", content: "Test Heading" },
    { id: "b2", type: "text", content: "Some paragraph text." },
    { id: "b3", type: "examples", items: [{ id: "test-ex", english: "Hello", translations: { th: "สวัสดี" } }] },
    { id: "b4", type: "callout", variant: "tip", content: "A helpful tip." },
    { id: "b5", type: "text", content: "Hello.", translations: { th: "สวัสดี" } },
  ],
};

describe("SectionRenderer", () => {
  it("renders heading blocks", () => {
    render(<SectionRenderer section={testSection} />);
    expect(screen.getByText("Test Heading")).toBeInTheDocument();
  });

  it("renders text blocks", () => {
    render(<SectionRenderer section={testSection} />);
    expect(screen.getByText("Some paragraph text.")).toBeInTheDocument();
  });

  it("renders example items", () => {
    render(<SectionRenderer section={testSection} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getAllByText("สวัสดี").length).toBeGreaterThanOrEqual(1);
  });

  it("renders callout blocks", () => {
    render(<SectionRenderer section={testSection} />);
    expect(screen.getByText("A helpful tip.")).toBeInTheDocument();
  });

  it("passes translations to text blocks (integration with TextBlock)", () => {
    render(<SectionRenderer section={testSection} />);
    // b5 text block should render the Thai translation, not the English fallback
    const instances = screen.getAllByText("สวัสดี");
    expect(instances.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Hello.")).not.toBeInTheDocument();
  });
});
