// src/features/lessons/data/sections/unit-1/dialogues.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const dialogues: Section = {
  id: "u1-dialogues",
  unitSlug: "unit-1",
  key: "dialogues",
  blocks: [
    {
      id: "u1-dl-1",
      type: "heading",
      content: "Meeting someone new",
      translations: {
        th: "การพบคนใหม่",
        vi: "Gặp gỡ người mới",
        "zh-CN": "结识新朋友",
      },
    },
    {
      id: "u1-dl-2",
      type: "text",
      content: "Read through this conversation between two people meeting for the first time and exchanging contact information.",
      translations: {
        th: "อ่านบทสนทนาระหว่างคนสองคนที่พบกันเป็นครั้งแรกและแลกเปลี่ยนข้อมูลติดต่อ",
        vi: "Đọc cuộc trò chuyện giữa hai người gặp nhau lần đầu và trao đổi thông tin liên lạc.",
        "zh-CN": "读一读两个人第一次见面并交换联系方式的对话。",
      },
    },
    {
      id: "u1-dl-3",
      type: "dialogue",
      lines: [
        { id: "u1-d-1", speaker: "Anna", text: "Hello! What is your first name?", translations: { vi: "Xin chào! Tên của bạn là gì?" } },
        { id: "u1-d-2", speaker: "Somchai", text: "My first name is Somchai. What is your last name?", translations: { vi: "Tên của tôi là Somchai. Họ của bạn là gì?" } },
        { id: "u1-d-3", speaker: "Anna", text: "My last name is Schmidt. I am from Germany.", translations: { vi: "Họ của tôi là Schmidt. Tôi đến từ Đức." } },
        { id: "u1-d-4", speaker: "Somchai", text: "I am from Thailand. What is your address?", translations: { vi: "Tôi đến từ Thái Lan. Địa chỉ của bạn là gì?" } },
        { id: "u1-d-5", speaker: "Anna", text: "My address is 12 Main Street. My apartment number is 4B.", translations: { vi: "Địa chỉ của tôi là 12 Main Street. Số căn hộ của tôi là 4B." } },
        { id: "u1-d-6", speaker: "Somchai", text: "What is your phone number?", translations: { vi: "Số điện thoại của bạn là gì?" } },
        { id: "u1-d-7", speaker: "Anna", text: "My phone number is 555-1234.", translations: { vi: "Số điện thoại của tôi là 555-1234." } },
        { id: "u1-d-8", speaker: "Somchai", text: "What is your email address?", translations: { vi: "Địa chỉ email của bạn là gì?" } },
        { id: "u1-d-9", speaker: "Anna", text: "My email address is anna@email.com.", translations: { vi: "Địa chỉ email của tôi là anna@email.com." } },
        { id: "u1-d-10", speaker: "Somchai", text: "Thank you!", translations: { vi: "Cảm ơn!" } },
        { id: "u1-d-11", speaker: "Anna", text: "You're welcome!", translations: { vi: "Không có gì!" } },
      ],
    },
  ],
};

registerSection(dialogues);
export default dialogues;
