// src/features/lessons/data/sections/unit-1/overview.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const overview: Section = {
  id: "u1-overview",
  unitSlug: "unit-1",
  key: "overview",
  blocks: [
    {
      id: "u1-ov-1",
      type: "heading",
      content: "What you'll learn",
      translations: {
        th: "สิ่งที่คุณจะได้เรียนรู้",
        vi: "Những gì bạn sẽ học",
        "zh-CN": "你将学到的内容",
      },
    },
    {
      id: "u1-ov-2",
      type: "text",
      content: "In this unit, you'll learn how to introduce yourself, greet people, and share basic personal information using the present tense of 'to be' (am, is, are).",
      translations: {
        th: "ในบทนี้ คุณจะได้เรียนรู้วิธีแนะนำตัวเอง ทักทายผู้คน และแบ่งปันข้อมูลส่วนตัวพื้นฐานโดยใช้กาลปัจจุบันของ 'to be' (am, is, are)",
        vi: "Trong bài học này, bạn sẽ học cách giới thiệu bản thân, chào hỏi mọi người và chia sẻ thông tin cá nhân cơ bản bằng thì hiện tại của 'to be' (am, is, are).",
        "zh-CN": "在本单元中，你将学习如何使用 'to be' 的现在时 (am, is, are) 介绍自己、问候他人以及分享基本的个人信息。",
      },
    },
    {
      id: "u1-ov-3",
      type: "callout",
      variant: "tip",
      content: "These are some of the most common phrases in English. You'll use them every day!",
      translations: {
        th: "วลีเหล่านี้เป็นวลีที่พบบ่อยที่สุดในภาษาอังกฤษ คุณจะได้ใช้มันทุกวัน!",
        vi: "Đây là một số cụm từ phổ biến nhất trong tiếng Anh. Bạn sẽ sử dụng chúng hằng ngày!",
        "zh-CN": "这些是英语中最常见的短语。你每天都会用到！",
      },
    },
    {
      id: "u1-ov-4",
      type: "heading",
      content: "Real-world context",
      translations: {
        th: "สถานการณ์จริง",
        vi: "Bối cảnh thực tế",
        "zh-CN": "真实场景",
      },
    },
    {
      id: "u1-ov-5",
      type: "text",
      content: "Meeting new people at work, introducing yourself at school, filling out a simple form, or starting a conversation with a stranger — all of these situations use the patterns you'll practice here.",
      translations: {
        th: "การพบเพื่อนใหม่ที่ทำงาน การแนะนำตัวเองที่โรงเรียน การกรอกแบบฟอร์มง่ายๆ หรือการเริ่มบทสนทนากับคนแปลกหน้า — ทุกสถานการณ์เหล่านี้ใช้รูปแบบที่คุณจะได้ฝึกที่นี่",
        vi: "Gặp gỡ người mới ở nơi làm việc, giới thiệu bản thân ở trường, điền vào một biểu mẫu đơn giản, hoặc bắt chuyện với người lạ — tất cả những tình huống này đều sử dụng các mẫu câu mà bạn sẽ luyện tập ở đây.",
        "zh-CN": "在工作中结识新朋友、在学校介绍自己、填写简单的表格，或与陌生人开始交谈——所有这些情境都会用到你将在这里练习的句型。",
      },
    },
    {
      id: "u1-ov-6",
      type: "heading",
      content: "Key phrases",
      translations: {
        th: "วลีสำคัญ",
        vi: "Cụm từ quan trọng",
        "zh-CN": "关键短语",
      },
    },
    {
      id: "u1-ov-7",
      type: "examples",
      items: [
        { id: "u1-ex-hello-name", english: "Hello, my name is Somchai.", translations: { th: "สวัสดีครับ ผมชื่อสมชาย" } },
        { id: "u1-ex-from-thailand", english: "I am from Thailand.", translations: { th: "ผมมาจากประเทศไทย" } },
        { id: "u1-ex-she-teacher", english: "She is a teacher.", translations: { th: "เธอเป็นครู" } },
        { id: "u1-ex-we-students", english: "We are students.", translations: { th: "พวกเราเป็นนักเรียน" } },
        { id: "u1-ex-nice-meet", english: "Nice to meet you.", translations: { th: "ยินดีที่ได้รู้จัก" } },
      ],
    },
  ],
};

registerSection(overview);
export default overview;
