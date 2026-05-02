import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TextBlock from "../components/blocks/TextBlock";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}));

describe("TextBlock", () => {
  it("renders English content by default", () => {
    mockI18n.language = "en";
    render(<TextBlock content="Hello, world." />);
    expect(screen.getByText("Hello, world.")).toBeInTheDocument();
  });

  it("renders the learner-language translation when available", () => {
    mockI18n.language = "th";
    render(
      <TextBlock
        content="Hello, world."
        translations={{ th: "สวัสดีชาวโลก", vi: "Xin chào" }}
      />,
    );
    expect(screen.getByText("สวัสดีชาวโลก")).toBeInTheDocument();
    expect(screen.queryByText("Hello, world.")).not.toBeInTheDocument();
  });

  it("falls back to English when translation is missing for the learner language", () => {
    mockI18n.language = "zh";
    render(
      <TextBlock
        content="Hello, world."
        translations={{ th: "สวัสดีชาวโลก" }}
      />,
    );
    expect(screen.getByText("Hello, world.")).toBeInTheDocument();
  });

  it("falls back to English when learner translation is an empty string", () => {
    mockI18n.language = "th";
    render(
      <TextBlock content="Hello, world." translations={{ th: "" }} />,
    );
    expect(screen.getByText("Hello, world.")).toBeInTheDocument();
  });
});
