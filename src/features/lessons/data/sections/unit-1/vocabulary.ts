// src/features/lessons/data/sections/unit-1/vocabulary.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const vocabulary: Section = {
  id: "u1-vocabulary",
  unitSlug: "unit-1",
  key: "vocabulary",
  title: "Vocabulary",
  blocks: [
    { id: "u1-vocab-1", type: "heading", content: "Key words for introductions" },
    {
      id: "u1-vocab-2",
      type: "text",
      content: "Learn these common words and phrases used when meeting people for the first time.",
    },
    {
      id: "u1-vocab-3",
      type: "vocab-list",
      items: [
        { word: "hello", translation: "สวัสดี", phonetic: "sa-wat-dee", example: "Hello, how are you?" },
        { word: "name", translation: "ชื่อ", phonetic: "cheu", example: "My name is Lin." },
        { word: "teacher", translation: "ครู", phonetic: "kroo", example: "She is a teacher." },
        { word: "student", translation: "นักเรียน", phonetic: "nak-rian", example: "I am a student." },
        { word: "friend", translation: "เพื่อน", phonetic: "pheuan", example: "He is my friend." },
        { word: "country", translation: "ประเทศ", phonetic: "pra-thet", example: "What country are you from?" },
        { word: "from", translation: "จาก", phonetic: "jaak", example: "I am from Bangkok." },
        { word: "nice", translation: "ดี", phonetic: "dee", example: "Nice to meet you." },
        { word: "thank you", translation: "ขอบคุณ", phonetic: "khop-khun", example: "Thank you very much." },
        { word: "yes", translation: "ใช่", phonetic: "chai", example: "Yes, I am a student." },
      ],
    },
  ],
};

registerSection(vocabulary);
export default vocabulary;
