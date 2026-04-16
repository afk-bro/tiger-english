// src/features/lessons/data/getSection.ts
import type { Section, SectionKey } from "../lesson.types";
import { lookupSection } from "./sectionRegistry";

// Import all section files — each calls registerSection() on load
import "./sections/unit-1/overview";
import "./sections/unit-1/grammar";
import "./sections/unit-1/vocabulary";
import "./sections/unit-1/dialogues";
import "./sections/unit-1/activities";

export function getSection(
  unitSlug: string,
  sectionKey: SectionKey,
): Section | undefined {
  return lookupSection(unitSlug, sectionKey);
}
