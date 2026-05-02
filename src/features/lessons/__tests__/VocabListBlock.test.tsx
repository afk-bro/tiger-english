import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VocabListBlock from "../components/blocks/VocabListBlock";
import type { VocabItem } from "../lesson.types";

const mockLanguage = { current: "th" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      const keys: Record<string, string> = {
        "lessons.vocab.revealAnswer": "Reveal answer",
        "lessons.vocab.flipToRevealAnswer": "Flip card to reveal answer",
        "lessons.vocab.flipBackToTranslation": "Flip card back to translation",
      };
      if (key === "lessons.vocab.flipToRevealEnglishFor" && opts?.nativeText) {
        return `Flip card to reveal English for ${opts.nativeText}`;
      }
      return keys[key] ?? key;
    },
    i18n: { language: mockLanguage.current },
  }),
}));

const items: VocabItem[] = [
  { id: "v1", word: "hello", phonetic: "heh-loh", translations: { th: "สวัสดี", vi: "xin chào", "zh-CN": "你好" } },
  { id: "v2", word: "name", phonetic: "neym", translations: { th: "ชื่อ" } },
];

describe("VocabListBlock", () => {
  beforeEach(() => {
    mockLanguage.current = "th";
  });

  it("shows native language word on front for Thai learner", () => {
    render(<VocabListBlock items={items} />);
    expect(screen.getByText("สวัสดี")).toBeInTheDocument();
    expect(screen.getByText("ชื่อ")).toBeInTheDocument();
  });

  it("shows English word and phonetic on back after flip", async () => {
    const user = userEvent.setup();
    render(<VocabListBlock items={items} />);
    await user.click(screen.getByText("สวัสดี").closest("button")!);
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("/heh-loh/")).toBeInTheDocument();
  });

  it("shows Vietnamese translation for Vietnamese learner", () => {
    mockLanguage.current = "vi";
    render(<VocabListBlock items={items} />);
    expect(screen.getByText("xin chào")).toBeInTheDocument();
  });

  it("shows zh-CN translation for Chinese learner", () => {
    mockLanguage.current = "zh-CN";
    render(<VocabListBlock items={items} />);
    expect(screen.getByText("你好")).toBeInTheDocument();
  });

  it("shows English word in muted style when translation missing", () => {
    mockLanguage.current = "zh-CN";
    render(<VocabListBlock items={[{ id: "v3", word: "test", translations: {} }]} />);
    const fallback = screen.getByText("test");
    expect(fallback).toBeInTheDocument();
    expect(fallback.className).toContain("opacity");
  });

  it("shows English-only mode for unsupported language", () => {
    mockLanguage.current = "en";
    render(<VocabListBlock items={items} />);
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.queryByText("สวัสดี")).not.toBeInTheDocument();
  });

  it("does not show example sentences", () => {
    render(<VocabListBlock items={items} />);
    expect(screen.queryByText(/how are you/i)).not.toBeInTheDocument();
  });

  it("shows 'Reveal answer' prompt", () => {
    render(<VocabListBlock items={items} />);
    expect(screen.getAllByText("Reveal answer").length).toBeGreaterThan(0);
  });

  it("renders an <img> on the front face when item.imageUrl is set", () => {
    const items = [
      { id: "v1", word: "classroom", translations: {}, imageUrl: "https://example.com/c.png" },
    ];
    render(<VocabListBlock items={items} />);
    const img = screen.getByRole("img", { name: "classroom" });
    expect(img).toHaveAttribute("src", "https://example.com/c.png");
  });

  it("does not render an <img> when item.imageUrl is undefined", () => {
    const items = [{ id: "v1", word: "classroom", translations: {} }];
    render(<VocabListBlock items={items} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
