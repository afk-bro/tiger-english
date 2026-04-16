// src/features/lessons/data/sections/unit-1/dialogues.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const dialogues: Section = {
  id: "u1-dialogues",
  unitSlug: "unit-1",
  key: "dialogues",
  title: "Dialogues",
  blocks: [
    { id: "u1-dl-1", type: "heading", content: "Meeting someone new" },
    {
      id: "u1-dl-2",
      type: "text",
      content: "Read through this conversation between two people meeting for the first time.",
    },
    {
      id: "u1-dl-3",
      type: "dialogue",
      lines: [
        { speaker: "Anna", text: "Hello! My name is Anna.", translation: "สวัสดี! ฉันชื่ออันนา" },
        { speaker: "Somchai", text: "Hi Anna. I am Somchai.", translation: "สวัสดีอันนา ผมชื่อสมชาย" },
        { speaker: "Anna", text: "Nice to meet you. Are you a student?", translation: "ยินดีที่ได้รู้จัก คุณเป็นนักเรียนหรือ?" },
        { speaker: "Somchai", text: "Yes, I am. I am from Thailand.", translation: "ใช่ครับ ผมมาจากประเทศไทย" },
        { speaker: "Anna", text: "That is great! I am from Germany.", translation: "ดีมาก! ฉันมาจากเยอรมนี" },
      ],
    },
  ],
};

registerSection(dialogues);
export default dialogues;
