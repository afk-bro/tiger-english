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
  blocks: [
    { id: "b1", type: "heading", content: "Test Heading" },
    { id: "b2", type: "text", content: "Some paragraph text." },
    { id: "b3", type: "examples", items: [{ id: "test-ex", english: "Hello", translations: { th: "สวัสดี" } }] },
    { id: "b4", type: "callout", variant: "tip", content: "A helpful tip." },
    { id: "b5", type: "text", content: "Greetings.", translations: { th: "ทักทาย" } },
    { id: "b6", type: "heading", content: "Welcome.", translations: { th: "ยินดีต้อนรับ" } },
    { id: "b7", type: "callout", variant: "note", content: "Remember.", translations: { th: "จดจำ" } },
  ],
};

describe("SectionRenderer", () => {
  it("renders heading blocks", () => {
    render(<SectionRenderer section={testSection} unitSlug="unit-1" sectionKey="overview" />);
    expect(screen.getByText("Test Heading")).toBeInTheDocument();
  });

  it("renders text blocks", () => {
    render(<SectionRenderer section={testSection} unitSlug="unit-1" sectionKey="overview" />);
    expect(screen.getByText("Some paragraph text.")).toBeInTheDocument();
  });

  it("renders example items", () => {
    render(<SectionRenderer section={testSection} unitSlug="unit-1" sectionKey="overview" />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("สวัสดี")).toBeInTheDocument();
  });

  it("renders callout blocks", () => {
    render(<SectionRenderer section={testSection} unitSlug="unit-1" sectionKey="overview" />);
    expect(screen.getByText("A helpful tip.")).toBeInTheDocument();
  });

  it("passes translations to text blocks (integration with TextBlock)", () => {
    render(<SectionRenderer section={testSection} unitSlug="unit-1" sectionKey="overview" />);
    expect(screen.getByText("ทักทาย")).toBeInTheDocument();
    expect(screen.queryByText("Greetings.")).not.toBeInTheDocument();
  });

  it("passes translations to heading blocks (integration with HeadingBlock)", () => {
    render(<SectionRenderer section={testSection} unitSlug="unit-1" sectionKey="overview" />);
    expect(screen.getByText("ยินดีต้อนรับ")).toBeInTheDocument();
    expect(screen.queryByText("Welcome.")).not.toBeInTheDocument();
  });

  it("passes translations to callout blocks (integration with CalloutBlock)", () => {
    render(<SectionRenderer section={testSection} unitSlug="unit-1" sectionKey="overview" />);
    expect(screen.getByText("จดจำ")).toBeInTheDocument();
    expect(screen.queryByText("Remember.")).not.toBeInTheDocument();
  });

  it("renders an <img> in an exercise block when block.imageUrl is set", () => {
    const section: Section = {
      id: "test", unitSlug: "unit-1", key: "activities",
      blocks: [
        { id: "ex1", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u1-grammar-mcq-1", imageUrl: "https://example.com/e.png" },
      ],
    };
    const { container } = render(<SectionRenderer section={section} unitSlug="unit-1" sectionKey="activities" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "https://example.com/e.png");
  });
});
