// src/stores/useSidebarStore.ts
import { create } from "zustand";

const LS_KEY = "sidebar_collapsed";

function readPersistedCollapsed(): boolean {
  try {
    const value = localStorage.getItem(LS_KEY);
    if (value === 'true') return true;
    if (value === 'false') return false;
    return false; // absent or invalid
  } catch {
    return false;
  }
}

type SidebarStore = {
  collapsed: boolean;
  toggleCollapsed: () => void;
};

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  collapsed: readPersistedCollapsed(),
  toggleCollapsed: () => {
    const next = !get().collapsed;
    set({ collapsed: next });
    try {
      localStorage.setItem(LS_KEY, String(next));
    } catch {
      // ignore storage errors
    }
  },
}));
