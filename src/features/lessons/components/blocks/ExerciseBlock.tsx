import MultipleChoice from "@/components/exercises/MultipleChoice";
import FillBlank from "@/components/exercises/FillBlank";
import type { ExerciseType } from "../../lesson.types";
import * as unit1Exercises from "../../data/exercises/unit-1";
import type { McqExercise, FillBlankExercise } from "@/components/exercises/exercises.types";

type Props = {
  exerciseType: ExerciseType;
  exerciseId: string;
  imageUrl?: string;
  onCorrect?: () => void;
};

type TaggedExercise =
  | { type: "multiple-choice"; data: McqExercise }
  | { type: "fill-blank"; data: FillBlankExercise };

const exerciseMap: Record<string, TaggedExercise> = {
  "u1-grammar-mcq-1": { type: "multiple-choice", data: unit1Exercises.grammarMcq1 },
  "u1-activities-fb-1": { type: "fill-blank", data: unit1Exercises.activitiesFillBlank1 },
};

export default function ExerciseBlock({ exerciseType, exerciseId, imageUrl, onCorrect }: Props) {
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
      {imageUrl && (
        <img src={imageUrl} alt="" className="w-full rounded-lg object-cover" />
      )}
      {entry.type === "multiple-choice" && <MultipleChoice exercise={entry.data} onCorrect={onCorrect} />}
      {entry.type === "fill-blank" && <FillBlank exercise={entry.data} onCorrect={onCorrect} />}
    </div>
  );
}
