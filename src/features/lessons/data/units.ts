// src/features/lessons/data/units.ts
import type { Unit } from "../lesson.types";

export const units: Unit[] = [
  {
    slug: "unit-1",
    number: 1,
    title: "To Be: Introduction",
    topic: "Personal information & meeting people",
    grammarFocus: "Present tense of 'to be' (am / is / are)",
    estimatedMinutes: 30,
    status: "available",
    sections: [
      { key: "overview", title: "Overview", estimatedMinutes: 3 },
      { key: "grammar", title: "Grammar", estimatedMinutes: 8 },
      { key: "vocabulary", title: "Vocabulary", estimatedMinutes: 5 },
      { key: "dialogues", title: "Dialogues", estimatedMinutes: 6 },
      { key: "activities", title: "Activities", estimatedMinutes: 8 },
    ],
  },
  {
    slug: "unit-2",
    number: 2,
    title: "To Be: Yes/No Questions",
    topic: "Classroom, countries, nationalities",
    grammarFocus: "Subject pronouns & singular/plural 'to be'",
    estimatedMinutes: 45,
    status: "coming-soon",
    sections: [],
  },
  {
    slug: "unit-3",
    number: 3,
    title: "Present Continuous Tense",
    topic: "Everyday activities",
    grammarFocus: "Present continuous (am/is/are + -ing)",
    estimatedMinutes: 45,
    status: "coming-soon",
    sections: [],
  },
  {
    slug: "unit-4",
    number: 4,
    title: "To Be: Short Answers & Possessive Adjectives",
    topic: "Family members & descriptions",
    grammarFocus: "Possessive adjectives (my, your, his, her…)",
    estimatedMinutes: 45,
    status: "coming-soon",
    sections: [],
  },
];
