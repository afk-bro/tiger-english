// src/features/lessons/data/sections/unit-3/overview.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const overview: Section = {
  id: "u3-overview",
  unitSlug: "unit-3",
  key: "overview",
  blocks: [
    {
      id: "u3-ov-1",
      type: "heading",
      content: "What you'll learn",
      translations: {
        th: "สิ่งที่คุณจะได้เรียนรู้",
        vi: "Những gì bạn sẽ học",
        "zh-CN": "你将学到的内容",
      },
    },
    {
      id: "u3-ov-2",
      type: "text",
      content: "In this unit, you'll learn how to greet people and say goodbye in English. You'll also learn how to ask 'How are you?' and give a simple reply.",
      translations: {
        th: "ในบทนี้ คุณจะได้เรียนรู้วิธีทักทายผู้คนและกล่าวลาในภาษาอังกฤษ คุณจะได้เรียนรู้วิธีถาม 'How are you?' และตอบกลับอย่างง่ายด้วย",
        vi: "Trong bài học này, bạn sẽ học cách chào hỏi và tạm biệt bằng tiếng Anh. Bạn cũng sẽ học cách hỏi 'How are you?' và trả lời đơn giản.",
        "zh-CN": "在本单元中，你将学习如何用英语问候他人和说再见。你还将学习如何问 'How are you?' 并给出简单的回答。",
      },
    },
    {
      id: "u3-ov-3",
      type: "callout",
      variant: "tip",
      content: "Greetings change with the time of day. 'Good morning' is for the morning, 'Good afternoon' for after noon, and 'Good evening' for after sunset.",
      translations: {
        th: "คำทักทายเปลี่ยนไปตามช่วงเวลาของวัน 'Good morning' ใช้ในตอนเช้า, 'Good afternoon' ใช้หลังเที่ยง, และ 'Good evening' ใช้หลังพระอาทิตย์ตก",
        vi: "Lời chào thay đổi theo thời gian trong ngày. 'Good morning' dùng vào buổi sáng, 'Good afternoon' dùng sau buổi trưa, và 'Good evening' dùng sau khi mặt trời lặn.",
        "zh-CN": "问候语会根据一天中的时间而变化。'Good morning' 用于早上，'Good afternoon' 用于中午之后，'Good evening' 用于日落之后。",
      },
    },
    {
      id: "u3-ov-4",
      type: "heading",
      content: "Real-world context",
      translations: {
        th: "สถานการณ์จริง",
        vi: "Bối cảnh thực tế",
        "zh-CN": "真实场景",
      },
    },
    {
      id: "u3-ov-5",
      type: "text",
      content: "Walking into a coffee shop, meeting a coworker in the morning, leaving a friend's house, ending a phone call — every conversation begins with a greeting and ends with a goodbye.",
      translations: {
        th: "การเดินเข้าไปในร้านกาแฟ การพบเพื่อนร่วมงานในตอนเช้า การออกจากบ้านเพื่อน การจบการโทรศัพท์ — ทุกบทสนทนาเริ่มต้นด้วยคำทักทายและจบลงด้วยคำอำลา",
        vi: "Bước vào quán cà phê, gặp đồng nghiệp vào buổi sáng, rời khỏi nhà bạn bè, kết thúc cuộc điện thoại — mọi cuộc trò chuyện đều bắt đầu bằng lời chào và kết thúc bằng lời tạm biệt.",
        "zh-CN": "走进咖啡馆、早上遇到同事、从朋友家离开、结束电话——每次对话都以问候开始，以告别结束。",
      },
    },
    {
      id: "u3-ov-6",
      type: "heading",
      content: "Key phrases",
      translations: {
        th: "วลีสำคัญ",
        vi: "Cụm từ quan trọng",
        "zh-CN": "关键短语",
      },
    },
    {
      id: "u3-ov-7",
      type: "examples",
      items: [
        { id: "u3-ex-hi", english: "Hi! How are you?", translations: { th: "สวัสดี! สบายดีไหม?", vi: "Chào bạn! Bạn khoẻ không?", "zh-CN": "嗨！你好吗？" } },
        { id: "u3-ex-fine", english: "I'm fine, thanks. And you?", translations: { th: "สบายดี ขอบคุณ แล้วคุณล่ะ?", vi: "Tôi khoẻ, cảm ơn. Còn bạn?", "zh-CN": "我很好，谢谢。你呢？" } },
        { id: "u3-ex-morning", english: "Good morning, everyone.", translations: { th: "อรุณสวัสดิ์ทุกคน", vi: "Chào buổi sáng mọi người.", "zh-CN": "大家早上好。" } },
        { id: "u3-ex-bye", english: "Bye! See you tomorrow.", translations: { th: "บาย! เจอกันพรุ่งนี้", vi: "Tạm biệt! Hẹn gặp lại ngày mai.", "zh-CN": "再见！明天见。" } },
        { id: "u3-ex-take-care", english: "Take care!", translations: { th: "ดูแลตัวเองนะ!", vi: "Bảo trọng nhé!", "zh-CN": "保重！" } },
      ],
    },
  ],
};

registerSection(overview);
export default overview;
