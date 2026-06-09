// scripts/lib/lesson-image-candidates.ts
// Enumerates image candidates for a unit. Lives in scripts/lib/
// (not inside the generator script) so it can be unit-tested without
// the script's CLI/dotenv/Supabase machinery.
//
// A "candidate" is one image slot to potentially resolve: kind tells us
// what kind of slot it fills (mainly for logging), id is the sidecar key,
// and query is the clean search term used by the icon/photo resolver.
// Slots with no single-noun referent (unit/section/dialogue/exercise) carry
// no query and will be reported as skipped by the generator.

import type { Unit } from "../../src/features/lessons/lesson.types";
import type { Section } from "../../src/features/lessons/lesson.types";
import type { TaggedExercise } from "../../src/features/lessons/data/exerciseRegistry";
import { sidecarKeyForUnit, sidecarKeyForSection } from "../../src/features/lessons/data/imageHydration";

export type CandidateKind = "unit" | "section" | "vocab" | "dialogue" | "exercise" | "match-pair";

export type Candidate = {
  kind: CandidateKind;
  id: string;
  /** Clean search term for icon/photo resolution. Undefined for slots
   *  with no single-noun referent (unit/section/dialogue/exercise) —
   *  those are reported as skipped, never resolved. */
  query?: string;
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
    out.push({ kind: "unit", id: sidecarKeyForUnit() });
  }

  for (const meta of unit.sections) {
    const section = lookupSection(unit.slug, meta.key);
    if (!section) continue;
    if (section.imagePrompt) {
      out.push({ kind: "section", id: sidecarKeyForSection(section.key) });
    }
    for (const block of section.blocks) {
      if (block.type === "vocab-list") {
        for (const item of block.items) {
          // `noImage` opts a vocab item out of generation entirely —
          // used for function words, abstracts, and items where any
          // generated image is more likely to confuse than help.
          if (item.noImage) continue;
          out.push({ kind: "vocab", id: item.id, query: item.word });
        }
      } else if (block.type === "dialogue" && block.imagePrompt) {
        out.push({ kind: "dialogue", id: block.id });
      } else if (block.type === "exercise") {
        if (block.imagePrompt) {
          out.push({ kind: "exercise", id: block.id });
        }
        // Match exercises carry per-pair imagePrompt on the underlying
        // exercise data, not on the SectionBlock. Look the data up via
        // the registry so each pair gets its own candidate.
        // Pair IDs are unique within a unit (e.g. `u2-match-book`), so
        // they slot into the same flat sidecar keyspace as vocab items
        // and hydrateMatchExercise reads them by id at runtime.
        if (block.exerciseType === "match") {
          const exercise = lookupExercise(block.exerciseId);
          if (exercise && exercise.type === "match") {
            for (const pair of exercise.data.pairs) {
              // imagePrompt presence is still the authoring signal that
              // this pair should have a resolved image (pairs with only a
              // fallback emoji are intentionally skipped).
              if (!pair.imagePrompt) continue;
              out.push({ kind: "match-pair", id: pair.id, query: pair.word });
            }
          }
        }
      }
    }
  }

  return out;
}
