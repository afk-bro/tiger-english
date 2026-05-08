import { describe, it, expect } from "vitest";
import {
  hydrateUnit,
  hydrateSection,
  hydrateMatchExercise,
  sidecarKeyForUnit,
  sidecarKeyForSection,
} from "../data/imageHydration";
import type { Unit, Section } from "../lesson.types";
import type { MatchExercise } from "@/components/exercises/exercises.types";
import type { UnitSidecar } from "../data/images";

const sidecarFixture: UnitSidecar = {
  __unit__: { url: "https://example/unit.png", promptHash: "h1", model: "m", generatedAt: "t" },
  "__section__:vocabulary": { url: "https://example/sec.png", promptHash: "h2", model: "m", generatedAt: "t" },
  "u2-v-classroom": { url: "https://example/word.png", promptHash: "h3", model: "m", generatedAt: "t" },
  "u2-d-1": { url: "https://example/dialogue.png", promptHash: "h4", model: "m", generatedAt: "t" },
  "u2-ex-1": { url: "https://example/exercise.png", promptHash: "h5", model: "m", generatedAt: "t" },
};

const unit: Unit = {
  slug: "unit-2",
  number: 2,
  title: "U2",
  topic: "t",
  grammarFocus: "g",
  estimatedMinutes: 10,
  status: "available",
  sections: [],
  translations: {},
};

const section: Section = {
  id: "u2-vocabulary",
  unitSlug: "unit-2",
  key: "vocabulary",
  blocks: [
    { id: "u2-vl", type: "vocab-list", items: [
      { id: "u2-v-classroom", word: "classroom", translations: {} },
      { id: "u2-v-flag", word: "flag", translations: {} },
    ]},
    { id: "u2-d-1", type: "dialogue", lines: [] },
    { id: "u2-ex-1", type: "exercise", exerciseType: "multiple-choice", exerciseId: "x" },
    { id: "u2-h", type: "heading", content: "ignored — has no image support" },
  ],
};

describe("hydrateUnit", () => {
  it("returns a copy with imageUrl populated from __unit__ entry", () => {
    const result = hydrateUnit(unit, sidecarFixture);
    expect(result.imageUrl).toBe("https://example/unit.png");
    expect(unit.imageUrl).toBeUndefined(); // original not mutated
  });

  it("returns a copy with imageUrl undefined when sidecar has no __unit__", () => {
    const result = hydrateUnit(unit, {});
    expect(result.imageUrl).toBeUndefined();
  });

  it("returns the same unit reference when sidecar has no __unit__", () => {
    expect(hydrateUnit(unit, {})).toBe(unit);
  });
});

describe("hydrateSection", () => {
  it("populates section.imageUrl from __section__:<key>", () => {
    const result = hydrateSection(section, sidecarFixture);
    expect(result.imageUrl).toBe("https://example/sec.png");
  });

  it("populates vocab item imageUrl from sidecar by item id", () => {
    const result = hydrateSection(section, sidecarFixture);
    const vocabBlock = result.blocks[0];
    if (vocabBlock.type !== "vocab-list") throw new Error("expected vocab-list block");
    expect(vocabBlock.items[0].imageUrl).toBe("https://example/word.png");
    expect(vocabBlock.items[1].imageUrl).toBeUndefined();
  });

  it("populates dialogue and exercise block imageUrl from sidecar", () => {
    const result = hydrateSection(section, sidecarFixture);
    const dialogueBlock = result.blocks[1];
    const exerciseBlock = result.blocks[2];
    if (dialogueBlock.type !== "dialogue") throw new Error("expected dialogue block");
    if (exerciseBlock.type !== "exercise") throw new Error("expected exercise block");
    expect(dialogueBlock.imageUrl).toBe("https://example/dialogue.png");
    expect(exerciseBlock.imageUrl).toBe("https://example/exercise.png");
  });

  it("does not mutate the input section or its blocks", () => {
    hydrateSection(section, sidecarFixture);
    expect(section.imageUrl).toBeUndefined();
    const originalVocab = section.blocks[0];
    if (originalVocab.type !== "vocab-list") throw new Error();
    expect(originalVocab.items[0].imageUrl).toBeUndefined();
  });

  it("returns the section as-is when sidecar is empty", () => {
    const result = hydrateSection(section, {});
    expect(result.imageUrl).toBeUndefined();
    if (result.blocks[0].type !== "vocab-list") throw new Error();
    expect(result.blocks[0].items[0].imageUrl).toBeUndefined();
  });

  it("returns the same section reference when sidecar is empty", () => {
    expect(hydrateSection(section, {})).toBe(section);
  });

  it("preserves vocab-list block reference when no items match sidecar", () => {
    const partial: UnitSidecar = {
      "__section__:vocabulary": sidecarFixture["__section__:vocabulary"],
    };
    const result = hydrateSection(section, partial);
    expect(result.blocks[0]).toBe(section.blocks[0]);
  });
});

