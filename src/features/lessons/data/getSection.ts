// src/features/lessons/data/getSection.ts
import type { Section, SectionKey } from "../lesson.types";
import { lookupSection } from "./sectionRegistry";

export function getSection(
  unitSlug: string,
  sectionKey: SectionKey,
): Section | undefined {
  return lookupSection(unitSlug, sectionKey);
}
