// scripts/lib/lesson-image-candidates.ts
// Enumerates Leonardo image candidates for a unit. Lives in scripts/lib/
// (not inside generate-lesson-images.ts) so it can be unit-tested
// without the script's CLI/dotenv/Leonardo/Supabase machinery.
//
// A "candidate" is one image to potentially generate: kind tells us what
// kind of slot it fills (mainly for logging), id is the sidecar key, and
// prompt is what we send to Leonardo.

import type { Unit } from "../../src/features/lessons/lesson.types";
import type { Section } from "../../src/features/lessons/lesson.types";
import type { TaggedExercise } from "../../src/features/lessons/data/exerciseRegistry";
import { sidecarKeyForUnit, sidecarKeyForSection } from "../../src/features/lessons/data/imageHydration";
import { templateVocabPrompt, templatePairPrompt } from "../lesson-image-config";

export type CandidateKind = "unit" | "section" | "vocab" | "dialogue" | "exercise" | "match-pair";

export type Candidate = {
  kind: CandidateKind;
  id: string;
  prompt: string;
};

/**
 * Dependencies the enumerator needs from the host. Injected so the
 * pipeline can pass real data and tests can pass fixtures without
 * touching the live section registry.
 */
export type CandidateDeps = {
  unit: Unit;
  lookupSection: (unitSlug: string, key: string) => Section | undefined;
  lookupExercise: (exerciseId: string) => TaggedExercise | undefined;
};

export function buildCandidates(deps: CandidateDeps): Candidate[] {
  const { unit, lookupSection, lookupExercise } = deps;
  const out: Candidate[] = [];

  if (unit.imagePrompt) {
    out.push({ kind: "unit", id: sidecarKeyForUnit(), prompt: unit.imagePrompt });
  }

  for (const meta of unit.sections) {
    const section = lookupSection(unit.slug, meta.key);
    if (!section) continue;
    if (section.imagePrompt) {
      out.push({ kind: "section", id: sidecarKeyForSection(section.key), prompt: section.imagePrompt });
    }
    for (const block of section.blocks) {
      if (block.type === "vocab-list") {
        for (const item of block.items) {
          const prompt = item.imagePrompt ?? templateVocabPrompt(item.word);
          out.push({ kind: "vocab", id: item.id, prompt });
        }
      } else if (block.type === "dialogue" && block.imagePrompt) {
        out.push({ kind: "dialogue", id: block.id, prompt: block.imagePrompt });
      } else if (block.type === "exercise") {
        if (block.imagePrompt) {
          out.push({ kind: "exercise", id: block.id, prompt: block.imagePrompt });
        }
        // Match exercises carry per-pair imagePrompt on the underlying
        // exercise data, not on the SectionBlock. Look the data up via
        // the registry so each pair gets its own Leonardo candidate.
        // Pair IDs are unique within a unit (e.g. `u2-match-book`), so
        // they slot into the same flat sidecar keyspace as vocab items
        // and hydrateMatchExercise reads them by id at runtime.
        if (block.exerciseType === "match") {
          const exercise = lookupExercise(block.exerciseId);
          if (exercise && exercise.type === "match") {
            for (const pair of exercise.data.pairs) {
              if (!pair.imagePrompt) continue;
              // Pair tiles render small and side-by-side, so they need
              // strict "one object, plain background" guidance — the
              // authored imagePrompt alone proved too loose. See
              // templatePairPrompt for the suffix rationale.
              out.push({ kind: "match-pair", id: pair.id, prompt: templatePairPrompt(pair.imagePrompt) });
            }
          }
        }
      }
    }
  }

  return out;
}
