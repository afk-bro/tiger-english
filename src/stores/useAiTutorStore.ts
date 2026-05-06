// src/stores/useAiTutorStore.ts
import { create } from "zustand";

export type AiTutorTab = "explain" | "correct" | "practice" | "writing-coach";

type AiTutorStore = {
  isOpen: boolean;
  activeTab: AiTutorTab;
  open: (tab?: AiTutorTab) => void;
  close: () => void;
  setTab: (tab: AiTutorTab) => void;
};

export const useAiTutorStore = create<AiTutorStore>((set) => ({
  isOpen: false,
  activeTab: "explain",
  open: (tab) =>
    set((state) => ({
      isOpen: true,
      activeTab: tab ?? state.activeTab,
    })),
  close: () => set({ isOpen: false }),
  setTab: (tab) => set({ activeTab: tab }),
}));
