// src/features/lessons/__tests__/data.test.ts
import { describe, it, expect } from "vitest";
import { getUnit } from "../data/getUnit";
import { getSection } from "../data/getSection";
import { registerSection } from "../data/sectionRegistry";
import type { Section } from "../lesson.types";
import { units } from "../data/units";
import * as unit2Exercises from "../data/exercises/unit-2";

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

  it("returns auto-registered unit-2 overview", () => {
    expect(getSection("unit-2", "overview")).toBeDefined();
  });

  it("returns auto-registered unit-2 grammar", () => {
    expect(getSection("unit-2", "grammar")).toBeDefined();
  });

  it("returns auto-registered unit-2 vocabulary with all 35 items", () => {
    const section = getSection("unit-2", "vocabulary");
    expect(section).toBeDefined();
    const vocabBlocks = section!.blocks.filter((b) => b.type === "vocab-list");
    expect(vocabBlocks).toHaveLength(3);
    const totalItems = vocabBlocks.reduce(
      (sum, b) => sum + (b.type === "vocab-list" ? b.items.length : 0),
      0,
    );
    expect(totalItems).toBe(35);
  });

  it("returns auto-registered unit-2 dialogues with two dialogue blocks", () => {
    const section = getSection("unit-2", "dialogues");
    expect(section).toBeDefined();
    const dialogueBlocks = section!.blocks.filter((b) => b.type === "dialogue");
    expect(dialogueBlocks).toHaveLength(2);
  });

  it("returns auto-registered unit-2 activities with 12 exercises", () => {
    const section = getSection("unit-2", "activities");
    expect(section).toBeDefined();
    const exerciseBlocks = section!.blocks.filter((b) => b.type === "exercise");
    expect(exerciseBlocks).toHaveLength(12);
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

  it("every available unit has at least a Vietnamese translation", () => {
    for (const unit of units.filter((u) => u.status === "available")) {
      expect(unit.translations.vi, `${unit.slug} missing vi`).toBeDefined();
    }
  });
});

describe("unit-2 exercises", () => {
  it("exports all 14 expected exercise objects with correct IDs", () => {
    const expected: Record<string, string> = {
      grammarMcqContractions: "u2-grammar-mcq-1",
      grammarMcqWhereWord: "u2-grammar-mcq-2",
      activitiesVocabClassroomMcq: "u2-activities-mcq-1",
      activitiesVocabHomeMcq: "u2-activities-mcq-2",
      activitiesVocabTownMcq: "u2-activities-mcq-3",
      activitiesVocabMixedMcq: "u2-activities-mcq-4",
      activitiesWhereResponseMariaMcq: "u2-activities-mcq-5",
      activitiesWhereAreFb: "u2-activities-fb-1",
      activitiesWhereResponseChildrenMcq: "u2-activities-mcq-6",
      activitiesWhereDictionaryFb: "u2-activities-fb-2",
      activitiesContractionTheyMcq: "u2-activities-mcq-7",
      activitiesContractionItMcq: "u2-activities-mcq-8",
      activitiesContractionShortenFb: "u2-activities-fb-3",
      activitiesContractionCorrectMcq: "u2-activities-mcq-9",
    };
    for (const [exportName, id] of Object.entries(expected)) {
      const exercise = (unit2Exercises as Record<string, { id: string }>)[exportName];
      expect(exercise, `missing export: ${exportName}`).toBeDefined();
      expect(exercise.id, `${exportName} has wrong id`).toBe(id);
    }
  });
});
