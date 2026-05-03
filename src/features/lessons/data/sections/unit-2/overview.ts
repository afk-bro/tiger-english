// src/features/lessons/data/sections/unit-2/overview.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const overview: Section = {
  id: "u2-overview",
  unitSlug: "unit-2",
  key: "overview",
  blocks: [
    {
      id: "u2-ov-1",
      type: "heading",
      content: "What you'll learn",
      translations: { vi: "Những gì bạn sẽ học" },
    },
    {
      id: "u2-ov-2",
      type: "text",
      content: "In this unit, you'll learn how to ask and answer where people and things are. You'll meet the seven subject pronouns (I, you, he, she, it, we, they), the question pattern 'Where is/are…?', everyday contractions like 'I'm' and 'he's', and vocabulary for classroom objects, rooms at home, and places around town.",
      translations: {
        vi: "Trong bài học này, bạn sẽ học cách hỏi và trả lời về vị trí của người và đồ vật. Bạn sẽ làm quen với bảy đại từ nhân xưng (I, you, he, she, it, we, they), mẫu câu hỏi 'Where is/are…?', các dạng rút gọn quen thuộc như 'I'm' và 'he's', cùng từ vựng về đồ vật trong lớp học, các phòng trong nhà, và các địa điểm trong thị trấn.",
      },
    },
    {
      id: "u2-ov-3",
      type: "callout",
      variant: "tip",
      content: "Once you know these patterns, you can ask about almost any object or place in your day.",
      translations: {
        vi: "Khi đã nắm được các mẫu câu này, bạn có thể hỏi về hầu hết mọi đồ vật hoặc địa điểm trong ngày của mình.",
      },
    },
    {
      id: "u2-ov-4",
      type: "heading",
      content: "Real-world context",
      translations: { vi: "Bối cảnh thực tế" },
    },
    {
      id: "u2-ov-5",
      type: "text",
      content: "Pointing things out at school, asking where a friend or family member is, finding your way around a new neighborhood, or describing where you live — all of these everyday situations use the patterns you'll practice here.",
      translations: {
        vi: "Chỉ đồ vật ở trường, hỏi xem một người bạn hoặc người thân đang ở đâu, tìm đường ở khu phố mới, hay miêu tả nơi bạn sống — tất cả những tình huống hằng ngày này đều dùng các mẫu câu mà bạn sẽ luyện tập ở đây.",
      },
    },
    {
      id: "u2-ov-6",
      type: "heading",
      content: "Key phrases",
      translations: { vi: "Cụm từ quan trọng" },
    },
    {
      id: "u2-ov-7",
      type: "examples",
      items: [
        { id: "u2-ex-where-book", english: "Where is the book? — It's on the desk.", translations: { vi: "Quyển sách ở đâu? — Nó ở trên bàn." } },
        { id: "u2-ex-where-they", english: "Where are they? — They're in the living room.", translations: { vi: "Họ đang ở đâu? — Họ đang ở trong phòng khách." } },
        { id: "u2-ex-shes-kitchen", english: "She's in the kitchen.", translations: { vi: "Cô ấy đang ở trong bếp." } },
        { id: "u2-ex-were-supermarket", english: "We're at the supermarket.", translations: { vi: "Chúng tôi đang ở siêu thị." } },
        { id: "u2-ex-its-bedroom", english: "It's in my bedroom.", translations: { vi: "Nó ở trong phòng ngủ của tôi." } },
      ],
    },
  ],
};

registerSection(overview);
export default overview;
