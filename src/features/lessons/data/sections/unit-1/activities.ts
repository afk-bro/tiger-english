// src/features/lessons/data/sections/unit-1/activities.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const activities: Section = {
  id: "u1-activities",
  unitSlug: "unit-1",
  key: "activities",
  blocks: [
    {
      id: "u1-act-1",
      type: "heading",
      content: "Practice what you've learned",
      translations: {
        th: "ฝึกสิ่งที่คุณได้เรียนรู้",
        vi: "Luyện tập những gì bạn đã học",
        "zh-CN": "练习你所学到的",
      },
    },
    {
      id: "u1-act-2",
      type: "text",
      content: "Complete the exercises below to reinforce what you learned in this unit.",
      translations: {
        th: "ทำแบบฝึกหัดด้านล่างให้เสร็จเพื่อเสริมสิ่งที่คุณได้เรียนรู้ในบทนี้",
        vi: "Hoàn thành các bài tập dưới đây để củng cố những gì bạn đã học trong bài này.",
        "zh-CN": "完成下面的练习，以巩固你在本单元中学到的内容。",
      },
    },
    {
      id: "u1-act-3",
      type: "callout",
      variant: "tip",
      content: "Try to answer from memory before looking back at the grammar section.",
      translations: {
        th: "พยายามตอบจากความจำก่อนกลับไปดูส่วนไวยากรณ์",
        vi: "Hãy cố gắng trả lời bằng trí nhớ trước khi xem lại phần ngữ pháp.",
        "zh-CN": "先凭记忆作答，再回去查看语法部分。",
      },
    },
    { id: "u1-act-4", type: "exercise", exerciseType: "fill-blank", exerciseId: "u1-activities-fb-1" },
  ],
};

registerSection(activities);
export default activities;
