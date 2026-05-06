import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReviewSessionSummary from "../components/ReviewSessionSummary";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "defaultValue" in opts) return opts.defaultValue as string;
      return key;
    },
  }),
}));

function renderSummary(result = { total: 10, correct: 8, incorrect: 2, skipped: 0 }, onPracticeAhead?: () => void) {
  return render(
    <MemoryRouter>
      <ReviewSessionSummary result={result} onPracticeAhead={onPracticeAhead} />
    </MemoryRouter>
  );
}

describe("ReviewSessionSummary", () => {
  it("shows heading", () => {
    renderSummary();
    expect(screen.getByText("Review complete!")).toBeInTheDocument();
  });

  it("shows accuracy percentage", () => {
    renderSummary({ total: 10, correct: 8, incorrect: 2, skipped: 0 });
    expect(screen.getByText("80% accuracy")).toBeInTheDocument();
  });

  it("shows correct, incorrect, and total counts", () => {
    renderSummary();
    expect(screen.getByText("8")).toBeInTheDocument(); // correct
    expect(screen.getByText("2")).toBeInTheDocument(); // incorrect
    expect(screen.getByText("10")).toBeInTheDocument(); // total
  });

  it("shows Back to Dashboard link", () => {
    renderSummary();
    expect(screen.getByRole("link", { name: /back to dashboard/i })).toBeInTheDocument();
  });

  it("shows Practice ahead button when callback provided", () => {
    const fn = vi.fn();
    renderSummary(undefined, fn);
    expect(screen.getByRole("button", { name: /practice ahead/i })).toBeInTheDocument();
  });

  it("clicking Practice ahead calls the callback", () => {
    const fn = vi.fn();
    renderSummary(undefined, fn);
    fireEvent.click(screen.getByRole("button", { name: /practice ahead/i }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it("does not show Practice ahead button when no callback", () => {
    renderSummary();
    expect(screen.queryByRole("button", { name: /practice ahead/i })).not.toBeInTheDocument();
  });

  it("shows 100% accuracy when all correct", () => {
    renderSummary({ total: 5, correct: 5, incorrect: 0, skipped: 0 });
    expect(screen.getByText("100% accuracy")).toBeInTheDocument();
  });

  it("shows 0% accuracy when total is 0 (no crash)", () => {
    renderSummary({ total: 0, correct: 0, incorrect: 0, skipped: 0 });
    expect(screen.getByText("0% accuracy")).toBeInTheDocument();
  });
});
