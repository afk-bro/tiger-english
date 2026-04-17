// src/features/lessons/data/sections/unit-1/grammar.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const grammar: Section = {
  id: "u1-grammar",
  unitSlug: "unit-1",
  key: "grammar",
  title: "Grammar",
  blocks: [
    {
      id: "u1-gr-1",
      type: "heading",
      content: "Present tense of 'to be'",
      translations: {
        th: "กาลปัจจุบันของ 'to be'",
        vi: "Thì hiện tại của 'to be'",
        "zh-CN": "'to be' 的现在时",
      },
    },
    {
      id: "u1-gr-2",
      type: "text",
      content: "The verb 'to be' is one of the most important verbs in English. It changes form depending on the subject: I am, you are, he/she/it is, we are, they are.",
      translations: {
        th: "กริยา 'to be' เป็นหนึ่งในกริยาที่สำคัญที่สุดในภาษาอังกฤษ มันเปลี่ยนรูปตามประธาน: I am, you are, he/she/it is, we are, they are",
        vi: "Động từ 'to be' là một trong những động từ quan trọng nhất trong tiếng Anh. Nó thay đổi theo chủ ngữ: I am, you are, he/she/it is, we are, they are.",
        "zh-CN": "动词 'to be' 是英语中最重要的动词之一。它会根据主语变化：I am, you are, he/she/it is, we are, they are。",
      },
    },
    {
      id: "u1-gr-3",
      type: "examples",
      items: [
        { id: "u1-ex-i-happy", english: "I am happy.", translations: { th: "ฉันมีความสุข" } },
        { id: "u1-ex-you-tall", english: "You are tall.", translations: { th: "คุณสูง" } },
        { id: "u1-ex-he-japan", english: "He is from Japan.", translations: { th: "เขามาจากญี่ปุ่น" } },
      ],
    },
    {
      id: "u1-gr-4",
      type: "callout",
      variant: "note",
      content: "In casual speech, English speakers often use contractions: I'm, you're, he's, she's, we're, they're.",
      translations: {
        th: "ในการพูดทั่วไป ผู้พูดภาษาอังกฤษมักจะใช้คำย่อ: I'm, you're, he's, she's, we're, they're",
        vi: "Trong lời nói thông thường, người nói tiếng Anh thường dùng dạng rút gọn: I'm, you're, he's, she's, we're, they're.",
        "zh-CN": "在日常口语中，说英语的人常常使用缩写形式：I'm, you're, he's, she's, we're, they're。",
      },
    },
    {
      id: "u1-gr-5",
      type: "heading",
      content: "Quick check",
      translations: {
        th: "ตรวจสอบอย่างรวดเร็ว",
        vi: "Kiểm tra nhanh",
        "zh-CN": "快速检查",
      },
    },
    { id: "u1-gr-6", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u1-grammar-mcq-1" },
  ],
};

registerSection(grammar);
export default grammar;
