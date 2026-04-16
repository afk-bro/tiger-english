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
        { id: "u1-d-1", speaker: "Anna", text: "Hello! My name is Anna.", translations: { th: "สวัสดี! ฉันชื่ออันนา", vi: "Xin chào! Tôi tên là Anna.", "zh-CN": "你好！我叫Anna。" } },
        { id: "u1-d-2", speaker: "Somchai", text: "Hi Anna. I am Somchai.", translations: { th: "สวัสดีอันนา ผมชื่อสมชาย", vi: "Chào Anna. Tôi là Somchai.", "zh-CN": "你好Anna。我是Somchai。" } },
        { id: "u1-d-3", speaker: "Anna", text: "Nice to meet you. Are you a student?", translations: { th: "ยินดีที่ได้รู้จัก คุณเป็นนักเรียนหรือ?", vi: "Rất vui được gặp bạn. Bạn là học sinh à?", "zh-CN": "很高兴认识你。你是学生吗？" } },
        { id: "u1-d-4", speaker: "Somchai", text: "Yes, I am. I am from Thailand.", translations: { th: "ใช่ครับ ผมมาจากประเทศไทย", vi: "Vâng. Tôi đến từ Thái Lan.", "zh-CN": "是的。我来自泰国。" } },
        { id: "u1-d-5", speaker: "Anna", text: "That is great! I am from Germany.", translations: { th: "ดีมาก! ฉันมาจากเยอรมนี", vi: "Tuyệt vời! Tôi đến từ Đức.", "zh-CN": "太好了！我来自德国。" } },
      ],
    },
  ],
};

registerSection(dialogues);
export default dialogues;
