import MultipleChoice from "@/components/exercises/MultipleChoice";
import FillBlank from "@/components/exercises/FillBlank";
import type { ExerciseType } from "../../lesson.types";
import * as unit1Exercises from "../../data/exercises/unit-1";
import * as unit2Exercises from "../../data/exercises/unit-2";
import type { McqExercise, FillBlankExercise } from "@/components/exercises/exercises.types";
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

type TaggedExercise =
  | { type: "multiple-choice"; data: McqExercise }
  | { type: "fill-blank"; data: FillBlankExercise };

const exerciseMap: Record<string, TaggedExercise> = {
  "u1-grammar-mcq-1": { type: "multiple-choice", data: unit1Exercises.grammarMcq1 },
  "u1-activities-mcq-1": { type: "multiple-choice", data: unit1Exercises.activitiesNameMcq },
  "u1-activities-fb-1": { type: "fill-blank", data: unit1Exercises.activitiesAddressFillBlank },
  "u1-activities-fb-2": { type: "fill-blank", data: unit1Exercises.activitiesPhoneFillBlank },
  "u1-activities-mcq-2": { type: "multiple-choice", data: unit1Exercises.activitiesThanksMcq },
  "u1-activities-mcq-3": { type: "multiple-choice", data: unit1Exercises.activitiesThirdPersonMcq },
  "u1-activities-mcq-4": { type: "multiple-choice", data: unit1Exercises.activitiesWhereMcq },
  "u1-activities-mcq-5": { type: "multiple-choice", data: unit1Exercises.activitiesFirstNameMcq },
  "u1-activities-mcq-6": { type: "multiple-choice", data: unit1Exercises.activitiesLastNameMcq },
  // unit-2 grammar
  "u2-grammar-mcq-1": { type: "multiple-choice", data: unit2Exercises.grammarMcqContractions },
  "u2-grammar-mcq-2": { type: "multiple-choice", data: unit2Exercises.grammarMcqWhereWord },
  // unit-2 activities: vocabulary recognition
  "u2-activities-mcq-1": { type: "multiple-choice", data: unit2Exercises.activitiesVocabClassroomMcq },
  "u2-activities-mcq-2": { type: "multiple-choice", data: unit2Exercises.activitiesVocabHomeMcq },
  "u2-activities-mcq-3": { type: "multiple-choice", data: unit2Exercises.activitiesVocabTownMcq },
  "u2-activities-mcq-4": { type: "multiple-choice", data: unit2Exercises.activitiesVocabMixedMcq },
  // unit-2 activities: 'Where' + pronouns
  "u2-activities-mcq-5": { type: "multiple-choice", data: unit2Exercises.activitiesWhereResponseMariaMcq },
  "u2-activities-fb-1": { type: "fill-blank", data: unit2Exercises.activitiesWhereAreFb },
  "u2-activities-mcq-6": { type: "multiple-choice", data: unit2Exercises.activitiesWhereResponseChildrenMcq },
  "u2-activities-fb-2": { type: "fill-blank", data: unit2Exercises.activitiesWhereDictionaryFb },
  // unit-2 activities: contractions
  "u2-activities-mcq-7": { type: "multiple-choice", data: unit2Exercises.activitiesContractionTheyMcq },
  "u2-activities-mcq-8": { type: "multiple-choice", data: unit2Exercises.activitiesContractionItMcq },
  "u2-activities-fb-3": { type: "fill-blank", data: unit2Exercises.activitiesContractionShortenFb },
  "u2-activities-mcq-9": { type: "multiple-choice", data: unit2Exercises.activitiesContractionCorrectMcq },
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
  if (exerciseType === "match") {
    return (
      <div className="card p-6 opacity-60 text-center">
        <p className="text-sm font-medium text-semantic-text-muted">Coming soon</p>
      </div>
    );
  }

  const entry = exerciseMap[exerciseId];

  if (!entry || entry.type !== exerciseType) {
    return (
      <div className="card p-4 opacity-60">
        <p className="text-sm text-semantic-text-muted">Exercise not found.</p>
      </div>
    );
  }

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
    </div>
  );
}
