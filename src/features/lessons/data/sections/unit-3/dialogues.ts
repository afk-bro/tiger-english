// src/features/lessons/data/sections/unit-3/dialogues.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const dialogues: Section = {
  id: "u3-dialogues",
  unitSlug: "unit-3",
  key: "dialogues",
  blocks: [
    {
      id: "u3-dl-1-h",
      type: "heading",
      content: "Two friends meet in the morning",
      translations: {
        th: "เพื่อนสองคนพบกันในตอนเช้า",
        vi: "Hai người bạn gặp nhau vào buổi sáng",
        "zh-CN": "两位朋友在早上见面",
      },
    },
    {
      id: "u3-dl-1-t",
      type: "text",
      content: "A casual morning greeting between friends. Notice how the second speaker also asks 'And you?' to return the question.",
      translations: {
        th: "การทักทายตอนเช้าระหว่างเพื่อนแบบเป็นกันเอง สังเกตว่าผู้พูดคนที่สองก็ถาม 'And you?' เพื่อย้อนคำถามด้วย",
        vi: "Một lời chào buổi sáng thân mật giữa hai người bạn. Lưu ý người nói thứ hai cũng hỏi lại 'And you?' để hỏi lại câu hỏi.",
        "zh-CN": "两位朋友之间一段随意的早晨问候。注意第二位说话人也用 'And you?' 反问对方。",
      },
    },
    {
      id: "u3-dl-1",
      type: "dialogue",
      lines: [
        { id: "u3-d-1-1", speaker: "Maria", text: "Hi, Tom! Good morning.", translations: { vi: "Chào Tom! Chào buổi sáng." } },
        { id: "u3-d-1-2", speaker: "Tom", text: "Good morning, Maria. How are you?", translations: { vi: "Chào buổi sáng, Maria. Bạn khoẻ không?" } },
        { id: "u3-d-1-3", speaker: "Maria", text: "I'm good, thanks. And you?", translations: { vi: "Tôi ổn, cảm ơn. Còn bạn?" } },
        { id: "u3-d-1-4", speaker: "Tom", text: "Not bad. A bit tired.", translations: { vi: "Cũng không tệ. Hơi mệt một chút." } },
        { id: "u3-d-1-5", speaker: "Maria", text: "Take care! See you later.", translations: { vi: "Bảo trọng nhé! Hẹn gặp lại sau." } },
        { id: "u3-d-1-6", speaker: "Tom", text: "Bye!", translations: { vi: "Tạm biệt!" } },
      ],
    },
    {
      id: "u3-dl-2-h",
      type: "heading",
      content: "Leaving the office in the evening",
      translations: {
        th: "การออกจากออฟฟิศในตอนเย็น",
        vi: "Rời văn phòng vào buổi tối",
        "zh-CN": "傍晚离开办公室",
      },
    },
    {
      id: "u3-dl-2-t",
      type: "text",
      content: "A more formal farewell at work. 'Good evening' is appropriate for after about 6 p.m., and 'Good night' is used as a farewell when the day is ending.",
      translations: {
        th: "การกล่าวลาที่ทำงานแบบเป็นทางการกว่า 'Good evening' เหมาะสำหรับหลัง 18.00 น. และ 'Good night' ใช้เป็นคำอำลาเมื่อวันสิ้นสุดลง",
        vi: "Một lời tạm biệt trang trọng hơn ở nơi làm việc. 'Good evening' phù hợp với thời điểm sau khoảng 6 giờ chiều, và 'Good night' được dùng để tạm biệt khi ngày đã kết thúc.",
        "zh-CN": "工作场合较为正式的告别。'Good evening' 适合大约下午 6 点之后使用，而 'Good night' 用于一天结束时的告别。",
      },
    },
    {
      id: "u3-dl-2",
      type: "dialogue",
      lines: [
        { id: "u3-d-2-1", speaker: "Anna", text: "Good evening, David. Are you going home?", translations: { vi: "Chào buổi tối, David. Anh về nhà à?" } },
        { id: "u3-d-2-2", speaker: "David", text: "Yes, I am. It's late.", translations: { vi: "Vâng, đúng rồi. Đã muộn rồi." } },
        { id: "u3-d-2-3", speaker: "Anna", text: "See you tomorrow.", translations: { vi: "Hẹn gặp lại ngày mai." } },
        { id: "u3-d-2-4", speaker: "David", text: "Yes, see you tomorrow. Good night!", translations: { vi: "Vâng, hẹn gặp lại ngày mai. Chúc ngủ ngon!" } },
        { id: "u3-d-2-5", speaker: "Anna", text: "Good night.", translations: { vi: "Chúc ngủ ngon." } },
      ],
    },
  ],
};

registerSection(dialogues);
export default dialogues;
