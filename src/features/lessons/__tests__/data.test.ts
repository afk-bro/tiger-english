// src/features/lessons/__tests__/data.test.ts
import { describe, it, expect } from "vitest";
import { getUnit } from "../data/getUnit";
import { getSection } from "../data/getSection";
import { registerSection } from "../data/sectionRegistry";
import type { Section } from "../lesson.types";
import { units } from "../data/units";

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

  it("returns unit-2 with the textbook metadata", () => {
    const unit = getUnit("unit-2");
    expect(unit).toBeDefined();
    expect(unit!.slug).toBe("unit-2");
    expect(unit!.title).toBe("To Be + Location");
    expect(unit!.status).toBe("available");
    expect(unit!.sections).toHaveLength(5);
    expect(unit!.translations.vi?.title).toBe("To Be + Vị trí");
    expect(unit!.translations.th).toBeUndefined();
    expect(unit!.translations["zh-CN"]).toBeUndefined();
  });

  it("returns coming-soon units", () => {
    const unit = getUnit("unit-3");
    expect(unit).toBeDefined();
    expect(unit!.status).toBe("coming-soon");
    expect(unit!.sections).toHaveLength(0);
  });
});

describe("getSection + sectionRegistry", () => {
  const mockSection: Section = {
    id: "test-section",
    unitSlug: "unit-99",
    key: "overview",
    blocks: [],
  };

  it("returns undefined for unknown unit/section", () => {
    expect(getSection("unit-99", "grammar")).toBeUndefined();
  });

  it("returns auto-registered unit-1 sections", () => {
    expect(getSection("unit-1", "overview")).toBeDefined();
    expect(getSection("unit-1", "grammar")).toBeDefined();
    expect(getSection("unit-1", "vocabulary")).toBeDefined();
    expect(getSection("unit-1", "dialogues")).toBeDefined();
    expect(getSection("unit-1", "activities")).toBeDefined();
  });

  it("returns section after manual registration", () => {
    registerSection(mockSection);
    const result = getSection("unit-99", "overview");
    expect(result).toBeDefined();
    expect(result!.id).toBe("test-section");
  });
});

describe("unit translations", () => {
  it("every declared translation row has all required fields", () => {
    for (const unit of units) {
      for (const lang of Object.keys(unit.translations) as Array<keyof typeof unit.translations>) {
        const t = unit.translations[lang]!;
        expect(t.title, `${unit.slug}.${lang}.title`).toBeTruthy();
        expect(t.topic, `${unit.slug}.${lang}.topic`).toBeTruthy();
        expect(t.grammarFocus, `${unit.slug}.${lang}.grammarFocus`).toBeTruthy();
      }
    }
  });

  it("every unit has at least a Vietnamese translation", () => {
    for (const unit of units) {
      expect(unit.translations.vi, `${unit.slug} missing vi`).toBeDefined();
    }
  });
});
