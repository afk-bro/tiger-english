import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "defaultValue" in opts) {
        let s = opts.defaultValue as string;
        for (const [k, v] of Object.entries(opts)) {
          if (k === "defaultValue") continue;
          s = s.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), String(v));
        }
        return s;
      }
      return key;
    },
    i18n: { language: "en" },
  }),
}));

import { EndLessonModal } from "@/features/ai-tutor/components/EndLessonModal";

describe("EndLessonModal", () => {
  it("renders nothing when isOpen=false", () => {
    const { container } = render(
      <EndLessonModal
        isOpen={false}
        tasksDone={1}
        tasksTotal={3}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders body with interpolated done/total when open", () => {
    render(
      <EndLessonModal
        isOpen
        tasksDone={2}
        tasksTotal={4}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(
      screen.getByText("You've completed 2 of 4 tasks.")
    ).toBeInTheDocument();
  });

  it("fires onConfirm when End lesson is clicked", () => {
    const onConfirm = vi.fn();
    const onDismiss = vi.fn();
    render(
      <EndLessonModal
        isOpen
        tasksDone={0}
        tasksTotal={3}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /End lesson/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("fires onDismiss when Continue practicing is clicked", () => {
    const onConfirm = vi.fn();
    const onDismiss = vi.fn();
    render(
      <EndLessonModal
        isOpen
        tasksDone={0}
        tasksTotal={3}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Continue practicing/i })
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("fires onDismiss on Escape keydown", () => {
    const onConfirm = vi.fn();
    const onDismiss = vi.fn();
    render(
      <EndLessonModal
        isOpen
        tasksDone={0}
        tasksTotal={3}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
      />
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("fires onDismiss when backdrop is clicked", () => {
    const onDismiss = vi.fn();
    render(
      <EndLessonModal
        isOpen
        tasksDone={0}
        tasksTotal={3}
        onConfirm={vi.fn()}
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Close/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
