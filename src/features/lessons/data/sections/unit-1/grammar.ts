// src/features/lessons/data/sections/unit-1/grammar.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const grammar: Section = {
  id: "u1-grammar",
  unitSlug: "unit-1",
  key: "grammar",
  title: "Grammar",
  blocks: [
    { id: "u1-gr-1", type: "heading", content: "Present tense of 'to be'" },
    {
      id: "u1-gr-2",
      type: "text",
      content: "The verb 'to be' is one of the most important verbs in English. It changes form depending on the subject: I am, you are, he/she/it is, we are, they are.",
    },
    {
      id: "u1-gr-3",
      type: "examples",
      items: [
        { english: "I am happy.", translation: "ฉันมีความสุข" },
        { english: "You are tall.", translation: "คุณสูง" },
        { english: "He is from Japan.", translation: "เขามาจากญี่ปุ่น" },
      ],
    },
    {
      id: "u1-gr-4",
      type: "callout",
      variant: "note",
      content: "In casual speech, English speakers often use contractions: I'm, you're, he's, she's, we're, they're.",
    },
    { id: "u1-gr-5", type: "heading", content: "Quick check" },
    { id: "u1-gr-6", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u1-grammar-mcq-1" },
  ],
};

registerSection(grammar);
export default grammar;
