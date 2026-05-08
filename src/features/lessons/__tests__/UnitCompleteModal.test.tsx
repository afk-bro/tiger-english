import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UnitCompleteModal from "../components/UnitCompleteModal";

// Confetti would call into canvas APIs not implemented by jsdom — mock
// the module so the modal mounts cleanly in tests.
vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: Record<string, unknown>) =>
      (opts?.defaultValue as string | undefined) ?? _key,
    i18n: { language: "en" },
  }),
}));

function renderModal(props: Partial<React.ComponentProps<typeof UnitCompleteModal>> = {}) {
  return render(
    <MemoryRouter>
      <UnitCompleteModal
        open
        onClose={() => {}}
        unitNumber={2}
        unitTitle="To Be + Location"
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("UnitCompleteModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the title with the unit number and the unit title", () => {
    renderModal();
    expect(screen.getByText("Unit 2 complete!")).toBeInTheDocument();
    expect(screen.getByText("To Be + Location")).toBeInTheDocument();
  });

  it("renders the next-unit CTA when nextUnit is provided", () => {
    renderModal({
      nextUnit: { slug: "unit-3", title: "Daily Routines", number: 3 },
    });
    const cta = screen.getByRole("link", { name: /Start Unit 3/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/lessons/unit-3");
  });

  it("renders the back-to-lessons CTA when nextUnit is omitted (last unit)", () => {
    renderModal({ nextUnit: undefined });
    const cta = screen.getByRole("link", { name: /Back to lessons/i });
    expect(cta).toHaveAttribute("href", "/lessons");
    expect(screen.queryByRole("link", { name: /Start Unit/i })).not.toBeInTheDocument();
  });

  it("calls onClose when the X button is clicked", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the 'keep reviewing' secondary button is clicked", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole("button", { name: /Keep reviewing/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fires confetti once on mount when open", async () => {
    const confettiModule = await import("canvas-confetti");
    renderModal();
    // Two side bursts — see the component for rationale.
    expect(confettiModule.default).toHaveBeenCalledTimes(2);
  });

  it("does not render dialog content when open=false", () => {
    renderModal({ open: false });
    expect(screen.queryByText("Unit 2 complete!")).not.toBeInTheDocument();
  });
});
