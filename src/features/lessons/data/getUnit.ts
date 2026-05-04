// src/features/lessons/data/getUnit.ts
import type { Unit } from "../lesson.types";
import { units } from "./units";
import { hydrateUnit } from "./imageHydration";
import { unitImagesSidecars } from "./images";

export function getUnit(slug: string): Unit | undefined {
  const unit = units.find((u) => u.slug === slug);
  if (!unit) return undefined;
  const sidecar = unitImagesSidecars[slug] ?? {};
  return hydrateUnit(unit, sidecar);
}

/**
 * Returns the next unit (in `units` array order) whose status is "available",
 * starting AFTER the unit with `currentSlug`. Skips "coming-soon" and "locked"
 * units. Returns undefined if `currentSlug` isn't found, the units array is
 * empty, or no subsequent unit qualifies.
 *
 * Note: the returned unit is NOT hydrated with sidecar image URLs — callers
 * that need hydrated unit data should pipe the result through `getUnit(slug)`
 * with the returned unit's slug. For the next-lesson CTA's needs (slug,
 * number, title, translations), the raw unit is sufficient.
 */
export function getNextAvailableUnit(currentSlug: string): Unit | undefined {
  if (units.length === 0) return undefined;
  const currentIndex = units.findIndex((u) => u.slug === currentSlug);
  if (currentIndex === -1) return undefined;
  for (let i = currentIndex + 1; i < units.length; i++) {
    if (units[i].status === "available") return units[i];
  }
  return undefined;
}
