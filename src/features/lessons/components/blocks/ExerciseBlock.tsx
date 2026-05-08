import MultipleChoice from "@/components/exercises/MultipleChoice";
import FillBlank from "@/components/exercises/FillBlank";
import MatchPairs from "@/components/exercises/MatchPairs";
import type { ExerciseType } from "../../lesson.types";
import { lookupExercise } from "../../data/exerciseRegistry";
import { hydrateMatchExercise } from "../../data/imageHydration";
import { unitImagesSidecars } from "../../data/images";
import { ProgressAPI } from "@/lib/api/progress";
import { srcSetFor } from "@/lib/storageImage";

type Props = {
  exerciseType: ExerciseType;
  exerciseId: string;
  imageUrl?: string;
  imageAlt?: string;
  onCorrect?: () => void;
  unitSlug: string;
  sectionKey: string;
};

export default function ExerciseBlock({ exerciseType, exerciseId, imageUrl, imageAlt, onCorrect, unitSlug, sectionKey }: Props) {
  const handleAttempt = (isCorrect: boolean) => {
    void ProgressAPI.attemptExercise({
      unitSlug,
      sectionKey,
      exerciseId,
      isCorrect,
    });
  };
  const entry = lookupExercise(exerciseId);

  if (!entry || entry.type !== exerciseType) {
    return (
      <div className="card p-4 opacity-60">
        <p className="text-sm text-semantic-text-muted">Exercise not found.</p>
      </div>
    );
  }

  // Hydrate per-pair imageUrls from the unit sidecar before passing to
  // MatchPairs. Block-level hydration (in hydrateSection) doesn't reach
  // pair data because pairs live inside the exercise registry, not on
  // the SectionBlock — see hydrateMatchExercise for the rationale.
  const matchData =
    entry.type === "match"
      ? hydrateMatchExercise(entry.data, unitImagesSidecars[unitSlug] ?? {})
      : null;

  return (
    <div className="card p-6 shadow-sm border border-semantic-border">
      {/* alt is intentionally empty when imageAlt isn't provided — the
          image is decorative in that case and screen readers should
          skip it. Image-prompt exercises ("choose what's in the
          picture") MUST set imageAlt on the block data so the question
          remains answerable for screen reader users. See SectionBlock
          in lesson.types.ts for the full convention. */}
      {imageUrl && (() => {
        // Card body renders ~700–800px wide on desktop and full-width on
        // mobile. Request 768 for 1×; the 2× variant (1536) is capped by
        // Supabase to the 1024 source, which is what retina users get.
        const { src, srcSet } = srcSetFor(imageUrl, 768);
        return (
          <img
            src={src}
            srcSet={srcSet}
            alt={imageAlt ?? ""}
            width={1024}
            height={1024}
            loading="lazy"
            decoding="async"
            className="w-full rounded-lg mb-4 object-cover"
          />
        );
      })()}
      {entry.type === "multiple-choice" && <MultipleChoice exercise={entry.data} onCorrect={onCorrect} onAttempt={handleAttempt} />}
      {entry.type === "fill-blank" && <FillBlank exercise={entry.data} onCorrect={onCorrect} onAttempt={handleAttempt} />}
      {entry.type === "match" && matchData && <MatchPairs exercise={matchData} onCorrect={onCorrect} onAttempt={handleAttempt} />}
    </div>
  );
}
