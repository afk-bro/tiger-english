// src/features/lessons/data/sectionRegistry.ts
import type { Section } from "../lesson.types";
import { hydrateSection } from "./imageHydration";
import { unitImagesSidecars } from "./images";

const registry: Record<string, Section> = {};

export function registerSection(section: Section): void {
  const key = `${section.unitSlug}:${section.key}`;
  if (import.meta.env.DEV && registry[key] !== undefined) {
    throw new Error(`Duplicate section registration for key "${key}"`);
  }
  registry[key] = section;
}

export function lookupSection(
  unitSlug: string,
  sectionKey: string,
): Section | undefined {
  const stored = registry[`${unitSlug}:${sectionKey}`];
  if (!stored) return undefined;
  const sidecar = unitImagesSidecars[unitSlug] ?? {};
  return hydrateSection(stored, sidecar);
}
