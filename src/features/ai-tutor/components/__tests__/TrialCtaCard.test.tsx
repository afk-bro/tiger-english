import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { toast } from "sonner";
import { TrialCtaCard } from "@/features/ai-tutor/components/TrialCtaCard";

vi.mock("sonner", () => ({ toast: vi.fn() }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "defaultValue" in opts) return opts.defaultValue as string;
      return key;
    },
    i18n: { language: "en" },
  }),
}));

describe("TrialCtaCard", () => {
  beforeEach(() => {
    (toast as unknown as ReturnType<typeof vi.fn>).mockClear();
  });

  it("renders title + body copy", () => {
    render(<TrialCtaCard />);
    expect(
      screen.getByText(/Get unlimited AI Tutor access free/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Start your free trial/i)).toBeInTheDocument();
  });

  it("clicking surfaces a toast with the trial-coming-soon copy", () => {
    render(<TrialCtaCard />);
    fireEvent.click(screen.getByRole("button"));
    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith(
      expect.stringMatching(/Free trial coming soon/i),
    );
  });
});
