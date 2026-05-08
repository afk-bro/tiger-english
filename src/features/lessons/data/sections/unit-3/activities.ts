// src/features/lessons/data/sections/unit-3/activities.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const activities: Section = {
  id: "u3-activities",
  unitSlug: "unit-3",
  key: "activities",
  blocks: [
    {
      id: "u3-act-1",
      type: "heading",
      content: "Practice what you've learned",
      translations: {
        th: "ฝึกสิ่งที่คุณได้เรียนรู้",
        vi: "Luyện tập những gì bạn đã học",
        "zh-CN": "练习你所学到的",
      },
    },
    {
      id: "u3-act-2",
      type: "text",
      content: "Complete the exercises below to reinforce the greetings, replies, and farewells you learned in this unit.",
      translations: {
        th: "ทำแบบฝึกหัดด้านล่างให้เสร็จเพื่อเสริมการทักทาย คำตอบ และคำอำลาที่คุณได้เรียนรู้ในบทนี้",
        vi: "Hoàn thành các bài tập dưới đây để củng cố các lời chào, câu trả lời và lời tạm biệt bạn đã học trong bài này.",
        "zh-CN": "完成下面的练习，以巩固本单元学到的问候语、回答和告别语。",
      },
    },
    {
      id: "u3-act-3",
      type: "callout",
      variant: "tip",
      content: "Try saying each phrase out loud as you read it. Greetings sound more natural when you've heard yourself say them.",
      translations: {
        th: "ลองพูดแต่ละวลีออกเสียงดังๆ ขณะที่อ่าน คำทักทายจะฟังดูเป็นธรรมชาติมากขึ้นเมื่อคุณเคยได้ยินตัวเองพูดมัน",
        vi: "Hãy thử đọc to từng cụm từ. Lời chào sẽ tự nhiên hơn khi bạn đã từng nghe chính mình nói chúng.",
        "zh-CN": "在阅读每个短语时大声读出来。当你听过自己说出问候语后，它们听起来会更自然。",
      },
    },
    {
      id: "u3-act-4-h",
      type: "heading",
      content: "Replying to 'How are you?'",
      translations: {
        th: "การตอบ 'How are you?'",
        vi: "Trả lời 'How are you?'",
        "zh-CN": "回答 'How are you?'",
      },
    },
    { id: "u3-act-4", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u3-activities-mcq-1" },
    {
      id: "u3-act-5-h",
      type: "heading",
      content: "Choosing the right time-of-day greeting",
      translations: {
        th: "การเลือกคำทักทายให้ถูกช่วงเวลาของวัน",
        vi: "Chọn lời chào đúng theo thời gian trong ngày",
        "zh-CN": "选择正确的时间段问候语",
      },
    },
    { id: "u3-act-5", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u3-activities-mcq-2" },
    {
      id: "u3-act-6-h",
      type: "heading",
      content: "When to say 'Good night'",
      translations: {
        th: "เมื่อไหร่ที่จะพูด 'Good night'",
        vi: "Khi nào nói 'Good night'",
        "zh-CN": "什么时候说 'Good night'",
      },
    },
    { id: "u3-act-6", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u3-activities-mcq-3" },
    {
      id: "u3-act-7-h",
      type: "heading",
      content: "Saying 'See you ___'",
      translations: {
        th: "การพูด 'See you ___'",
        vi: "Nói 'See you ___'",
        "zh-CN": "说 'See you ___'",
      },
    },
    { id: "u3-act-7", type: "exercise", exerciseType: "fill-blank", exerciseId: "u3-activities-fb-1" },
    {
      id: "u3-act-8-h",
      type: "heading",
      content: "Greeting your class in the morning",
      translations: {
        th: "การทักทายชั้นเรียนในตอนเช้า",
        vi: "Chào cả lớp vào buổi sáng",
        "zh-CN": "早上向班级问好",
      },
    },
    { id: "u3-act-8", type: "exercise", exerciseType: "fill-blank", exerciseId: "u3-activities-fb-2" },
    {
      id: "u3-act-9-h",
      type: "heading",
      content: "Recognising 'And you?'",
      translations: {
        th: "การรับรู้ความหมายของ 'And you?'",
        vi: "Nhận ra 'And you?'",
        "zh-CN": "理解 'And you?'",
      },
    },
    { id: "u3-act-9", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u3-activities-mcq-4" },
    {
      id: "u3-act-10-h",
      type: "heading",
      content: "Replying to a farewell",
      translations: {
        th: "การตอบคำอำลา",
        vi: "Trả lời lời tạm biệt",
        "zh-CN": "回应告别",
      },
    },
    { id: "u3-act-10", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u3-activities-mcq-5" },
  ],
};

registerSection(activities);
export default activities;
