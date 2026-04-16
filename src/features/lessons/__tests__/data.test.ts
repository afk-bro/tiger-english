// src/features/lessons/__tests__/data.test.ts
import { describe, it, expect } from "vitest";
import { getUnit } from "../data/getUnit";
import { getSection } from "../data/getSection";
import { registerSection } from "../data/sectionRegistry";
import type { Section } from "../lesson.types";

describe("getUnit", () => {
  it("returns unit-1 by slug", () => {
    const unit = getUnit("unit-1");
    expect(unit).toBeDefined();
    expect(unit!.slug).toBe("unit-1");
    expect(unit!.sections).toHaveLength(5);
  });

  it("returns undefined for unknown slug", () => {
    expect(getUnit("unit-99")).toBeUndefined();
  });

  it("returns coming-soon units", () => {
    const unit = getUnit("unit-2");
    expect(unit).toBeDefined();
    expect(unit!.status).toBe("coming-soon");
    expect(unit!.sections).toHaveLength(0);
  });
});

describe("getSection + sectionRegistry", () => {
  const mockSection: Section = {
    id: "test-section",
    unitSlug: "unit-1",
    key: "overview",
    title: "Overview",
    blocks: [],
  };

  it("returns undefined before registration", () => {
    expect(getSection("unit-1", "grammar")).toBeUndefined();
  });

  it("returns section after registration", () => {
    registerSection(mockSection);
    const result = getSection("unit-1", "overview");
    expect(result).toBeDefined();
    expect(result!.id).toBe("test-section");
  });
});
