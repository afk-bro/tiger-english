// src/features/lessons/data/sections/unit-2/grammar.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const grammar: Section = {
  id: "u2-grammar",
  unitSlug: "unit-2",
  key: "grammar",
  blocks: [
    {
      id: "u2-gr-1",
      type: "heading",
      content: "Subject pronouns",
      translations: { vi: "Đại từ nhân xưng" },
    },
    {
      id: "u2-gr-2",
      type: "text",
      content: "In English, every sentence needs a subject. We use these subject pronouns to talk about people and things: I, you, he, she, it, we, they. Each pronoun pairs with the right form of 'to be' — am, is, or are.",
      translations: {
        vi: "Trong tiếng Anh, mỗi câu cần có chủ ngữ. Chúng ta dùng các đại từ nhân xưng sau để nói về người và đồ vật: I, you, he, she, it, we, they. Mỗi đại từ đi với dạng đúng của 'to be' — am, is, hoặc are.",
      },
    },
    {
      id: "u2-gr-3",
      type: "examples",
      items: [
        { id: "u2-ex-i-student", english: "I am a student.", translations: { vi: "Tôi là học sinh." } },
        { id: "u2-ex-he-friend", english: "He is my friend.", translations: { vi: "Anh ấy là bạn tôi." } },
        { id: "u2-ex-they-school", english: "They are at school.", translations: { vi: "Họ đang ở trường." } },
      ],
    },
    {
      id: "u2-gr-4",
      type: "heading",
      content: "Asking 'Where' with 'to be'",
      translations: { vi: "Hỏi 'Where' với 'to be'" },
    },
    {
      id: "u2-gr-5",
      type: "text",
      content: "To ask about location, put 'Where' at the beginning, then the correct form of 'to be' (am, is, are), then the subject. The answer uses the same form of 'to be' plus a location.",
      translations: {
        vi: "Để hỏi về vị trí, đặt 'Where' ở đầu câu, rồi đến dạng đúng của 'to be' (am, is, are), rồi đến chủ ngữ. Câu trả lời dùng cùng dạng 'to be' kèm theo địa điểm.",
      },
    },
    {
      id: "u2-gr-6",
      type: "examples",
      items: [
        { id: "u2-ex-where-am-i", english: "Where am I? — You're in the kitchen.", translations: { vi: "Tôi đang ở đâu? — Bạn đang ở trong bếp." } },
        { id: "u2-ex-where-is-he", english: "Where is he? — He's in the bedroom.", translations: { vi: "Anh ấy đang ở đâu? — Anh ấy đang ở trong phòng ngủ." } },
        { id: "u2-ex-where-are-we", english: "Where are we? — We're in the living room.", translations: { vi: "Chúng ta đang ở đâu? — Chúng ta đang ở trong phòng khách." } },
        { id: "u2-ex-where-are-they", english: "Where are they? — They're at the park.", translations: { vi: "Họ đang ở đâu? — Họ đang ở trong công viên." } },
      ],
    },
    {
      id: "u2-gr-7",
      type: "heading",
      content: "Contractions",
      translations: { vi: "Dạng rút gọn (contractions)" },
    },
    {
      id: "u2-gr-8",
      type: "text",
      content: "In everyday speech, English speakers shorten 'I am' to 'I'm', 'he is' to 'he's', and so on. These shortened forms are called contractions.",
      translations: {
        vi: "Trong giao tiếp hằng ngày, người nói tiếng Anh rút gọn 'I am' thành 'I'm', 'he is' thành 'he's', v.v. Những dạng rút gọn này được gọi là contractions.",
      },
    },
    {
      id: "u2-gr-9",
      type: "examples",
      items: [
        { id: "u2-ex-c-i", english: "I am → I'm", translations: { vi: "I am → I'm (tôi)" } },
        { id: "u2-ex-c-he", english: "He is → He's", translations: { vi: "He is → He's (anh ấy)" } },
        { id: "u2-ex-c-she", english: "She is → She's", translations: { vi: "She is → She's (cô ấy)" } },
        { id: "u2-ex-c-it", english: "It is → It's", translations: { vi: "It is → It's (nó)" } },
        { id: "u2-ex-c-we", english: "We are → We're", translations: { vi: "We are → We're (chúng ta / chúng tôi)" } },
        { id: "u2-ex-c-you", english: "You are → You're", translations: { vi: "You are → You're (bạn / các bạn)" } },
        { id: "u2-ex-c-they", english: "They are → They're", translations: { vi: "They are → They're (họ)" } },
      ],
    },
    {
      id: "u2-gr-10",
      type: "callout",
      variant: "note",
      content: "Written English is fine without contractions, but spoken English almost always uses them.",
      translations: {
        vi: "Tiếng Anh viết không cần dùng dạng rút gọn cũng được, nhưng tiếng Anh nói gần như luôn dùng chúng.",
      },
    },
    {
      id: "u2-gr-11-h",
      type: "heading",
      content: "Quick check: contractions",
      translations: { vi: "Kiểm tra nhanh: dạng rút gọn" },
    },
    { id: "u2-gr-11", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-grammar-mcq-1" },
    {
      id: "u2-gr-12-h",
      type: "heading",
      content: "Quick check: 'Where' questions",
      translations: { vi: "Kiểm tra nhanh: câu hỏi 'Where'" },
    },
    { id: "u2-gr-12", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-grammar-mcq-2" },
  ],
};

registerSection(grammar);
export default grammar;
