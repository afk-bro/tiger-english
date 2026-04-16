// src/features/lessons/__tests__/useLessonProgressStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useLessonProgressStore } from "../useLessonProgressStore";

describe("useLessonProgressStore", () => {
  beforeEach(() => {
    useLessonProgressStore.setState({
      progress: {},
      lastVisitedSectionKey: {},
    });
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
      { key: "overview" as const, title: "Overview", estimatedMinutes: 3 },
      { key: "grammar" as const, title: "Grammar", estimatedMinutes: 8 },
      { key: "vocabulary" as const, title: "Vocabulary", estimatedMinutes: 5 },
      { key: "dialogues" as const, title: "Dialogues", estimatedMinutes: 6 },
      { key: "activities" as const, title: "Activities", estimatedMinutes: 8 },
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
});
