// src/features/lessons/data/sections/unit-2/dialogues.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const dialogues: Section = {
  id: "u2-dialogues",
  unitSlug: "unit-2",
  key: "dialogues",
  blocks: [
    {
      id: "u2-dl-1-h",
      type: "heading",
      content: "Greeting people",
      translations: { vi: "Chào hỏi mọi người" },
    },
    {
      id: "u2-dl-1-t",
      type: "text",
      content: "A short, friendly exchange you'll hear every day. Two people meet and ask how each other is doing.",
      translations: {
        vi: "Một cuộc trao đổi ngắn, thân thiện mà bạn sẽ nghe hằng ngày. Hai người gặp nhau và hỏi thăm nhau.",
      },
    },
    {
      id: "u2-dl-1",
      type: "dialogue",
      lines: [
        { id: "u2-d1-1", speaker: "A", text: "Hi. How are you?", translations: { vi: "Chào. Bạn khoẻ không?" } },
        { id: "u2-d1-2", speaker: "B", text: "Fine. And you?", translations: { vi: "Khoẻ. Còn bạn thì sao?" } },
        { id: "u2-d1-3", speaker: "A", text: "Fine, thanks.", translations: { vi: "Khoẻ, cảm ơn." } },
      ],
    },
    {
      id: "u2-dl-2-h",
      type: "heading",
      content: "Where is everyone?",
      translations: { vi: "Mọi người đang ở đâu?" },
    },
    {
      id: "u2-dl-2-t",
      type: "text",
      content: "Two people at home check in on where their family members and things are. Notice the 'Where is/are…?' pattern and the contractions.",
      translations: {
        vi: "Hai người ở nhà hỏi nhau xem các thành viên trong gia đình và đồ vật đang ở đâu. Hãy chú ý mẫu câu 'Where is/are…?' và các dạng rút gọn.",
      },
    },
    {
      id: "u2-dl-2",
      type: "dialogue",
      lines: [
        { id: "u2-d2-1", speaker: "Alex", text: "Where's Maria?", translations: { vi: "Maria đang ở đâu?" } },
        { id: "u2-d2-2", speaker: "Linh", text: "She's in the kitchen.", translations: { vi: "Cô ấy đang ở trong bếp." } },
        { id: "u2-d2-3", speaker: "Alex", text: "Where are the kids?", translations: { vi: "Bọn trẻ đang ở đâu?" } },
        { id: "u2-d2-4", speaker: "Linh", text: "They're in the yard.", translations: { vi: "Chúng đang ở ngoài sân." } },
        { id: "u2-d2-5", speaker: "Alex", text: "Where's my book?", translations: { vi: "Quyển sách của tôi ở đâu?" } },
        { id: "u2-d2-6", speaker: "Linh", text: "It's on the bookshelf.", translations: { vi: "Nó ở trên kệ sách." } },
        { id: "u2-d2-7", speaker: "Alex", text: "Where's Dad?", translations: { vi: "Bố đang ở đâu?" } },
        { id: "u2-d2-8", speaker: "Linh", text: "He's at the supermarket.", translations: { vi: "Bố đang ở siêu thị." } },
      ],
    },
  ],
};

registerSection(dialogues);
export default dialogues;
