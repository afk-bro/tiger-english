// src/features/lessons/data/sections/unit-1/overview.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const overview: Section = {
  id: "u1-overview",
  unitSlug: "unit-1",
  key: "overview",
  title: "Overview",
  blocks: [
    { id: "u1-ov-1", type: "heading", content: "What you'll learn" },
    {
      id: "u1-ov-2",
      type: "text",
      content: "In this unit, you'll learn how to introduce yourself, greet people, and share basic personal information using the present tense of 'to be' (am, is, are).",
    },
    {
      id: "u1-ov-3",
      type: "callout",
      variant: "tip",
      content: "These are some of the most common phrases in English. You'll use them every day!",
    },
    { id: "u1-ov-4", type: "heading", content: "Real-world context" },
    {
      id: "u1-ov-5",
      type: "text",
      content: "Meeting new people at work, introducing yourself at school, filling out a simple form, or starting a conversation with a stranger — all of these situations use the patterns you'll practice here.",
    },
    { id: "u1-ov-6", type: "heading", content: "Key phrases" },
    {
      id: "u1-ov-7",
      type: "examples",
      items: [
        { english: "Hello, my name is Somchai.", translation: "สวัสดีครับ ผมชื่อสมชาย" },
        { english: "I am from Thailand.", translation: "ผมมาจากประเทศไทย" },
        { english: "She is a teacher.", translation: "เธอเป็นครู" },
        { english: "We are students.", translation: "พวกเราเป็นนักเรียน" },
        { english: "Nice to meet you.", translation: "ยินดีที่ได้รู้จัก" },
      ],
    },
  ],
};

registerSection(overview);
export default overview;
