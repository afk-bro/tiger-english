/**
 * Tests for buildCandidates — the enumerator that turns lesson data
 * into a flat list of Leonardo image candidates. Pins the per-pair
 * enumeration for match exercises (the primary reason this module
 * exists separate from the script) plus the existing kinds.
 */
import { describe, it, expect } from "vitest";
import { buildCandidates } from "../lib/lesson-image-candidates";
import type { CandidateDeps } from "../lib/lesson-image-candidates";
import type { Unit, Section } from "../../src/features/lessons/lesson.types";
import type { TaggedExercise } from "../../src/features/lessons/data/exerciseRegistry";
import type { MatchExercise } from "../../src/components/exercises/exercises.types";

const matchExercise: MatchExercise = {
  id: "u2-activities-match-1",
  prompt: "Tap a word, then tap the picture.",
  pairs: [
    { id: "u2-match-book", word: "book", imagePrompt: "open book illustration" },
    { id: "u2-match-pencil", word: "pencil", imagePrompt: "yellow pencil" },
    // Pair without imagePrompt — should be skipped (not all pair data
    // will have prompts during early authoring).
    { id: "u2-match-orphan", word: "orphan", fallback: "❓" },
  ],
};

function makeDeps(opts: {
  unit: Unit;
  sections: Section[];
  exercises?: Record<string, TaggedExercise>;
}): CandidateDeps {
  const sectionByKey = new Map(opts.sections.map((s) => [`${s.unitSlug}:${s.key}`, s]));
  return {
    unit: opts.unit,
    lookupSection: (slug, key) => sectionByKey.get(`${slug}:${key}`),
    lookupExercise: (id) => opts.exercises?.[id],
  };
}

describe("buildCandidates — match exercises", () => {
  it("emits one candidate per pair with an imagePrompt, keyed by pair.id", () => {
    const unit: Unit = {
      slug: "unit-2",
      number: 2,
      title: "U2",
      topic: "t",
      grammarFocus: "g",
      estimatedMinutes: 10,
      status: "available",
      sections: [{ key: "activities", estimatedMinutes: 10 }],
      translations: {},
    };
    const section: Section = {
      id: "u2-activities",
      unitSlug: "unit-2",
      key: "activities",
      blocks: [
        {
          id: "u2-activities-match-1-block",
          type: "exercise",
          exerciseType: "match",
          exerciseId: "u2-activities-match-1",
        },
      ],
    };
    const deps = makeDeps({
      unit,
      sections: [section],
      exercises: { "u2-activities-match-1": { type: "match", data: matchExercise } },
    });

    const candidates = buildCandidates(deps);

    const pairCandidates = candidates.filter((c) => c.kind === "match-pair");
    expect(pairCandidates).toHaveLength(2);
    expect(pairCandidates[0].id).toBe("u2-match-book");
    expect(pairCandidates[0].prompt).toMatch(/^open book illustration, .+isolated/);
    expect(pairCandidates[1].id).toBe("u2-match-pencil");
    expect(pairCandidates[1].prompt).toMatch(/^yellow pencil, .+isolated/);
  });

  it("does not emit pair candidates when the exercise registry has no entry", () => {
    // Defensive: if the registry is out of sync (e.g. a new match
    // exercise was added without registering it) the pipeline should
    // still run for everything else rather than throwing.
    const unit: Unit = {
      slug: "unit-2",
      number: 2,
      title: "U2",
      topic: "t",
      grammarFocus: "g",
      estimatedMinutes: 10,
      status: "available",
      sections: [{ key: "activities", estimatedMinutes: 10 }],
      translations: {},
    };
    const section: Section = {
      id: "u2-activities",
      unitSlug: "unit-2",
      key: "activities",
      blocks: [
        {
          id: "block-1",
          type: "exercise",
          exerciseType: "match",
          exerciseId: "missing-from-registry",
        },
      ],
    };
    const deps = makeDeps({ unit, sections: [section], exercises: {} });

    expect(buildCandidates(deps).filter((c) => c.kind === "match-pair")).toEqual([]);
  });

  it("still emits the block-level exercise candidate when block.imagePrompt is set on a match block", () => {
    // Block-level imagePrompt is independent of per-pair prompts —
    // a match exercise block could have both (a header image plus
    // per-pair tile images), though in practice we don't author this.
    const unit: Unit = {
      slug: "unit-2",
      number: 2,
      title: "U2",
      topic: "t",
      grammarFocus: "g",
      estimatedMinutes: 10,
      status: "available",
      sections: [{ key: "activities", estimatedMinutes: 10 }],
      translations: {},
    };
    const section: Section = {
      id: "u2-activities",
      unitSlug: "unit-2",
      key: "activities",
      blocks: [
        {
          id: "u2-activities-match-1-block",
          type: "exercise",
          exerciseType: "match",
          exerciseId: "u2-activities-match-1",
          imagePrompt: "header image for the match exercise",
        },
      ],
    };
    const deps = makeDeps({
      unit,
      sections: [section],
      exercises: { "u2-activities-match-1": { type: "match", data: matchExercise } },
    });

    const candidates = buildCandidates(deps);
    const exerciseLevel = candidates.find((c) => c.kind === "exercise");
    expect(exerciseLevel).toEqual({
      kind: "exercise",
      id: "u2-activities-match-1-block",
      prompt: "header image for the match exercise",
    });
    // And we still get the per-pair candidates.
    expect(candidates.filter((c) => c.kind === "match-pair")).toHaveLength(2);
  });
});

