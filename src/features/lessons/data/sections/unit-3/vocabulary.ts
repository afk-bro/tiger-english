// src/features/lessons/data/sections/unit-3/vocabulary.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const vocabulary: Section = {
  id: "u3-vocabulary",
  unitSlug: "unit-3",
  key: "vocabulary",
  blocks: [
    {
      id: "u3-vocab-1-h",
      type: "heading",
      content: "Greetings",
      translations: { th: "คำทักทาย", vi: "Lời chào", "zh-CN": "问候语" },
    },
    {
      id: "u3-vocab-1-t",
      type: "text",
      content: "Words and phrases for saying hello, depending on the time of day and how formal you want to be.",
      translations: {
        th: "คำและวลีสำหรับการทักทาย ขึ้นอยู่กับช่วงเวลาของวันและระดับความเป็นทางการที่คุณต้องการ",
        vi: "Từ và cụm từ dùng để chào hỏi, tuỳ vào thời gian trong ngày và mức độ trang trọng bạn muốn.",
        "zh-CN": "用于问候的词语和短语，取决于一天中的时间以及你想要的正式程度。",
      },
    },
    {
      id: "u3-vocab-1",
      type: "vocab-list",
      // All greetings are abstract / formulaic phrases, not physical
      // objects — `noImage: true` keeps the lesson-images pipeline
      // from generating misleading thumbnails for them. Cards render
      // the word + phonetic + translation only.
      items: [
        { id: "u3-v-hello", word: "hello", phonetic: "heh-loh", translations: { th: "สวัสดี", vi: "xin chào", "zh-CN": "你好" }, noImage: true },
        { id: "u3-v-hi", word: "hi", phonetic: "hahy", translations: { th: "หวัดดี", vi: "chào", "zh-CN": "嗨" }, noImage: true },
        { id: "u3-v-hey", word: "hey", phonetic: "hey", translations: { th: "เฮ้", vi: "này", "zh-CN": "嘿" }, noImage: true },
        { id: "u3-v-good-morning", word: "good morning", phonetic: "good mawr-ning", translations: { th: "อรุณสวัสดิ์", vi: "chào buổi sáng", "zh-CN": "早上好" }, noImage: true },
        { id: "u3-v-good-afternoon", word: "good afternoon", phonetic: "good af-ter-noon", translations: { th: "สวัสดีตอนบ่าย", vi: "chào buổi chiều", "zh-CN": "下午好" }, noImage: true },
        { id: "u3-v-good-evening", word: "good evening", phonetic: "good eev-ning", translations: { th: "สวัสดีตอนเย็น", vi: "chào buổi tối", "zh-CN": "晚上好" }, noImage: true },
      ],
    },
    {
      id: "u3-vocab-2-h",
      type: "heading",
      content: "Asking 'How are you?'",
      translations: { th: "การถาม 'How are you?'", vi: "Hỏi 'How are you?'", "zh-CN": "问 'How are you?'" },
    },
    {
      id: "u3-vocab-2-t",
      type: "text",
      content: "Common short replies you can use when someone asks how you are.",
      translations: {
        th: "คำตอบสั้นๆ ที่ใช้บ่อยเมื่อมีคนถามว่าคุณสบายดีไหม",
        vi: "Những câu trả lời ngắn phổ biến khi ai đó hỏi bạn khoẻ không.",
        "zh-CN": "当有人问你近况时常用的简短回答。",
      },
    },
    {
      id: "u3-vocab-2",
      type: "vocab-list",
      items: [
        { id: "u3-v-how-are-you", word: "how are you", phonetic: "how ahr yoo", translations: { th: "สบายดีไหม", vi: "bạn khoẻ không", "zh-CN": "你好吗" }, noImage: true },
        { id: "u3-v-fine", word: "fine", phonetic: "fahyn", translations: { th: "สบายดี", vi: "khoẻ", "zh-CN": "很好" }, noImage: true },
        { id: "u3-v-good", word: "good", phonetic: "good", translations: { th: "ดี", vi: "ổn", "zh-CN": "不错" }, noImage: true },
        { id: "u3-v-great", word: "great", phonetic: "greyt", translations: { th: "เยี่ยมมาก", vi: "tuyệt", "zh-CN": "很棒" }, noImage: true },
        { id: "u3-v-not-bad", word: "not bad", phonetic: "not bad", translations: { th: "ก็ไม่เลว", vi: "không tệ", "zh-CN": "还不错" }, noImage: true },
        { id: "u3-v-and-you", word: "and you", phonetic: "and yoo", translations: { th: "แล้วคุณล่ะ", vi: "còn bạn", "zh-CN": "你呢" }, noImage: true },
      ],
    },
    {
      id: "u3-vocab-3-h",
      type: "heading",
      content: "Saying goodbye",
      translations: { th: "การกล่าวลา", vi: "Lời tạm biệt", "zh-CN": "告别" },
    },
    {
      id: "u3-vocab-3-t",
      type: "text",
      content: "Words and phrases for ending a conversation, ranging from casual to formal.",
      translations: {
        th: "คำและวลีสำหรับการจบบทสนทนา ตั้งแต่ภาษาพูดไปจนถึงทางการ",
        vi: "Từ và cụm từ dùng để kết thúc cuộc trò chuyện, từ thân mật đến trang trọng.",
        "zh-CN": "用于结束对话的词语和短语，从随意到正式。",
      },
    },
    {
      id: "u3-vocab-3",
      type: "vocab-list",
      items: [
        { id: "u3-v-goodbye", word: "goodbye", phonetic: "good-bahy", translations: { th: "ลาก่อน", vi: "tạm biệt", "zh-CN": "再见" }, noImage: true },
        { id: "u3-v-bye", word: "bye", phonetic: "bahy", translations: { th: "บาย", vi: "tạm biệt", "zh-CN": "拜拜" }, noImage: true },
        { id: "u3-v-see-you", word: "see you", phonetic: "see yoo", translations: { th: "เจอกัน", vi: "hẹn gặp lại", "zh-CN": "回头见" }, noImage: true },
        { id: "u3-v-see-you-later", word: "see you later", phonetic: "see yoo ley-ter", translations: { th: "เจอกันทีหลัง", vi: "hẹn gặp lại sau", "zh-CN": "待会儿见" }, noImage: true },
        { id: "u3-v-see-you-tomorrow", word: "see you tomorrow", phonetic: "see yoo tuh-mor-oh", translations: { th: "เจอกันพรุ่งนี้", vi: "hẹn gặp lại ngày mai", "zh-CN": "明天见" }, noImage: true },
        { id: "u3-v-take-care", word: "take care", phonetic: "teyk kair", translations: { th: "ดูแลตัวเอง", vi: "bảo trọng", "zh-CN": "保重" }, noImage: true },
        { id: "u3-v-good-night", word: "good night", phonetic: "good nahyt", translations: { th: "ราตรีสวัสดิ์", vi: "chúc ngủ ngon", "zh-CN": "晚安" }, noImage: true },
      ],
    },
  ],
};

registerSection(vocabulary);
export default vocabulary;
