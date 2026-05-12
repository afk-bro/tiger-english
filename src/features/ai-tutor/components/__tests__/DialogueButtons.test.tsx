import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "defaultValue" in opts) return opts.defaultValue as string;
      return key;
    },
    i18n: { language: "en" },
  }),
}));

import { DialogueButtons } from "@/features/ai-tutor/components/DialogueButtons";

describe("DialogueButtons", () => {
  function setup(overrides: Partial<React.ComponentProps<typeof DialogueButtons>> = {}) {
    const props = {
      onRepeat: vi.fn(),
      onTranslate: vi.fn(),
      onToggleHide: vi.fn(),
      onFlag: vi.fn(),
      ...overrides,
    };
    render(<DialogueButtons {...props} />);
    return props;
  }

  it("clicking Repeat fires onRepeat", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("button", { name: /Repeat/i }));
    expect(props.onRepeat).toHaveBeenCalledTimes(1);
  });

  it("clicking Translate fires onTranslate", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("button", { name: /Translate/i }));
    expect(props.onTranslate).toHaveBeenCalledTimes(1);
  });

  it("clicking the hide-text button fires onToggleHide", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("button", { name: /Hide text/i }));
    expect(props.onToggleHide).toHaveBeenCalledTimes(1);
  });

  it("clicking Flag fires onFlag", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("button", { name: /Flag/i }));
    expect(props.onFlag).toHaveBeenCalledTimes(1);
  });

  it("renders 'Hide text' when textHidden=false", () => {
    setup({ textHidden: false });
    expect(screen.getByRole("button", { name: /Hide text/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show text/i })).toBeNull();
  });

  it("renders 'Show text' when textHidden=true", () => {
    setup({ textHidden: true });
    expect(screen.getByRole("button", { name: /Show text/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Hide text/i })).toBeNull();
  });
});
