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
    {
      id: "u1-act-4-h",
      type: "heading",
      content: "Asking someone's name",
      translations: {
        th: "การถามชื่อคนอื่น",
        vi: "Hỏi tên người khác",
        "zh-CN": "询问别人的名字",
      },
    },
    { id: "u1-act-4", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u1-activities-mcq-1" },
    {
      id: "u1-act-10-h",
      type: "heading",
      content: "Asking for a first name",
      translations: {
        vi: "Hỏi tên",
      },
    },
    { id: "u1-act-10", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u1-activities-mcq-5" },
    {
      id: "u1-act-11-h",
      type: "heading",
      content: "Asking for a last name",
      translations: {
        vi: "Hỏi họ",
      },
    },
    { id: "u1-act-11", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u1-activities-mcq-6" },
    {
      id: "u1-act-5-h",
      type: "heading",
      content: "Asking for an address",
      translations: {
        th: "การถามที่อยู่",
        vi: "Hỏi địa chỉ",
        "zh-CN": "询问地址",
      },
    },
    { id: "u1-act-5", type: "exercise", exerciseType: "fill-blank", exerciseId: "u1-activities-fb-1" },
    {
      id: "u1-act-6-h",
      type: "heading",
      content: "Asking for a phone number",
      translations: {
        th: "การถามเบอร์โทรศัพท์",
        vi: "Hỏi số điện thoại",
        "zh-CN": "询问电话号码",
      },
    },
    { id: "u1-act-6", type: "exercise", exerciseType: "fill-blank", exerciseId: "u1-activities-fb-2" },
    {
      id: "u1-act-7-h",
      type: "heading",
      content: "Saying thank you",
      translations: {
        th: "การกล่าวขอบคุณ",
        vi: "Nói cảm ơn",
        "zh-CN": "表达感谢",
      },
    },
    { id: "u1-act-7", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u1-activities-mcq-2" },
    {
      id: "u1-act-8-h",
      type: "heading",
      content: "Asking about someone else",
      translations: {
        th: "การถามเกี่ยวกับคนอื่น",
        vi: "Hỏi về người khác",
        "zh-CN": "询问关于他人",
      },
    },
    { id: "u1-act-8", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u1-activities-mcq-3" },
    {
      id: "u1-act-9-h",
      type: "heading",
      content: "Asking where someone is from",
      translations: {
        th: "การถามว่ามาจากไหน",
        vi: "Hỏi ai đó đến từ đâu",
        "zh-CN": "询问某人来自哪里",
      },
    },
    { id: "u1-act-9", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u1-activities-mcq-4" },
    {
      id: "u1-act-write-1",
      type: "output-task",
      prompt: "Write a short introduction about yourself. Include: your name, where you are from, and one thing you do (e.g. work, study, or a hobby). Use the vocabulary and grammar from this unit.",
      minWords: 20,
      maxWords: 60,
      translations: {
        vi: "Viết một đoạn giới thiệu ngắn về bản thân. Bao gồm: tên, quê hương và một điều bạn làm (ví dụ: công việc, học tập hoặc sở thích).",
        th: "เขียนแนะนำตัวเองสั้นๆ รวมถึง: ชื่อ มาจากไหน และสิ่งที่คุณทำ (เช่น งาน การเรียน หรืองานอดิเรก)",
        "zh-CN": "写一段简短的自我介绍。包括：你的名字、你来自哪里，以及你做的一件事（例如工作、学习或爱好）。",
      },
    },
  ],
};

registerSection(activities);
export default activities;
