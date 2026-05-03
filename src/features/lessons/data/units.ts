// src/features/lessons/data/units.ts
import type { Unit } from "../lesson.types";

export const units: Unit[] = [
  {
    slug: "unit-1",
    number: 1,
    title: "To Be: Introduction",
    topic: "Personal information & meeting people",
    grammarFocus: "Present tense of 'to be' (am / is / are)",
    estimatedMinutes: 30,
    status: "available",
    sections: [
      { key: "overview", estimatedMinutes: 3 },
      { key: "grammar", estimatedMinutes: 8 },
      { key: "vocabulary", estimatedMinutes: 5 },
      { key: "dialogues", estimatedMinutes: 6 },
      { key: "activities", estimatedMinutes: 8 },
    ],
    translations: {
      th: {
        title: "To Be: บทนำ",
        topic: "ข้อมูลส่วนตัวและการพบปะผู้คน",
        grammarFocus: "กาลปัจจุบันของ 'to be' (am / is / are)",
      },
      vi: {
        title: "To Be: Giới thiệu",
        topic: "Thông tin cá nhân và gặp gỡ mọi người",
        grammarFocus: "Thì hiện tại của 'to be' (am / is / are)",
      },
      "zh-CN": {
        title: "To Be: 介绍",
        topic: "个人信息和认识新朋友",
        grammarFocus: "'to be' 的现在时 (am / is / are)",
      },
    },
  },
  {
    slug: "unit-2",
    number: 2,
    title: "To Be + Location",
    topic: "Talking about where people and things are",
    grammarFocus: "Subject pronouns + 'to be' for location ('Where is he?' / 'He's in the kitchen.')",
    estimatedMinutes: 35,
    status: "available",
    sections: [
      { key: "overview", estimatedMinutes: 3 },
      { key: "grammar", estimatedMinutes: 8 },
      { key: "vocabulary", estimatedMinutes: 8 },
      { key: "dialogues", estimatedMinutes: 6 },
      { key: "activities", estimatedMinutes: 10 },
    ],
    translations: {
      vi: {
        title: "To Be + Vị trí",
        topic: "Nói về vị trí của người và đồ vật",
        grammarFocus: "Đại từ nhân xưng + 'to be' chỉ vị trí ('Where is he?' / 'He's in the kitchen.')",
      },
    },
  },
  {
    slug: "unit-3",
    number: 3,
    title: "Present Continuous Tense",
    topic: "Everyday activities",
    grammarFocus: "Present continuous (am/is/are + -ing)",
    estimatedMinutes: 45,
    status: "coming-soon",
    sections: [],
    translations: {
      th: {
        title: "กาลปัจจุบันต่อเนื่อง",
        topic: "กิจกรรมประจำวัน",
        grammarFocus: "ปัจจุบันต่อเนื่อง (am/is/are + -ing)",
      },
      vi: {
        title: "Thì Hiện tại Tiếp diễn",
        topic: "Các hoạt động hàng ngày",
        grammarFocus: "Hiện tại tiếp diễn (am/is/are + -ing)",
      },
      "zh-CN": {
        title: "现在进行时",
        topic: "日常活动",
        grammarFocus: "现在进行时 (am/is/are + -ing)",
      },
    },
  },
  {
    slug: "unit-4",
    number: 4,
    title: "To Be: Short Answers & Possessive Adjectives",
    topic: "Family members & descriptions",
    grammarFocus: "Possessive adjectives (my, your, his, her…)",
    estimatedMinutes: 45,
    status: "coming-soon",
    sections: [],
    translations: {
      th: {
        title: "To Be: คำตอบสั้น และคำคุณศัพท์แสดงความเป็นเจ้าของ",
        topic: "สมาชิกในครอบครัวและคำอธิบาย",
        grammarFocus: "คำคุณศัพท์แสดงความเป็นเจ้าของ (my, your, his, her…)",
      },
      vi: {
        title: "To Be: Câu trả lời ngắn & Tính từ sở hữu",
        topic: "Thành viên gia đình & miêu tả",
        grammarFocus: "Tính từ sở hữu (my, your, his, her…)",
      },
      "zh-CN": {
        title: "To Be: 简短回答与物主形容词",
        topic: "家庭成员和描述",
        grammarFocus: "物主形容词 (my, your, his, her…)",
      },
    },
  },
];
