import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CalloutBlock from "../components/blocks/CalloutBlock";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}));

describe("CalloutBlock", () => {
  it("renders English content by default for each variant", () => {
    mockI18n.language = "en";
    const { rerender } = render(<CalloutBlock variant="tip" content="Helpful tip." />);
    expect(screen.getByText("Helpful tip.")).toBeInTheDocument();

    rerender(<CalloutBlock variant="note" content="A note." />);
    expect(screen.getByText("A note.")).toBeInTheDocument();

    rerender(<CalloutBlock variant="warning" content="Be careful." />);
    expect(screen.getByText("Be careful.")).toBeInTheDocument();
  });

  it("renders learner-language translation when provided", () => {
    mockI18n.language = "zh";
    render(
      <CalloutBlock
        variant="tip"
        content="Helpful tip."
        translations={{ "zh-CN": "有用的提示。" }}
      />,
    );
    expect(screen.getByText("有用的提示。")).toBeInTheDocument();
  });

  it("falls back to English when translation is missing", () => {
    mockI18n.language = "vi";
    render(
      <CalloutBlock
        variant="tip"
        content="Helpful tip."
        translations={{ th: "เคล็ดลับ" }}
      />,
    );
    expect(screen.getByText("Helpful tip.")).toBeInTheDocument();
  });

  it("falls back to English when learner translation is an empty string", () => {
    mockI18n.language = "th";
    render(
      <CalloutBlock variant="tip" content="Helpful tip." translations={{ th: "" }} />,
    );
    expect(screen.getByText("Helpful tip.")).toBeInTheDocument();
  });
});
