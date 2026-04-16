// src/features/lessons/data/sectionRegistry.ts
import type { Section } from "../lesson.types";

const registry: Record<string, Section> = {};

export function registerSection(section: Section): void {
  const key = `${section.unitSlug}:${section.key}`;
  registry[key] = section;
}

export function lookupSection(
  unitSlug: string,
  sectionKey: string,
): Section | undefined {
  return registry[`${unitSlug}:${sectionKey}`];
}
