// src/features/lessons/data/exerciseRegistry.ts
// Single source of truth mapping `exerciseId` → tagged exercise data.
//
// Lives here (not inside ExerciseBlock.tsx) so non-React callers — most
// importantly scripts/generate-lesson-images.ts — can enumerate exercise
// data without pulling in the React tree. The pipeline needs this to
// emit per-pair Leonardo candidates for `match` exercises, which the
// SectionBlock alone doesn't expose (it only carries `exerciseId`).

import * as unit1Exercises from "./exercises/unit-1";
import * as unit2Exercises from "./exercises/unit-2";
import type {
  McqExercise,
  FillBlankExercise,
  MatchExercise,
} from "@/components/exercises/exercises.types";

export type TaggedExercise =
  | { type: "multiple-choice"; data: McqExercise }
  | { type: "fill-blank"; data: FillBlankExercise }
  | { type: "match"; data: MatchExercise };

export const exerciseRegistry: Record<string, TaggedExercise> = {
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
  // unit-2 activities: match-the-word-to-image
  "u2-activities-match-1": { type: "match", data: unit2Exercises.activitiesMatchClassroomItems },
};

export function lookupExercise(exerciseId: string): TaggedExercise | undefined {
  return exerciseRegistry[exerciseId];
}
