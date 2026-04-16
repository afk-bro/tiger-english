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
        { id: "u1-v-hello", word: "hello", phonetic: "heh-loh", translations: { th: "สวัสดี", vi: "xin chào", "zh-CN": "你好" } },
        { id: "u1-v-name", word: "name", phonetic: "neym", translations: { th: "ชื่อ", vi: "tên", "zh-CN": "名字" } },
        { id: "u1-v-teacher", word: "teacher", phonetic: "tee-cher", translations: { th: "ครู", vi: "giáo viên", "zh-CN": "老师" } },
        { id: "u1-v-student", word: "student", phonetic: "stoo-dent", translations: { th: "นักเรียน", vi: "học sinh", "zh-CN": "学生" } },
        { id: "u1-v-friend", word: "friend", phonetic: "frend", translations: { th: "เพื่อน", vi: "bạn", "zh-CN": "朋友" } },
        { id: "u1-v-country", word: "country", phonetic: "kuhn-tree", translations: { th: "ประเทศ", vi: "quốc gia", "zh-CN": "国家" } },
        { id: "u1-v-from", word: "from", phonetic: "fruhm", translations: { th: "จาก", vi: "từ", "zh-CN": "来自" } },
        { id: "u1-v-nice", word: "nice", phonetic: "nys", translations: { th: "ดี", vi: "tốt", "zh-CN": "好的" } },
        { id: "u1-v-thankyou", word: "thank you", phonetic: "thangk-yoo", translations: { th: "ขอบคุณ", vi: "cảm ơn", "zh-CN": "谢谢" } },
        { id: "u1-v-yes", word: "yes", phonetic: "yes", translations: { th: "ใช่", vi: "vâng", "zh-CN": "是的" } },
      ],
    },
  ],
};

registerSection(vocabulary);
export default vocabulary;
