// src/features/lessons/data/sections/unit-1/vocabulary.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const vocabulary: Section = {
  id: "u1-vocabulary",
  unitSlug: "unit-1",
  key: "vocabulary",
  blocks: [
    {
      id: "u1-vocab-1",
      type: "heading",
      content: "Key words for introductions",
      translations: {
        th: "คำสำคัญสำหรับการแนะนำตัว",
        vi: "Từ vựng quan trọng để giới thiệu",
        "zh-CN": "介绍时的关键词",
      },
    },
    {
      id: "u1-vocab-2",
      type: "text",
      content: "Learn these common words and phrases used when meeting people for the first time.",
      translations: {
        th: "เรียนรู้คำและวลีที่พบบ่อยเหล่านี้ซึ่งใช้เมื่อพบผู้คนเป็นครั้งแรก",
        vi: "Hãy học những từ và cụm từ phổ biến này được dùng khi gặp gỡ mọi người lần đầu.",
        "zh-CN": "学习这些第一次见面时常用的单词和短语。",
      },
    },
    {
      id: "u1-vocab-3",
      type: "vocab-list",
      items: [
        { id: "u1-v-hello", word: "hello", phonetic: "heh-loh", translations: { th: "สวัสดี", vi: "xin chào", "zh-CN": "你好" } },
        { id: "u1-v-what", word: "what", phonetic: "wuht", translations: { th: "อะไร", vi: "gì", "zh-CN": "什么" } },
        { id: "u1-v-is", word: "is", phonetic: "iz", translations: { th: "เป็น / คือ", vi: "là", "zh-CN": "是" } },
        { id: "u1-v-am", word: "am", phonetic: "am", translations: { th: "เป็น / คือ", vi: "là", "zh-CN": "是" } },
        { id: "u1-v-my", word: "my", phonetic: "mahy", translations: { th: "ของฉัน", vi: "của tôi", "zh-CN": "我的" } },
        { id: "u1-v-your", word: "your", phonetic: "yor", translations: { th: "ของคุณ", vi: "của bạn", "zh-CN": "你的" } },
        { id: "u1-v-name", word: "name", phonetic: "neym", translations: { th: "ชื่อ", vi: "tên", "zh-CN": "名字" } },
        { id: "u1-v-first", word: "first", phonetic: "furst", translations: { vi: "đầu tiên" } },
        { id: "u1-v-last", word: "last", phonetic: "last", translations: { vi: "cuối cùng" } },
        { id: "u1-v-address", word: "address", phonetic: "uh-dres", translations: { th: "ที่อยู่", vi: "địa chỉ", "zh-CN": "地址" } },
        { id: "u1-v-email-address", word: "email address", phonetic: "ee-meyl uh-dres", translations: { vi: "địa chỉ email" } },
        { id: "u1-v-phone-number", word: "phone number", phonetic: "fohn nuhm-ber", translations: { th: "เบอร์โทรศัพท์", vi: "số điện thoại", "zh-CN": "电话号码" } },
        { id: "u1-v-apartment-number", word: "apartment number", phonetic: "uh-part-ment nuhm-ber", translations: { vi: "số căn hộ" } },
        { id: "u1-v-from", word: "from", phonetic: "fruhm", translations: { th: "จาก", vi: "từ", "zh-CN": "来自" } },
        { id: "u1-v-thank-you", word: "thank you", phonetic: "thangk-yoo", translations: { th: "ขอบคุณ", vi: "cảm ơn", "zh-CN": "谢谢" } },
        { id: "u1-v-i", word: "i", phonetic: "ahy", translations: { th: "ฉัน", vi: "tôi", "zh-CN": "我" } },
      ],
    },
  ],
};

registerSection(vocabulary);
export default vocabulary;
