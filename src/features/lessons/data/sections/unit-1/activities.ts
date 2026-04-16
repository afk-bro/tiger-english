// src/features/lessons/data/sections/unit-1/activities.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const activities: Section = {
  id: "u1-activities",
  unitSlug: "unit-1",
  key: "activities",
  title: "Activities",
  blocks: [
    { id: "u1-act-1", type: "heading", content: "Practice what you've learned" },
    {
      id: "u1-act-2",
      type: "text",
      content: "Complete the exercises below to reinforce what you learned in this unit.",
    },
    {
      id: "u1-act-3",
      type: "callout",
      variant: "tip",
      content: "Try to answer from memory before looking back at the grammar section.",
    },
    { id: "u1-act-4", type: "exercise", exerciseType: "fill-blank", exerciseId: "u1-activities-fb-1" },
  ],
};

registerSection(activities);
export default activities;
