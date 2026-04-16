import MultipleChoice from "@/components/exercises/MultipleChoice";
import FillBlank from "@/components/exercises/FillBlank";
import type { ExerciseType } from "../../lesson.types";
import * as unit1Exercises from "../../data/exercises/unit-1";
import type { McqExercise, FillBlankExercise } from "@/components/exercises/exercises.types";

type Props = { exerciseType: ExerciseType; exerciseId: string };

const exerciseMap: Record<string, McqExercise | FillBlankExercise> = {
  "u1-grammar-mcq-1": unit1Exercises.grammarMcq1,
  "u1-activities-fb-1": unit1Exercises.activitiesFillBlank1,
};

export default function ExerciseBlock({ exerciseType, exerciseId }: Props) {
  const exercise = exerciseMap[exerciseId];

  if (!exercise) {
    return (
      <div className="card p-4 opacity-60">
        <p className="text-sm text-semantic-text-muted">Exercise not found.</p>
      </div>
    );
  }

  if (exerciseType === "match") {
    return (
      <div className="card p-6 opacity-60 text-center">
        <p className="text-sm font-medium text-semantic-text-muted">Coming soon</p>
      </div>
    );
  }

  return (
    <div className="card p-6 shadow-sm border border-semantic-border">
      {exerciseType === "multiple-choice" && <MultipleChoice exercise={exercise as McqExercise} />}
      {exerciseType === "fill-blank" && <FillBlank exercise={exercise as FillBlankExercise} />}
    </div>
  );
}
