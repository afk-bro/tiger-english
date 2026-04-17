import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLocalizedContent } from "../useLocalizedContent";

const mockI18n = { language: "en" };
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}));

describe("useLocalizedContent", () => {
  it("returns English content when no translations are provided", () => {
    mockI18n.language = "th";
    const { result } = renderHook(() => useLocalizedContent("Hello"));
    expect(result.current).toBe("Hello");
  });

  it("returns the learner-language translation when present", () => {
    mockI18n.language = "th";
    const { result } = renderHook(() => useLocalizedContent("Hello", { th: "สวัสดี" }));
    expect(result.current).toBe("สวัสดี");
  });

  it("falls back to English when the app language is not a supported learner language", () => {
    mockI18n.language = "fr";
    const { result } = renderHook(() => useLocalizedContent("Hello", { th: "สวัสดี" }));
    expect(result.current).toBe("Hello");
  });

  it("falls back to English when the learner translation is missing", () => {
    mockI18n.language = "vi";
    const { result } = renderHook(() => useLocalizedContent("Hello", { th: "สวัสดี" }));
    expect(result.current).toBe("Hello");
  });

  it("falls back to English when the learner translation is an empty string", () => {
    mockI18n.language = "th";
    const { result } = renderHook(() => useLocalizedContent("Hello", { th: "" }));
    expect(result.current).toBe("Hello");
  });
});
