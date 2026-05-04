// src/features/lessons/useLessonProgressStore.ts
import { create } from "zustand";
import { ProgressAPI } from "@/lib/api/progress";
import type { SectionKey, SectionMeta } from "./lesson.types";

export type SectionProgress = {
  visited: boolean;
  completed: boolean;
};

type LessonProgressState = {
  progress: Record<string, SectionProgress>;
  lastVisitedSectionKey: Partial<Record<string, SectionKey>>;

  markVisited: (unitSlug: string, sectionKey: SectionKey) => void;
  markCompleted: (unitSlug: string, sectionKey: SectionKey) => void;
  toggleCompleted: (unitSlug: string, sectionKey: SectionKey) => void;
  setLastVisited: (unitSlug: string, sectionKey: SectionKey) => void;
  getSectionProgress: (
    unitSlug: string,
    sectionKey: SectionKey,
  ) => SectionProgress;
  getUnitCompletionPercent: (
    unitSlug: string,
    sections: SectionMeta[],
  ) => number;
};

const DEFAULT_PROGRESS: SectionProgress = {
  visited: false,
  completed: false,
};

function makeKey(unitSlug: string, sectionKey: SectionKey): string {
  return `${unitSlug}:${sectionKey}`;
}

export const useLessonProgressStore = create<LessonProgressState>(
  (set, get) => ({
    progress: {},
    lastVisitedSectionKey: {},

    markVisited: (unitSlug, sectionKey) => {
      const key = makeKey(unitSlug, sectionKey);
      set((state) => ({
        progress: {
          ...state.progress,
          [key]: { ...DEFAULT_PROGRESS, ...state.progress[key], visited: true },
        },
      }));
    },

    markCompleted: (unitSlug, sectionKey) => {
      const key = makeKey(unitSlug, sectionKey);
      set((state) => {
        const current = state.progress[key] ?? DEFAULT_PROGRESS;
        if (current.completed) return state;
        return {
          progress: {
            ...state.progress,
            [key]: { ...current, completed: true },
          },
        };
      });

      // Persist to backend (fire-and-forget; errors logged inside ProgressAPI)
      void ProgressAPI.completeSection({ unitSlug, sectionKey });
    },

    toggleCompleted: (unitSlug, sectionKey) => {
      const key = makeKey(unitSlug, sectionKey);
      let nowCompleted = false;
      set((state) => {
        const current = state.progress[key] ?? DEFAULT_PROGRESS;
        nowCompleted = !current.completed;
        return {
          progress: {
            ...state.progress,
            [key]: { ...current, completed: nowCompleted },
          },
        };
      });

      // Persist forward edge only — the backend's /complete-section endpoint
      // is idempotent but has no uncomplete counterpart, so toggling
      // true→false stays local-only and the user's prior backend completion
      // remains. Full fix would need an uncomplete endpoint; this matches
      // the established markCompleted pattern (also fire-and-forget).
      if (nowCompleted) {
        void ProgressAPI.completeSection({ unitSlug, sectionKey });
      }
    },

    setLastVisited: (unitSlug, sectionKey) => {
      set((state) => ({
        lastVisitedSectionKey: {
          ...state.lastVisitedSectionKey,
          [unitSlug]: sectionKey,
        },
      }));
    },

    getSectionProgress: (unitSlug, sectionKey) => {
      const key = makeKey(unitSlug, sectionKey);
      return get().progress[key] ?? DEFAULT_PROGRESS;
    },

    getUnitCompletionPercent: (unitSlug, sections) => {
      if (sections.length === 0) return 0;
      const completed = sections.filter(
        (s) => get().getSectionProgress(unitSlug, s.key).completed,
      ).length;
      return Math.round((completed / sections.length) * 100);
    },
  }),
);
