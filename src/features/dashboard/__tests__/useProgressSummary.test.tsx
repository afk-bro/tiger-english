import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const getSummaryMock = vi.fn();
vi.mock("@/lib/api/progress", () => ({
  ProgressAPI: { getSummary: () => getSummaryMock() },
}));

beforeEach(() => {
  getSummaryMock.mockReset();
});

const sampleSummary = {
  sections_completed: [],
  exercise_attempts: { total: 0, correct: 0 },
  flashcards: { reviewed_total: 0, currently_known: 0 },
  streak: { current_days: 0 },
  study_days_this_week: 0,
  last_active_at: null,
  activity: {
    lessons_completed: 0, exercises_attempted: 0, exercises_correct: 0,
    flashcards_reviewed: 0, flashcards_mastered: 0,
  },
};

describe("useProgressSummary", () => {
  it("transitions from loading to data on success", async () => {
    getSummaryMock.mockResolvedValue(sampleSummary);
    const { useProgressSummary } = await import("../useProgressSummary");

    const { result } = renderHook(() => useProgressSummary());
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(sampleSummary);
    expect(result.current.error).toBeNull();
  });

  it("transitions from loading to error on failure", async () => {
    getSummaryMock.mockRejectedValue(new Error("boom"));
    const { useProgressSummary } = await import("../useProgressSummary");

    const { result } = renderHook(() => useProgressSummary());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toBeNull();
  });

  it("handles anonymous user (getSummary returns null)", async () => {
    getSummaryMock.mockResolvedValue(null);
    const { useProgressSummary } = await import("../useProgressSummary");

    const { result } = renderHook(() => useProgressSummary());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