describe("hydrateMatchExercise", () => {
  const baseExercise: MatchExercise = {
    id: "u2-activities-match-1",
    prompt: "Tap a word, then tap the picture.",
    pairs: [
      { id: "u2-match-book", word: "book", imagePrompt: "p1", fallback: "📖" },
      { id: "u2-match-pencil", word: "pencil", imagePrompt: "p2", fallback: "✏️" },
      { id: "u2-match-chair", word: "chair", imagePrompt: "p3", fallback: "🪑" },
    ],
  };

  it("populates imageUrl on each pair that has a sidecar entry", () => {
    const sidecar: UnitSidecar = {
      "u2-match-book": { url: "https://example/book.png", promptHash: "h1", model: "m", generatedAt: "t" },
      "u2-match-pencil": { url: "https://example/pencil.png", promptHash: "h2", model: "m", generatedAt: "t" },
      "u2-match-chair": { url: "https://example/chair.png", promptHash: "h3", model: "m", generatedAt: "t" },
    };
    const result = hydrateMatchExercise(baseExercise, sidecar);
    expect(result.pairs[0].imageUrl).toBe("https://example/book.png");
    expect(result.pairs[1].imageUrl).toBe("https://example/pencil.png");
    expect(result.pairs[2].imageUrl).toBe("https://example/chair.png");
  });

  it("leaves pairs without a sidecar entry untouched (fallback path)", () => {
    const sidecar: UnitSidecar = {
      "u2-match-book": { url: "https://example/book.png", promptHash: "h1", model: "m", generatedAt: "t" },
    };
    const result = hydrateMatchExercise(baseExercise, sidecar);
    expect(result.pairs[0].imageUrl).toBe("https://example/book.png");
    expect(result.pairs[1].imageUrl).toBeUndefined();
    expect(result.pairs[1].fallback).toBe("✏️");
    expect(result.pairs[2].imageUrl).toBeUndefined();
  });

  it("preserves the input reference when no pairs match sidecar", () => {
    // Reference preservation matters: ExerciseBlock would otherwise pass
    // a fresh exercise object to MatchPairs every render, busting its
    // `useMemo`-cached column shuffles on the pairs reference.
    expect(hydrateMatchExercise(baseExercise, {})).toBe(baseExercise);
  });

  it("does not mutate the input exercise", () => {
    const sidecar: UnitSidecar = {
      "u2-match-book": { url: "https://example/book.png", promptHash: "h1", model: "m", generatedAt: "t" },
    };
    hydrateMatchExercise(baseExercise, sidecar);
    expect(baseExercise.pairs[0].imageUrl).toBeUndefined();
  });

  it("ignores sidecar keys for pairs that don't exist in the exercise", () => {
    // Sidecar may contain stale entries from a previous shape — the
    // helper should only look at the pair IDs present in the exercise.
    const sidecar: UnitSidecar = {
      "u2-match-typewriter": { url: "https://example/old.png", promptHash: "h", model: "m", generatedAt: "t" },
    };
    expect(hydrateMatchExercise(baseExercise, sidecar)).toBe(baseExercise);
  });
});

describe("sidecar key helpers", () => {
  it("sidecarKeyForUnit returns __unit__", () => {
    expect(sidecarKeyForUnit()).toBe("__unit__");
  });

  it("sidecarKeyForSection returns __section__:<key>", () => {
    expect(sidecarKeyForSection("vocabulary")).toBe("__section__:vocabulary");
    expect(sidecarKeyForSection("dialogues")).toBe("__section__:dialogues");
  });
});
