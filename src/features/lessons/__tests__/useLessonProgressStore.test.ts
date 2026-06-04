// src/features/lessons/__tests__/useLessonProgressStore.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProgressAPI } from "@/lib/api/progress";
import {
  useLessonProgressStore,
  hydrateLessonProgressFromBackend,
  resetLessonProgress,
} from "../useLessonProgressStore";

vi.mock("@/lib/api/progress", () => ({
  ProgressAPI: {
    completeSection: vi.fn().mockResolvedValue(null),
    getSummary: vi.fn(),
  },
}));

describe("useLessonProgressStore", () => {
  beforeEach(() => {
    useLessonProgressStore.setState({
      progress: {},
      lastVisitedSectionKey: {},
    });
    vi.mocked(ProgressAPI.completeSection).mockClear();
  });

  it("returns default progress for unknown keys", () => {
    const result = useLessonProgressStore
      .getState()
      .getSectionProgress("unit-1", "overview");
    expect(result).toEqual({ visited: false, completed: false });
  });

  it("marks a section as visited", () => {
    useLessonProgressStore.getState().markVisited("unit-1", "overview");
    const result = useLessonProgressStore
      .getState()
      .getSectionProgress("unit-1", "overview");
    expect(result.visited).toBe(true);
    expect(result.completed).toBe(false);
  });

  it("marks completion idempotently", () => {
    const store = useLessonProgressStore.getState();
    store.markCompleted("unit-1", "grammar");
    expect(
      useLessonProgressStore.getState().getSectionProgress("unit-1", "grammar")
        .completed,
    ).toBe(true);

    useLessonProgressStore.getState().markCompleted("unit-1", "grammar");
    expect(
      useLessonProgressStore.getState().getSectionProgress("unit-1", "grammar")
        .completed,
    ).toBe(true);
  });

  it("toggles completion on and off", () => {
    const store = useLessonProgressStore.getState();
    store.toggleCompleted("unit-1", "grammar");
    expect(
      useLessonProgressStore.getState().getSectionProgress("unit-1", "grammar")
        .completed,
    ).toBe(true);

    useLessonProgressStore.getState().toggleCompleted("unit-1", "grammar");
    expect(
      useLessonProgressStore.getState().getSectionProgress("unit-1", "grammar")
        .completed,
    ).toBe(false);
  });

  it("persists toggleCompleted on forward edge only", () => {
    const store = useLessonProgressStore.getState();

    // false → true should call the API
    store.toggleCompleted("unit-1", "grammar");
    expect(ProgressAPI.completeSection).toHaveBeenCalledTimes(1);
    expect(ProgressAPI.completeSection).toHaveBeenCalledWith({
      unitSlug: "unit-1",
      sectionKey: "grammar",
    });

    // true → false should NOT call the API (no uncomplete endpoint)
    useLessonProgressStore.getState().toggleCompleted("unit-1", "grammar");
    expect(ProgressAPI.completeSection).toHaveBeenCalledTimes(1);
  });

  it("persists markCompleted via ProgressAPI.completeSection", () => {
    useLessonProgressStore.getState().markCompleted("unit-1", "vocabulary");
    expect(ProgressAPI.completeSection).toHaveBeenCalledWith({
      unitSlug: "unit-1",
      sectionKey: "vocabulary",
    });
  });

  it("does not re-persist markCompleted when section is already complete", () => {
    const store = useLessonProgressStore.getState();
    store.markCompleted("unit-1", "vocabulary");
    store.markCompleted("unit-1", "vocabulary");
    store.markCompleted("unit-1", "vocabulary");
    // Three .markCompleted calls but only the first should hit the network —
    // backend /complete-section is idempotent but duplicate calls are wasteful.
    expect(ProgressAPI.completeSection).toHaveBeenCalledTimes(1);
  });

  it("sets and retrieves lastVisitedSectionKey", () => {
    useLessonProgressStore.getState().setLastVisited("unit-1", "vocabulary");
    expect(
      useLessonProgressStore.getState().lastVisitedSectionKey["unit-1"],
    ).toBe("vocabulary");
  });

  it("overwrites lastVisitedSectionKey on subsequent visits", () => {
    const store = useLessonProgressStore.getState();
    store.setLastVisited("unit-1", "overview");
    useLessonProgressStore.getState().setLastVisited("unit-1", "grammar");
    expect(
      useLessonProgressStore.getState().lastVisitedSectionKey["unit-1"],
    ).toBe("grammar");
  });

  it("calculates unit completion percent", () => {
    const sections = [
      { key: "overview" as const, estimatedMinutes: 3 },
      { key: "grammar" as const, estimatedMinutes: 8 },
      { key: "vocabulary" as const, estimatedMinutes: 5 },
      { key: "dialogues" as const, estimatedMinutes: 6 },
      { key: "activities" as const, estimatedMinutes: 8 },
    ];

    // 0 of 5 completed
    expect(
      useLessonProgressStore
        .getState()
        .getUnitCompletionPercent("unit-1", sections),
    ).toBe(0);

    // 2 of 5 completed = 40%
    useLessonProgressStore.getState().toggleCompleted("unit-1", "overview");
    useLessonProgressStore.getState().toggleCompleted("unit-1", "grammar");
    expect(
      useLessonProgressStore
        .getState()
        .getUnitCompletionPercent("unit-1", sections),
    ).toBe(40);
  });

  it("hydrateCompletedSections marks given sections complete, preserving other state", () => {
    const store = useLessonProgressStore.getState();
    store.markVisited("unit-1", "overview"); // visited but not completed

    store.hydrateCompletedSections([
      { unitSlug: "unit-1", sectionKey: "overview" },
      { unitSlug: "unit-1", sectionKey: "grammar" },
    ]);

    const s = useLessonProgressStore.getState();
    // overview: visited preserved, completed added
    expect(s.getSectionProgress("unit-1", "overview")).toEqual({
      visited: true,
      completed: true,
    });
    // grammar: newly created, completed
    expect(s.getSectionProgress("unit-1", "grammar")).toEqual({
      visited: false,
      completed: true,
    });
    // untouched section stays default
    expect(s.getSectionProgress("unit-1", "vocabulary")).toEqual({
      visited: false,
      completed: false,
    });
  });

  it("hydrateCompletedSections never clobbers an in-session completion", () => {
    useLessonProgressStore.getState().markCompleted("unit-1", "overview");
    // Backend returns nothing for this section — must not un-complete it.
    useLessonProgressStore.getState().hydrateCompletedSections([]);
    expect(
      useLessonProgressStore.getState().getSectionProgress("unit-1", "overview")
        .completed,
    ).toBe(true);
  });
});