describe("buildCandidates — other kinds (regression for the existing flow)", () => {
  it("emits unit, section, vocab, and dialogue candidates with the existing keys", () => {
    const unit: Unit = {
      slug: "unit-1",
      number: 1,
      title: "U1",
      topic: "t",
      grammarFocus: "g",
      estimatedMinutes: 10,
      status: "available",
      sections: [{ key: "vocabulary", estimatedMinutes: 10 }],
      translations: {},
      imagePrompt: "unit hero",
    };
    const section: Section = {
      id: "u1-vocabulary",
      unitSlug: "unit-1",
      key: "vocabulary",
      imagePrompt: "section hero",
      blocks: [
        {
          id: "u1-vl",
          type: "vocab-list",
          items: [
            { id: "u1-v-hello", word: "hello", translations: {}, imagePrompt: "wave hello" },
            // No imagePrompt — falls back to templateVocabPrompt(word).
            { id: "u1-v-bye", word: "bye", translations: {} },
          ],
        },
        { id: "u1-d-1", type: "dialogue", lines: [], imagePrompt: "two friends talking" },
      ],
    };
    const deps = makeDeps({ unit, sections: [section] });

    const candidates = buildCandidates(deps);
    const ids = candidates.map((c) => `${c.kind}:${c.id}`);
    expect(ids).toEqual([
      "unit:__unit__",
      "section:__section__:vocabulary",
      "vocab:u1-v-hello",
      "vocab:u1-v-bye",
      "dialogue:u1-d-1",
    ]);
    // Custom imagePrompt overrides the word but still picks up
    // OBJECT_STYLE_SUFFIX so all vocab thumbnails share style.
    expect(candidates.find((c) => c.id === "u1-v-hello")?.prompt).toMatch(/^wave hello, .+isolated/);
    expect(candidates.find((c) => c.id === "u1-v-bye")?.prompt).toMatch(/^bye, .+isolated/);
  });
});

describe("buildCandidates — vocab item noImage skip", () => {
  it("skips vocab-list items with `noImage: true`", () => {
    const unit: Unit = {
      slug: "unit-1",
      number: 1,
      title: "U1",
      topic: "t",
      grammarFocus: "g",
      estimatedMinutes: 10,
      status: "available",
      sections: [{ key: "vocabulary", estimatedMinutes: 10 }],
      translations: {},
    };
    const section: Section = {
      id: "u1-vocabulary",
      unitSlug: "unit-1",
      key: "vocabulary",
      blocks: [
        {
          id: "u1-vl",
          type: "vocab-list",
          items: [
            // Function word / abstract — opted out of the pipeline.
            { id: "u1-v-is", word: "is", translations: {}, noImage: true },
            // Concrete object — generates as normal.
            { id: "u1-v-pencil", word: "pencil", translations: {} },
            // Explicit imagePrompt + noImage — still skipped (noImage wins).
            { id: "u1-v-name", word: "name", translations: {}, imagePrompt: "a name tag", noImage: true },
          ],
        },
      ],
    };
    const deps = makeDeps({ unit, sections: [section] });

    const candidates = buildCandidates(deps);
    const ids = candidates.filter((c) => c.kind === "vocab").map((c) => c.id);
    expect(ids).toEqual(["u1-v-pencil"]);
  });
});
