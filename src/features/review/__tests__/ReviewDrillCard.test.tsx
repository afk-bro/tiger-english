import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReviewDrillCard from "../components/ReviewDrillCard";
import type { ReviewItem } from "../review.types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "defaultValue" in opts) return opts.defaultValue as string;
      if (opts && "current" in opts && "total" in opts) return `${opts.current} / ${opts.total}`;
      return key;
    },
  }),
}));

const ITEM: ReviewItem = {
  id: "item-1",
  item_type: "word",
  prompt: "What is the past tense of 'go'?",
  answer: "went",
  translation: "past tense",
  note: "Irregular verb",
  ease_factor: 2.5,
  interval_days: 1,
  streak_correct: 0,
  next_review_at: "2026-05-06T00:00:00Z",
};

function renderCard(onRate = vi.fn()) {
  return render(
    <MemoryRouter>
      <ReviewDrillCard item={ITEM} index={0} total={10} onRate={onRate} />
    </MemoryRouter>
  );
}

describe("ReviewDrillCard", () => {
  it("shows the prompt", () => {
    renderCard();
    expect(screen.getByText("What is the past tense of 'go'?")).toBeInTheDocument();
  });

  it("shows progress as '1 / 10'", () => {
    renderCard();
    expect(screen.getByText("1 / 10")).toBeInTheDocument();
  });

  it("shows the input field and Submit button in input phase", () => {
    renderCard();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("Submit is disabled when answer is empty", () => {
    renderCard();
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
  });

  it("revealing the answer shows difficulty buttons", () => {
    renderCard();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "went" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(screen.getByRole("button", { name: /incorrect/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /difficult/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /got it/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /easy/i })).toBeInTheDocument();
  });

  it("correct answer shows checkmark and no 'Correct answer' block", () => {
    renderCard();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "went" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    // The "Correct answer" block only shows for wrong answers
    expect(screen.queryByText("Correct answer")).not.toBeInTheDocument();
  });

  it("wrong answer shows 'Correct answer' block with the right answer", () => {
    renderCard();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "goed" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(screen.getByText("Correct answer")).toBeInTheDocument();
    expect(screen.getByText("went")).toBeInTheDocument();
  });

  it("note is shown after reveal", () => {
    renderCard();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "went" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(screen.getByText("Irregular verb")).toBeInTheDocument();
  });

  it("clicking 'Got it' calls onRate('got_it')", () => {
    const onRate = vi.fn();
    renderCard(onRate);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "went" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    fireEvent.click(screen.getByRole("button", { name: /got it/i }));
    expect(onRate).toHaveBeenCalledWith("got_it");
  });

  it("clicking 'Easy' calls onRate('easy')", () => {
    const onRate = vi.fn();
    renderCard(onRate);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "went" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    fireEvent.click(screen.getByRole("button", { name: /easy/i }));
    expect(onRate).toHaveBeenCalledWith("easy");
  });

  it("clicking 'Incorrect' calls onRate('incorrect')", () => {
    const onRate = vi.fn();
    renderCard(onRate);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "goed" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    fireEvent.click(screen.getByRole("button", { name: /incorrect/i }));
    expect(onRate).toHaveBeenCalledWith("incorrect");
  });
});
