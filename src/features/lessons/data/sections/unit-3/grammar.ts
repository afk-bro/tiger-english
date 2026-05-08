// src/features/lessons/data/sections/unit-3/grammar.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const grammar: Section = {
  id: "u3-grammar",
  unitSlug: "unit-3",
  key: "grammar",
  blocks: [
    {
      id: "u3-gr-1",
      type: "heading",
      content: "Greetings by time of day",
      translations: {
        th: "คำทักทายตามช่วงเวลาของวัน",
        vi: "Lời chào theo thời gian trong ngày",
        "zh-CN": "按时间问候",
      },
    },
    {
      id: "u3-gr-2",
      type: "text",
      content: "English speakers use different greetings depending on the time of day. 'Good morning' is used until about noon. 'Good afternoon' is used between noon and around 6 p.m. 'Good evening' is used after that. 'Hi' and 'Hello' work at any time.",
      translations: {
        th: "ผู้พูดภาษาอังกฤษใช้คำทักทายแตกต่างกันไปตามช่วงเวลาของวัน 'Good morning' ใช้จนถึงประมาณเที่ยง 'Good afternoon' ใช้ระหว่างเที่ยงถึงประมาณ 18.00 น. 'Good evening' ใช้หลังจากนั้น 'Hi' และ 'Hello' ใช้ได้ทุกเวลา",
        vi: "Người nói tiếng Anh dùng những lời chào khác nhau tuỳ theo thời gian trong ngày. 'Good morning' dùng đến khoảng giữa trưa. 'Good afternoon' dùng từ trưa đến khoảng 6 giờ chiều. 'Good evening' dùng sau đó. 'Hi' và 'Hello' có thể dùng vào bất cứ lúc nào.",
        "zh-CN": "说英语的人会根据一天中的时间使用不同的问候语。'Good morning' 用到大约中午。'Good afternoon' 用于中午到下午 6 点左右。'Good evening' 用于这之后。'Hi' 和 'Hello' 任何时间都可以使用。",
      },
    },
    {
      id: "u3-gr-3",
      type: "examples",
      items: [
        { id: "u3-ex-morning-class", english: "Good morning, class.", translations: { vi: "Chào buổi sáng cả lớp." } },
        { id: "u3-ex-afternoon-sir", english: "Good afternoon, sir.", translations: { vi: "Chào buổi chiều, thưa ông." } },
        { id: "u3-ex-evening-folks", english: "Good evening, everyone.", translations: { vi: "Chào buổi tối, mọi người." } },
      ],
    },
    {
      id: "u3-gr-4",
      type: "callout",
      variant: "note",
      content: "'Good night' is NOT a greeting. It is only used when leaving or going to bed.",
      translations: {
        th: "'Good night' ไม่ใช่คำทักทาย ใช้เฉพาะตอนแยกจากกันหรือก่อนเข้านอนเท่านั้น",
        vi: "'Good night' KHÔNG phải lời chào. Nó chỉ dùng khi tạm biệt hoặc trước khi đi ngủ.",
        "zh-CN": "'Good night' 不是问候语。它只在离开或睡觉前使用。",
      },
    },
    {
      id: "u3-gr-5",
      type: "heading",
      content: "Asking how someone is",
      translations: {
        th: "การถามว่าสบายดีไหม",
        vi: "Hỏi thăm sức khoẻ",
        "zh-CN": "询问近况",
      },
    },
    {
      id: "u3-gr-6",
      type: "text",
      content: "After a greeting, English speakers often ask 'How are you?' The most common reply is a short, polite phrase, then a return question.",
      translations: {
        th: "หลังจากทักทาย ผู้พูดภาษาอังกฤษมักจะถาม 'How are you?' คำตอบที่พบบ่อยที่สุดคือวลีสั้นๆ สุภาพๆ ตามด้วยการถามกลับ",
        vi: "Sau khi chào, người nói tiếng Anh thường hỏi 'How are you?' Câu trả lời phổ biến nhất là một cụm từ ngắn, lịch sự, rồi hỏi lại.",
        "zh-CN": "在打招呼之后，说英语的人常常会问 'How are you?' 最常见的回答是一句简短礼貌的话，然后再问一遍对方。",
      },
    },
    {
      id: "u3-gr-7",
      type: "examples",
      items: [
        { id: "u3-ex-fine-thanks", english: "I'm fine, thanks. And you?", translations: { vi: "Tôi khoẻ, cảm ơn. Còn bạn?" } },
        { id: "u3-ex-good-you", english: "I'm good. How about you?", translations: { vi: "Tôi ổn. Còn bạn thì sao?" } },
        { id: "u3-ex-not-bad", english: "Not bad, thanks.", translations: { vi: "Cũng không tệ, cảm ơn." } },
      ],
    },
    {
      id: "u3-gr-8",
      type: "heading",
      content: "Saying goodbye",
      translations: {
        th: "การกล่าวลา",
        vi: "Tạm biệt",
        "zh-CN": "告别",
      },
    },
    {
      id: "u3-gr-9",
      type: "text",
      content: "'Goodbye' is more formal. 'Bye' is friendly and used everywhere. 'See you' is casual and often comes with a time word: 'See you later', 'See you tomorrow', 'See you soon'.",
      translations: {
        th: "'Goodbye' เป็นทางการกว่า 'Bye' เป็นกันเองและใช้ได้ทุกที่ 'See you' เป็นภาษาพูดและมักมาพร้อมกับคำบอกเวลา: 'See you later', 'See you tomorrow', 'See you soon'",
        vi: "'Goodbye' trang trọng hơn. 'Bye' thân thiện và dùng được ở mọi nơi. 'See you' là thân mật và thường đi kèm với một từ chỉ thời gian: 'See you later', 'See you tomorrow', 'See you soon'.",
        "zh-CN": "'Goodbye' 更正式。'Bye' 友好且适用于任何场合。'See you' 是随意的，通常会加一个时间词：'See you later'、'See you tomorrow'、'See you soon'。",
      },
    },
    {
      id: "u3-gr-10",
      type: "heading",
      content: "Quick check",
      translations: {
        th: "ตรวจสอบอย่างรวดเร็ว",
        vi: "Kiểm tra nhanh",
        "zh-CN": "快速检查",
      },
    },
    { id: "u3-gr-11", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u3-grammar-mcq-1" },
  ],
};

registerSection(grammar);
export default grammar;
