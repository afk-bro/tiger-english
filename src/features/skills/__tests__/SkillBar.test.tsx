import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SkillBar, { getSkillBarColor, getSkillLevel } from "../components/SkillBar";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "defaultValue" in opts) return opts.defaultValue as string;
      return key;
    },
  }),
}));

import { vi } from "vitest";

describe("getSkillBarColor", () => {
  it("returns red classes for score < 1.5", () => {
    expect(getSkillBarColor(0)).toContain("red");
    expect(getSkillBarColor(1.4)).toContain("red");
  });

  it("returns yellow classes for score 1.5–2.99", () => {
    expect(getSkillBarColor(1.5)).toContain("yellow");
    expect(getSkillBarColor(2.9)).toContain("yellow");
  });

  it("returns green classes for score >= 3.0", () => {
    expect(getSkillBarColor(3.0)).toContain("green");
    expect(getSkillBarColor(5.0)).toContain("green");
  });
});

describe("getSkillLevel", () => {
  it("returns Beginner for score < 1", () => {
    expect(getSkillLevel(0)).toBe("Beginner");
  });

  it("returns Mastery for score 4.8+", () => {
    expect(getSkillLevel(5)).toBe("Mastery");
    expect(getSkillLevel(4.8)).toBe("Mastery");
  });

  it("returns intermediate labels for mid scores", () => {
    expect(getSkillLevel(2.5)).toBe("Intermediate");
    expect(getSkillLevel(3.5)).toBe("Upper intermediate");
  });
});

describe("SkillBar", () => {
  it("renders a progressbar role", () => {
    render(<SkillBar score={3.5} label="Grammar Accuracy" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("has correct aria-valuenow", () => {
    render(<SkillBar score={2.5} label="Fluency" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2.5");
  });

  it("has aria-valuemin=0 and aria-valuemax=5", () => {
    render(<SkillBar score={1} label="Vocabulary" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "5");
  });

  it("accepts a label prop as accessible name", () => {
    render(<SkillBar score={4} label="Grammar Range" />);
    expect(screen.getByRole("progressbar", { name: "Grammar Range" })).toBeInTheDocument();
  });

  it("shows sample size and last updated in tooltip", () => {
    render(
      <SkillBar
        score={3}
        sampleSize={12}
        lastUpdatedAt="2026-05-01T00:00:00Z"
        label="Skill"
      />
    );
    const track = screen.getByRole("progressbar").closest("[title]");
    expect(track?.getAttribute("title")).toContain("12");
  });
});
