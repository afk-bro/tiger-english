import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import MatchPairs from "../MatchPairs";
import type { MatchExercise } from "../exercises.types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
    i18n: { language: "en" },
  }),
}));

vi.mock("@/features/lessons/utils/useLocalizedContent", () => ({
  useLocalizedContent: (content: string) => content,
}));

vi.mock("@/lib/storageImage", () => ({
  srcSetFor: (url: string) => ({ src: url, srcSet: `${url} 1x, ${url} 2x` }),
}));

const exercise: MatchExercise = {
  id: "match-test-1",
  prompt: "Match each word to its picture.",
  pairs: [
    { id: "p-book", word: "book", fallback: "📖", imageAlt: "An open book" },
    { id: "p-pen", word: "pen", fallback: "🖊️", imageAlt: "A blue pen" },
    { id: "p-chair", word: "chair", fallback: "🪑", imageAlt: "A wooden chair" },
  ],
};

// Tests use fireEvent (synchronous) rather than userEvent because
// userEvent.click was hanging in this suite under React 19 + Vitest's
// jsdom environment, producing 5-second timeouts. Lookups still go via
// accessible name so shuffle nondeterminism is irrelevant.

describe("MatchPairs", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the prompt and one button per word + per image (2 columns)", () => {
    render(<MatchPairs exercise={exercise} />);
    expect(screen.getByText("Match each word to its picture.")).toBeInTheDocument();
    // Each pair contributes two tiles → 6 buttons total
    expect(screen.getAllByRole("button")).toHaveLength(6);
  });

  it("renders the fallback glyph when a pair has no imageUrl", () => {
    render(<MatchPairs exercise={exercise} />);
    expect(screen.getByText("📖")).toBeInTheDocument();
  });

  it("a correct match locks both tiles (disabled)", () => {
    render(<MatchPairs exercise={exercise} />);
    fireEvent.click(screen.getByRole("button", { name: "book" }));
    fireEvent.click(screen.getByRole("button", { name: "An open book" }));
    expect(screen.getByRole("button", { name: /book \(matched\)/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "An open book" })).toBeDisabled();
  });

  it("a wrong match reports onAttempt(false) once and clears selection after the flash timeout", () => {
    vi.useFakeTimers();
    const onAttempt = vi.fn();
    render(<MatchPairs exercise={exercise} onAttempt={onAttempt} />);

    fireEvent.click(screen.getByRole("button", { name: "book" }));
    fireEvent.click(screen.getByRole("button", { name: "A wooden chair" }));

    expect(onAttempt).toHaveBeenCalledWith(false);
    expect(onAttempt).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Tiles re-enable: user can try again
    expect(screen.getByRole("button", { name: "book" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "A wooden chair" })).not.toBeDisabled();
  });

  it("calls onCorrect once when every pair is matched", () => {
    const onAttempt = vi.fn();
    const onCorrect = vi.fn();
    render(<MatchPairs exercise={exercise} onAttempt={onAttempt} onCorrect={onCorrect} />);

    fireEvent.click(screen.getByRole("button", { name: "book" }));
    fireEvent.click(screen.getByRole("button", { name: "An open book" }));
    fireEvent.click(screen.getByRole("button", { name: "pen" }));
    fireEvent.click(screen.getByRole("button", { name: "A blue pen" }));
    fireEvent.click(screen.getByRole("button", { name: "chair" }));
    fireEvent.click(screen.getByRole("button", { name: "A wooden chair" }));

    expect(onCorrect).toHaveBeenCalledTimes(1);
    expect(onAttempt).toHaveBeenLastCalledWith(true);
  });

  it("toggling the same word twice deselects it", () => {
    render(<MatchPairs exercise={exercise} />);
    const bookBtn = screen.getByRole("button", { name: "book" });
    fireEvent.click(bookBtn);
    expect(bookBtn).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(bookBtn);
    expect(bookBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("the visible 'Not a match' message clears when the error flash ends", () => {
    // Regression guard: previously this row was tied to `feedback`,
    // which is only cleared on completion or reset, so the message
    // stuck around for the rest of the session after the first wrong
    // pair. It should now be tied to the transient `error` state.
    vi.useFakeTimers();
    render(<MatchPairs exercise={exercise} />);

    fireEvent.click(screen.getByRole("button", { name: "book" }));
    fireEvent.click(screen.getByRole("button", { name: "A wooden chair" }));

    expect(screen.getByText("Not a match — keep going.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByText("Not a match — keep going.")).not.toBeInTheDocument();
  });

  it("falls back to a word-interpolated aria-label when imageAlt is missing", () => {
    // Regression guard: previously every image with missing imageAlt
    // got the same fallback string ("Picture for matching"), making
    // tiles indistinguishable to screen readers. Now the fallback
    // interpolates the pair's word so each label is unique.
    const exerciseNoAlt: MatchExercise = {
      id: "match-no-alt",
      prompt: "Match.",
      pairs: [
        { id: "p1", word: "apple", fallback: "🍎" },
        { id: "p2", word: "banana", fallback: "🍌" },
      ],
    };
    render(<MatchPairs exercise={exerciseNoAlt} />);
    expect(screen.getByRole("button", { name: "Picture for apple" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Picture for banana" })).toBeInTheDocument();
  });
});
