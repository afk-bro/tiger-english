// src/features/lessons/data/sections/unit-2/activities.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const activities: Section = {
  id: "u2-activities",
  unitSlug: "unit-2",
  key: "activities",
  blocks: [
    {
      id: "u2-act-1",
      type: "heading",
      content: "Practice what you've learned",
      translations: { vi: "Luyện tập những gì bạn đã học" },
    },
    {
      id: "u2-act-2",
      type: "text",
      content: "Complete the exercises below to reinforce the vocabulary, the 'Where' question pattern, and the contractions you saw in this unit.",
      translations: {
        vi: "Hoàn thành các bài tập dưới đây để củng cố từ vựng, mẫu câu hỏi 'Where', và các dạng rút gọn mà bạn đã học trong bài này.",
      },
    },
    {
      id: "u2-act-3",
      type: "callout",
      variant: "tip",
      content: "Try to answer from memory before looking back at the grammar or vocabulary section.",
      translations: {
        vi: "Hãy cố gắng trả lời bằng trí nhớ trước khi xem lại phần ngữ pháp hoặc từ vựng.",
      },
    },

    {
      id: "u2-act-cluster-vocab-h",
      type: "heading",
      content: "Vocabulary recognition",
      translations: { vi: "Nhận biết từ vựng" },
    },
    { id: "u2-act-vocab-1", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-1" },
    { id: "u2-act-vocab-2", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-2" },
    { id: "u2-act-vocab-3", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-3" },
    { id: "u2-act-vocab-4", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-4" },

    {
      id: "u2-act-cluster-where-h",
      type: "heading",
      content: "'Where' + pronouns",
      translations: { vi: "'Where' + đại từ" },
    },
    { id: "u2-act-where-1", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-5" },
    { id: "u2-act-where-2", type: "exercise", exerciseType: "fill-blank", exerciseId: "u2-activities-fb-1" },
    { id: "u2-act-where-3", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-6" },
    { id: "u2-act-where-4", type: "exercise", exerciseType: "fill-blank", exerciseId: "u2-activities-fb-2" },

    {
      id: "u2-act-cluster-contr-h",
      type: "heading",
      content: "Contractions",
      translations: { vi: "Dạng rút gọn" },
    },
    { id: "u2-act-contr-1", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-7" },
    { id: "u2-act-contr-2", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-8" },
    { id: "u2-act-contr-3", type: "exercise", exerciseType: "fill-blank", exerciseId: "u2-activities-fb-3" },
    { id: "u2-act-contr-4", type: "exercise", exerciseType: "multiple-choice", exerciseId: "u2-activities-mcq-9" },
  ],
};

registerSection(activities);
export default activities;
