import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "defaultValue" in opts) return opts.defaultValue as string;
      return key;
    },
    i18n: { language: "en" },
  }),
}));

vi.mock("@/stores/useUserStore", () => ({
  useUserStore: (sel: (s: { profile: null }) => unknown) =>
    sel({ profile: null }),
}));

vi.mock("@/features/lessons/utils/learnerLanguage", () => ({
  getLearnerLanguage: () => "en",
}));

const mockCorrect = vi.fn();
vi.mock("@/lib/api/aiTutor", () => ({
  aiTutorAPI: { correct: (...args: unknown[]) => mockCorrect(...args) },
}));

const { default: CorrectTab } = await import(
  "@/features/ai-tutor/components/CorrectTab"
);

function renderTab() {
  return render(
    <MemoryRouter>
      <CorrectTab />
    </MemoryRouter>
  );
}

const CORRECTION = {
  original: "I go to market yesterday",
  corrected: "I went to the market yesterday.",
  explanation: "Use past simple.",
  explanation_l1: "Use past simple.",
  try_again_prompt: "Yesterday I ___ to the market.",
  try_again_answer: "went",
};

describe("CorrectTab", () => {
  beforeEach(() => {
    mockCorrect.mockReset();
  });

  it("renders sentence textarea and submit button", () => {
    renderTab();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /correct/i })).toBeInTheDocument();
  });

  it("submit is disabled when sentence is empty", () => {
    renderTab();
    expect(screen.getByRole("button", { name: /correct/i })).toBeDisabled();
  });

  it("shows 4 result blocks on successful correction", async () => {
    mockCorrect.mockResolvedValue(CORRECTION);
    renderTab();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "I go to market yesterday" },
    });
    fireEvent.click(screen.getByRole("button", { name: /correct/i }));

    await waitFor(() => {
      expect(screen.getByText("Your sentence")).toBeInTheDocument();
      expect(screen.getByText("Better sentence")).toBeInTheDocument();
      expect(screen.getByText("Why")).toBeInTheDocument();
      expect(screen.getByText("Try again")).toBeInTheDocument();
    });
  });

  it("shows the try-again fill-in input", async () => {
    mockCorrect.mockResolvedValue(CORRECTION);
    renderTab();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "I go to market yesterday" },
    });
    fireEvent.click(screen.getByRole("button", { name: /correct/i }));

    await waitFor(() => {
      // The try-again input (aria-label = "Try again")
      const inputs = screen.getAllByRole("textbox");
      expect(inputs.length).toBeGreaterThan(1);
    });
  });

  it("reveals answer on Check button click", async () => {
    mockCorrect.mockResolvedValue(CORRECTION);
    renderTab();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "I go to market yesterday" },
    });
    fireEvent.click(screen.getByRole("button", { name: /correct/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /check/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /check/i }));
    expect(screen.getByText(/Answer/)).toBeInTheDocument();
    expect(screen.getByText("went")).toBeInTheDocument();
  });

  it("shows disabled notice when AI is off", async () => {
    mockCorrect.mockResolvedValue({ code: "ai_disabled", message: "no key" });
    renderTab();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "I go market" },
    });
    fireEvent.click(screen.getByRole("button", { name: /correct/i }));

    await waitFor(() => {
      expect(screen.getByText(/AI Tutor is not available/i)).toBeInTheDocument();
    });
  });
});
