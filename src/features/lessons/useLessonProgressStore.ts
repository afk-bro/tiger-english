// src/features/lessons/useLessonProgressStore.ts
import { create } from "zustand";
import type { SectionKey, SectionMeta } from "./lesson.types";

export type SectionProgress = {
  visited: boolean;
  completed: boolean;
};

type LessonProgressState = {
  progress: Record<string, SectionProgress>;
  lastVisitedSectionKey: Partial<Record<string, SectionKey>>;

  markVisited: (unitSlug: string, sectionKey: SectionKey) => void;
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

    toggleCompleted: (unitSlug, sectionKey) => {
      const key = makeKey(unitSlug, sectionKey);
      set((state) => {
        const current = state.progress[key] ?? DEFAULT_PROGRESS;
        return {
          progress: {
            ...state.progress,
            [key]: { ...current, completed: !current.completed },
          },
        };
      });
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
