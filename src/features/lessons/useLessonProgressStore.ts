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
  hydrateCompletedSections: (
    sections: Array<{ unitSlug: string; sectionKey: SectionKey }>,
  ) => void;
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
      let didTransition = false;
      set((state) => {
        const current = state.progress[key] ?? DEFAULT_PROGRESS;
        if (current.completed) return state;
        didTransition = true;
        return {
          progress: {
            ...state.progress,
            [key]: { ...current, completed: true },
          },
        };
      });

      // Persist only on the not-completed → completed transition. The backend
      // /complete-section endpoint is idempotent (uses idempotency keys), so
      // duplicate calls are safe — but they're wasted network. Skip them.
      if (didTransition) {
        void ProgressAPI.completeSection({ unitSlug, sectionKey });
      }
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

    hydrateCompletedSections: (sections) => {
      if (sections.length === 0) return;
      set((state) => {
        const progress = { ...state.progress };
        for (const { unitSlug, sectionKey } of sections) {
          const key = makeKey(unitSlug, sectionKey);
          const current = progress[key] ?? DEFAULT_PROGRESS;
          // Only ever sets completed:true — never clobbers visited or an
          // in-session completion, so a hydrate/interaction race can't lose data.
          progress[key] = { ...current, completed: true };
        }
        return { progress };
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

/**
 * Load the user's completed sections from the backend into the store. The
 * store is otherwise in-memory only, so without this every reload forgets
 * completion — which means `allCompleted` (and the unit-complete celebration)
 * could only ever fire transiently within a single uninterrupted session.
 * Called on auth from AppInitializer, mirroring how the profile is hydrated.
 *
 * Fire-and-forget: writes still persist independently, so on failure we
 * degrade silently and the next load retries.
 */
export async function hydrateLessonProgressFromBackend(): Promise<void> {
  try {
    const summary = await ProgressAPI.getSummary();
    if (!summary) return; // no session
    useLessonProgressStore.getState().hydrateCompletedSections(
      summary.sections_completed.map((s) => ({
        unitSlug: s.unit_slug,
        sectionKey: s.section_key as SectionKey,
      })),
    );
  } catch {
    // Network/auth error — leave the store as-is; completion simply won't
    // pre-populate this session.
  }
}

/**
 * Clear all in-memory progress. Called on sign-out so one user's completion
 * can't leak into the next user's session on a shared browser.
 */
export function resetLessonProgress(): void {
  useLessonProgressStore.setState({ progress: {}, lastVisitedSectionKey: {} });
}
