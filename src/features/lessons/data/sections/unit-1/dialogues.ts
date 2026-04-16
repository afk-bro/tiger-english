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
        { id: "u1-d-1", speaker: "Anna", text: "Hello! My name is Anna.", translations: { th: "สวัสดี! ฉันชื่ออันนา" } },
        { id: "u1-d-2", speaker: "Somchai", text: "Hi Anna. I am Somchai.", translations: { th: "สวัสดีอันนา ผมชื่อสมชาย" } },
        { id: "u1-d-3", speaker: "Anna", text: "Nice to meet you. Are you a student?", translations: { th: "ยินดีที่ได้รู้จัก คุณเป็นนักเรียนหรือ?" } },
        { id: "u1-d-4", speaker: "Somchai", text: "Yes, I am. I am from Thailand.", translations: { th: "ใช่ครับ ผมมาจากประเทศไทย" } },
        { id: "u1-d-5", speaker: "Anna", text: "That is great! I am from Germany.", translations: { th: "ดีมาก! ฉันมาจากเยอรมนี" } },
      ],
    },
  ],
};

registerSection(dialogues);
export default dialogues;
