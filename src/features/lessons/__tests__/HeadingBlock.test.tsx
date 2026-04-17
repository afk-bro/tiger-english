import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HeadingBlock from "../components/blocks/HeadingBlock";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}));

describe("HeadingBlock", () => {
  it("renders English by default", () => {
    mockI18n.language = "en";
    render(<HeadingBlock content="What you'll learn" />);
    expect(screen.getByRole("heading", { level: 2, name: "What you'll learn" })).toBeInTheDocument();
  });

  it("renders learner-language translation when provided", () => {
    mockI18n.language = "vi";
    render(
      <HeadingBlock
        content="What you'll learn"
        translations={{ vi: "Những gì bạn sẽ học" }}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Những gì bạn sẽ học" })).toBeInTheDocument();
  });

  it("falls back to English when translation is missing", () => {
    mockI18n.language = "th";
    render(
      <HeadingBlock
        content="What you'll learn"
        translations={{ vi: "Những gì bạn sẽ học" }}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "What you'll learn" })).toBeInTheDocument();
  });

  it("falls back to English when learner translation is an empty string", () => {
    mockI18n.language = "th";
    render(
      <HeadingBlock content="What you'll learn" translations={{ th: "" }} />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "What you'll learn" })).toBeInTheDocument();
  });
});