describe("hydrateLessonProgressFromBackend", () => {
  beforeEach(() => {
    useLessonProgressStore.setState({ progress: {}, lastVisitedSectionKey: {} });
    vi.mocked(ProgressAPI.getSummary).mockReset();
  });

  it("populates the store from the backend summary's sections_completed", async () => {
    vi.mocked(ProgressAPI.getSummary).mockResolvedValue({
      sections_completed: [
        { unit_slug: "unit-1", section_key: "overview", completed_at: "x" },
        { unit_slug: "unit-1", section_key: "grammar", completed_at: "x" },
      ],
    } as never);

    await hydrateLessonProgressFromBackend();

    const s = useLessonProgressStore.getState();
    expect(s.getSectionProgress("unit-1", "overview").completed).toBe(true);
    expect(s.getSectionProgress("unit-1", "grammar").completed).toBe(true);
  });

  it("is a no-op when there is no session (getSummary resolves null)", async () => {
    vi.mocked(ProgressAPI.getSummary).mockResolvedValue(null as never);
    await hydrateLessonProgressFromBackend();
    expect(useLessonProgressStore.getState().progress).toEqual({});
  });

  it("degrades silently when getSummary throws", async () => {
    vi.mocked(ProgressAPI.getSummary).mockRejectedValue(new Error("500"));
    await expect(hydrateLessonProgressFromBackend()).resolves.toBeUndefined();
    expect(useLessonProgressStore.getState().progress).toEqual({});
  });

  it("discards a result that resolves after a reset (no cross-user leakage)", async () => {
    // Summary fetch is in-flight when the user signs out.
    let resolveSummary!: (v: unknown) => void;
    vi.mocked(ProgressAPI.getSummary).mockReturnValue(
      new Promise((r) => { resolveSummary = r; }) as never,
    );
    const inFlight = hydrateLessonProgressFromBackend();

    // Sign-out happens before the fetch resolves.
    resetLessonProgress();

    // Now the previous user's summary lands — it must NOT repopulate the store.
    resolveSummary({
      sections_completed: [
        { unit_slug: "unit-1", section_key: "overview", completed_at: "x" },
      ],
    });
    await inFlight;

    expect(useLessonProgressStore.getState().progress).toEqual({});
  });

  it("ignores section keys that aren't real sections", async () => {
    vi.mocked(ProgressAPI.getSummary).mockResolvedValue({
      sections_completed: [
        { unit_slug: "unit-1", section_key: "overview", completed_at: "x" },
        { unit_slug: "unit-1", section_key: "bogus-section", completed_at: "x" },
      ],
    } as never);

    await hydrateLessonProgressFromBackend();

    const s = useLessonProgressStore.getState();
    expect(s.getSectionProgress("unit-1", "overview").completed).toBe(true);
    // The unknown key must not have been written into the store.
    expect(s.progress["unit-1:bogus-section"]).toBeUndefined();
  });
});

describe("resetLessonProgress", () => {
  it("clears all progress (e.g. on sign-out) so it can't leak between users", () => {
    useLessonProgressStore.getState().markCompleted("unit-1", "overview");
    useLessonProgressStore.getState().setLastVisited("unit-1", "overview");

    resetLessonProgress();

    expect(useLessonProgressStore.getState().progress).toEqual({});
    expect(useLessonProgressStore.getState().lastVisitedSectionKey).toEqual({});
  });
});
