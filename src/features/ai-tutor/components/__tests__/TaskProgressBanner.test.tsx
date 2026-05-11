import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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

import { TaskProgressBanner } from "@/features/ai-tutor/components/TaskProgressBanner";

describe("TaskProgressBanner", () => {
  it("renders progress count with interpolation", () => {
    render(
      <TaskProgressBanner
        tasksDone={1}
        tasksTotal={4}
        currentTaskVi="Chào hỏi"
        currentTaskEn="Greet"
      />
    );
    expect(screen.getByText("Tasks: 1 / 4 completed")).toBeInTheDocument();
  });

  it("renders Vietnamese task and English subtitle", () => {
    render(
      <TaskProgressBanner
        tasksDone={2}
        tasksTotal={5}
        currentTaskVi="Hỏi tên"
        currentTaskEn="Ask name"
      />
    );
    expect(screen.getByText("Hỏi tên")).toBeInTheDocument();
    expect(screen.getByText("Ask name")).toBeInTheDocument();
  });

  it("applies green border + ✅ when taskCompleted=true", () => {
    const { container } = render(
      <TaskProgressBanner
        tasksDone={1}
        tasksTotal={3}
        currentTaskVi="Vi"
        currentTaskEn="En"
        taskCompleted
      />
    );
    expect(container.querySelector(".border-green-500")).not.toBeNull();
    expect(screen.getByText("✅")).toBeInTheDocument();
  });

  it("defaults to ⭕ icon when taskCompleted is false", () => {
    render(
      <TaskProgressBanner
        tasksDone={0}
        tasksTotal={3}
        currentTaskVi="Vi"
        currentTaskEn="En"
      />
    );
    expect(screen.getByText("⭕")).toBeInTheDocument();
  });
});
