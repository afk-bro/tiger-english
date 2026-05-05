/**
 * exerciseLookup.ts
 *
 * Flat map of every exercise ID → { prompt, correctAnswer } so the review
 * system can render meaningful drill cards from bare exercise_id strings.
 *
 * Keep in sync with unit-1.ts, unit-2.ts (and future unit-N.ts files).
 */

export interface ExerciseMeta {
  prompt: string;
  correctAnswer: string;
}

const lookup: Record<string, ExerciseMeta> = {
  // ── Unit 1 ──
  "u1-grammar-mcq-1": {
    prompt: "Choose the correct form: 'She ___ a student.'",
    correctAnswer: "is",
  },
  "u1-activities-mcq-1": {
    prompt: "Choose the correct response to: \"What is your name?\"",
    correctAnswer: "My name is Anna.",
  },
  "u1-activities-fb-1": {
    prompt: "___ is your address?",
    correctAnswer: "What",
  },
  "u1-activities-fb-2": {
    prompt: "What is your ___ number?",
    correctAnswer: "phone",
  },
  "u1-activities-mcq-2": {
    prompt: "Choose the correct response to: \"Thank you!\"",
    correctAnswer: "You're welcome.",
  },
  "u1-activities-mcq-3": {
    prompt: "Choose the correct response to: \"What is her name?\"",
    correctAnswer: "Her name is Maria.",
  },
  "u1-activities-mcq-4": {
    prompt: "Choose the correct word: \"___ are you from?\"",
    correctAnswer: "Where",
  },
  "u1-activities-mcq-5": {
    prompt: "Choose the correct response to: \"What is your first name?\"",
    correctAnswer: "My first name is Anna.",
  },
  "u1-activities-mcq-6": {
    prompt: "Choose the correct response to: \"What is your last name?\"",
    correctAnswer: "My last name is Schmidt.",
  },

  // ── Unit 2 ──
  "u2-grammar-mcq-1": {
    prompt: "What is the contraction for \"She is\"?",
    correctAnswer: "She's",
  },
  "u2-grammar-mcq-2": {
    prompt: "Choose the correct word: \"___ are they?\"",
    correctAnswer: "Where",
  },
  "u2-activities-mcq-1": {
    prompt: "Which one do you write on?",
    correctAnswer: "board",
  },
  "u2-activities-mcq-2": {
    prompt: "Where do you cook food?",
    correctAnswer: "kitchen",
  },
  "u2-activities-mcq-3": {
    prompt: "Where do you borrow books?",
    correctAnswer: "library",
  },
  "u2-activities-mcq-4": {
    prompt: "Which one is in your home, not in your classroom?",
    correctAnswer: "bedroom",
  },
  "u2-activities-mcq-5": {
    prompt: "Choose the response to: \"Where is Maria?\"",
    correctAnswer: "She's in the kitchen.",
  },
  "u2-activities-fb-1": {
    prompt: "Where ___ they?",
    correctAnswer: "are",
  },
  "u2-activities-mcq-6": {
    prompt: "Choose the response to: \"Where are the children?\"",
    correctAnswer: "They're in the yard.",
  },
  "u2-activities-fb-2": {
    prompt: "___ is the dictionary?",
    correctAnswer: "Where",
  },
  "u2-activities-mcq-7": {
    prompt: "What is the contraction for \"They are\"?",
    correctAnswer: "They're",
  },
  "u2-activities-mcq-8": {
    prompt: "What is the contraction for \"It is\"?",
    correctAnswer: "It's",
  },
  "u2-activities-fb-3": {
    prompt: "Make this shorter (use a contraction): \"He is at home.\" → ___ at home.",
    correctAnswer: "He's",
  },
  "u2-activities-mcq-9": {
    prompt: "Which sentence is correct?",
    correctAnswer: "We're at the bank.",
  },
};

/** Look up exercise metadata by ID. Returns null if not found. */
export function lookupExercise(exerciseId: string): ExerciseMeta | null {
  return lookup[exerciseId] ?? null;
}

/** Enrich a review item's prompt + answer using the exercise lookup.
 *  Returns the original values if the exercise isn't found in the lookup.
 */
export function enrichReviewPrompt(
  exerciseId: string,
  fallbackPrompt: string,
  fallbackAnswer: string,
): { prompt: string; answer: string } {
  const meta = lookupExercise(exerciseId);
  if (!meta) return { prompt: fallbackPrompt, answer: fallbackAnswer };
  return { prompt: meta.prompt, answer: meta.correctAnswer };
}
