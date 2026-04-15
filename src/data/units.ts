export type UnitStatus = "available" | "coming-soon";

export type Unit = {
  slug: string;
  number: number;
  title: string;
  topic: string;
  grammarFocus: string;
  estimatedMinutes: number;
  status: UnitStatus;
};

export const units: Unit[] = [
  {
    slug: "unit-1",
    number: 1,
    title: "To Be: Introduction",
    topic: "Personal information & meeting people",
    grammarFocus: "Present tense of 'to be' (am / is / are)",
    estimatedMinutes: 45,
    status: "available",
  },
  {
    slug: "unit-2",
    number: 2,
    title: "To Be: Yes/No Questions",
    topic: "Classroom, countries, nationalities",
    grammarFocus: "Subject pronouns & singular/plural 'to be'",
    estimatedMinutes: 45,
    status: "coming-soon",
  },
  {
    slug: "unit-3",
    number: 3,
    title: "Present Continuous Tense",
    topic: "Everyday activities",
    grammarFocus: "Present continuous (am/is/are + -ing)",
    estimatedMinutes: 45,
    status: "coming-soon",
  },
  {
    slug: "unit-4",
    number: 4,
    title: "To Be: Short Answers & Possessive Adjectives",
    topic: "Family members & descriptions",
    grammarFocus: "Possessive adjectives (my, your, his, her…)",
    estimatedMinutes: 45,
    status: "coming-soon",
  },
];

export function findUnitBySlug(slug: string): Unit | undefined {
  return units.find((u) => u.slug === slug);
}
