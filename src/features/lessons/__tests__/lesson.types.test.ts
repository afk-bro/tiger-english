// src/features/lessons/__tests__/lesson.types.test.ts
import { describe, it, expect } from "vitest";
import { SECTION_ORDER } from "../lesson.types";

describe("SECTION_ORDER", () => {
  it("contains exactly 5 sections in the canonical order", () => {
    expect(SECTION_ORDER).toEqual([
      "overview",
      "grammar",
      "vocabulary",
      "dialogues",
      "activities",
    ]);
  });

  it("has no duplicates", () => {
    const unique = new Set(SECTION_ORDER);
    expect(unique.size).toBe(SECTION_ORDER.length);
  });
});
