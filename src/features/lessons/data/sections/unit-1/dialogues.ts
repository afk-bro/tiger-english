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
        { id: "u1-d-1", speaker: "Anna", text: "Hello! What is your name?", translations: { th: "สวัสดี! คุณชื่ออะไร?", vi: "Xin chào! Tên bạn là gì?", "zh-CN": "你好！你叫什么名字？" } },
        { id: "u1-d-2", speaker: "Somchai", text: "My name is Somchai. I am from Thailand. What is your name?", translations: { th: "ผมชื่อสมชาย ผมมาจากประเทศไทย คุณชื่ออะไร?", vi: "Tôi tên là Somchai. Tôi đến từ Thái Lan. Tên bạn là gì?", "zh-CN": "我叫Somchai。我来自泰国。你叫什么名字？" } },
        { id: "u1-d-3", speaker: "Anna", text: "I am Anna. I am from Germany.", translations: { th: "ฉันชื่ออันนา ฉันมาจากเยอรมนี", vi: "Tôi là Anna. Tôi đến từ Đức.", "zh-CN": "我是Anna。我来自德国。" } },
        { id: "u1-d-4", speaker: "Somchai", text: "What is your address?", translations: { th: "ที่อยู่ของคุณคืออะไร?", vi: "Địa chỉ của bạn là gì?", "zh-CN": "你的地址是什么？" } },
        { id: "u1-d-5", speaker: "Anna", text: "My address is 12 Main Street.", translations: { th: "ที่อยู่ของฉันคือ 12 Main Street", vi: "Địa chỉ của tôi là 12 Main Street.", "zh-CN": "我的地址是 12 Main Street。" } },
        { id: "u1-d-6", speaker: "Somchai", text: "What is your phone number?", translations: { th: "เบอร์โทรศัพท์ของคุณคืออะไร?", vi: "Số điện thoại của bạn là gì?", "zh-CN": "你的电话号码是多少？" } },
        { id: "u1-d-7", speaker: "Anna", text: "My phone number is 555-1234.", translations: { th: "เบอร์โทรศัพท์ของฉันคือ 555-1234", vi: "Số điện thoại của tôi là 555-1234.", "zh-CN": "我的电话号码是 555-1234。" } },
        { id: "u1-d-8", speaker: "Somchai", text: "Thank you!", translations: { th: "ขอบคุณ!", vi: "Cảm ơn!", "zh-CN": "谢谢！" } },
        { id: "u1-d-9", speaker: "Anna", text: "You're welcome!", translations: { th: "ไม่เป็นไร!", vi: "Không có gì!", "zh-CN": "不客气！" } },
      ],
    },
  ],
};

registerSection(dialogues);
export default dialogues;
