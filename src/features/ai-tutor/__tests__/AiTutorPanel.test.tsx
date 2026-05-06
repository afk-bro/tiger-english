import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAiTutorStore } from "@/stores/useAiTutorStore";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "defaultValue" in opts) return opts.defaultValue as string;
      return key;
    },
    i18n: { language: "en" },
  }),
}));

// Stub tab contents so panel tests focus on the panel shell
vi.mock("@/features/ai-tutor/components/ExplainTab", () => ({
  default: () => <div data-testid="explain-tab-content">Explain content</div>,
}));
vi.mock("@/features/ai-tutor/components/CorrectTab", () => ({
  default: () => <div data-testid="correct-tab-content">Correct content</div>,
}));
vi.mock("@/features/ai-tutor/components/PracticeTab", () => ({
  default: () => <div data-testid="practice-tab-content">Practice content</div>,
}));
vi.mock("@/features/ai-tutor/components/WritingCoachTab", () => ({
  default: () => <div data-testid="writing-coach-tab-content">Writing Coach content</div>,
}));

// Import AFTER mocks
const { default: AiTutorPanel } = await import("@/features/ai-tutor/components/AiTutorPanel");

function renderPanel() {
  return render(
    <MemoryRouter>
      <AiTutorPanel />
    </MemoryRouter>
  );
}

describe("AiTutorPanel", () => {
  beforeEach(() => {
    // Reset store to closed state before each test
    useAiTutorStore.setState({ isOpen: false, activeTab: "explain" });
  });

  it("is not visible when closed", () => {
    renderPanel();
    const panel = screen.getByRole("dialog");
    expect(panel).toHaveClass("translate-x-full");
  });

  it("is visible when store is open", () => {
    useAiTutorStore.setState({ isOpen: true });
    renderPanel();
    const panel = screen.getByRole("dialog");
    expect(panel).toHaveClass("translate-x-0");
  });

  it("renders all 4 tabs", () => {
    useAiTutorStore.setState({ isOpen: true });
    renderPanel();
    expect(screen.getByRole("tab", { name: /explain/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /correct/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /practice/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /writing coach/i })).toBeInTheDocument();
  });

  it("shows Explain tab content by default", () => {
    useAiTutorStore.setState({ isOpen: true, activeTab: "explain" });
    renderPanel();
    expect(screen.getByTestId("explain-tab-content")).toBeInTheDocument();
  });

  it("switching to Correct tab shows correct content", () => {
    useAiTutorStore.setState({ isOpen: true, activeTab: "explain" });
    renderPanel();
    fireEvent.click(screen.getByRole("tab", { name: /correct/i }));
    expect(useAiTutorStore.getState().activeTab).toBe("correct");
  });

  it("close button calls store close()", () => {
    useAiTutorStore.setState({ isOpen: true });
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(useAiTutorStore.getState().isOpen).toBe(false);
  });

  it("has correct aria-label on dialog", () => {
    renderPanel();
    expect(screen.getByRole("dialog", { name: "AI Tutor" })).toBeInTheDocument();
  });

  it("Escape key closes the panel", () => {
    useAiTutorStore.setState({ isOpen: true });
    renderPanel();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(useAiTutorStore.getState().isOpen).toBe(false);
  });

  it("Tab from the last focusable element wraps back to the first (focus trap)", () => {
    useAiTutorStore.setState({ isOpen: true });
    renderPanel();
    const focusables = screen
      .getByRole("dialog")
      .querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
    expect(focusables.length).toBeGreaterThan(1);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    last.focus();
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);
  });

  it("Shift+Tab from the first focusable element wraps to the last", () => {
    useAiTutorStore.setState({ isOpen: true });
    renderPanel();
    const focusables = screen
      .getByRole("dialog")
      .querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    first.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});
