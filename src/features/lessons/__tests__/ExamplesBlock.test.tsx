import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ExamplesBlock from "../components/blocks/ExamplesBlock";
import type { ExampleItem } from "../lesson.types";

const mockLanguage = { current: "th" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: mockLanguage.current },
  }),
}));

const items: ExampleItem[] = [
  { id: "e1", english: "I am happy.", translations: { th: "ฉันมีความสุข", vi: "Tôi vui." } },
  { id: "e2", english: "She is a teacher.", translations: { th: "เธอเป็นครู" } },
];

describe("ExamplesBlock", () => {
  beforeEach(() => {
    mockLanguage.current = "th";
  });

  it("shows English text and Thai translation", () => {
    render(<ExamplesBlock items={items} />);
    expect(screen.getByText("I am happy.")).toBeInTheDocument();
    expect(screen.getByText("ฉันมีความสุข")).toBeInTheDocument();
  });

  it("shows Vietnamese translation when language is vi", () => {
    mockLanguage.current = "vi";
    render(<ExamplesBlock items={items} />);
    expect(screen.getByText("Tôi vui.")).toBeInTheDocument();
  });

  it("omits translation line when missing for learner language", () => {
    mockLanguage.current = "zh-CN";
    render(<ExamplesBlock items={items} />);
    expect(screen.getByText("I am happy.")).toBeInTheDocument();
    expect(screen.queryByText("ฉันมีความสุข")).not.toBeInTheDocument();
  });

  it("shows English-only mode for unsupported language", () => {
    mockLanguage.current = "en";
    render(<ExamplesBlock items={items} />);
    expect(screen.getByText("I am happy.")).toBeInTheDocument();
    expect(screen.queryByText("ฉันมีความสุข")).not.toBeInTheDocument();
  });
});
