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
        { id: "u1-ex-hello-name", english: "Hello, my name is Somchai.", translations: { th: "สวัสดีครับ ผมชื่อสมชาย" } },
        { id: "u1-ex-from-thailand", english: "I am from Thailand.", translations: { th: "ผมมาจากประเทศไทย" } },
        { id: "u1-ex-she-teacher", english: "She is a teacher.", translations: { th: "เธอเป็นครู" } },
        { id: "u1-ex-we-students", english: "We are students.", translations: { th: "พวกเราเป็นนักเรียน" } },
        { id: "u1-ex-nice-meet", english: "Nice to meet you.", translations: { th: "ยินดีที่ได้รู้จัก" } },
      ],
    },
  ],
};

registerSection(overview);
export default overview;
