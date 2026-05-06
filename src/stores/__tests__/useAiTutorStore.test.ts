import { describe, it, expect, beforeEach } from "vitest";
import { useAiTutorStore } from "@/stores/useAiTutorStore";

describe("useAiTutorStore", () => {
  beforeEach(() => {
    useAiTutorStore.setState({ isOpen: false, activeTab: "explain" });
  });

  it("starts closed with explain tab", () => {
    const state = useAiTutorStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.activeTab).toBe("explain");
  });

  it("open() sets isOpen to true", () => {
    useAiTutorStore.getState().open();
    expect(useAiTutorStore.getState().isOpen).toBe(true);
  });

  it("open(tab) switches to the given tab", () => {
    useAiTutorStore.getState().open("correct");
    expect(useAiTutorStore.getState().activeTab).toBe("correct");
    expect(useAiTutorStore.getState().isOpen).toBe(true);
  });

  it("close() sets isOpen to false", () => {
    useAiTutorStore.setState({ isOpen: true });
    useAiTutorStore.getState().close();
    expect(useAiTutorStore.getState().isOpen).toBe(false);
  });

  it("setTab() changes the active tab without toggling isOpen", () => {
    useAiTutorStore.setState({ isOpen: false });
    useAiTutorStore.getState().setTab("practice");
    expect(useAiTutorStore.getState().activeTab).toBe("practice");
    expect(useAiTutorStore.getState().isOpen).toBe(false); // unchanged
  });

  it("open() with no args preserves the current tab", () => {
    useAiTutorStore.setState({ activeTab: "writing-coach" });
    useAiTutorStore.getState().open();
    expect(useAiTutorStore.getState().activeTab).toBe("writing-coach");
  });
});
