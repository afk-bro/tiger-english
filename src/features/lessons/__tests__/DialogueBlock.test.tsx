import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DialogueBlock from "../components/blocks/DialogueBlock";
import type { DialogueLine } from "../lesson.types";

const mockLanguage = { current: "th" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: mockLanguage.current },
  }),
}));

const lines: DialogueLine[] = [
  { id: "d1", speaker: "Anna", text: "Hello!", translations: { th: "สวัสดี!" } },
  { id: "d2", speaker: "Somchai", text: "Hi Anna.", translations: { th: "สวัสดีอันนา" } },
];

describe("DialogueBlock", () => {
  beforeEach(() => {
    mockLanguage.current = "th";
  });

  it("shows speaker, English text, and Thai translation", () => {
    render(<DialogueBlock lines={lines} />);
    expect(screen.getByText("Anna")).toBeInTheDocument();
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.getByText("สวัสดี!")).toBeInTheDocument();
  });

  it("omits translation when missing for learner language", () => {
    mockLanguage.current = "zh-CN";
    render(<DialogueBlock lines={lines} />);
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.queryByText("สวัสดี!")).not.toBeInTheDocument();
  });

  it("shows English-only for unsupported language", () => {
    mockLanguage.current = "en";
    render(<DialogueBlock lines={lines} />);
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.queryByText("สวัสดี!")).not.toBeInTheDocument();
  });

  it("renders a banner <img> above the lines when imageUrl is provided", () => {
    const { container } = render(<DialogueBlock lines={[]} imageUrl="https://example.com/d.png" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "https://example.com/d.png");
  });

  it("does not render an <img> when imageUrl is undefined", () => {
    const { container } = render(<DialogueBlock lines={[]} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders alt='' (decorative) when imageAlt is not provided", () => {
    const { container } = render(<DialogueBlock lines={[]} imageUrl="https://example.com/d.png" />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("alt", "");
  });

  it("uses imageAlt when provided so the image is described, not skipped", () => {
    const { container } = render(
      <DialogueBlock
        lines={[]}
        imageUrl="https://example.com/d.png"
        imageAlt="Two friends greeting each other on a busy street"
      />,
    );
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("alt", "Two friends greeting each other on a busy street");
  });
});
