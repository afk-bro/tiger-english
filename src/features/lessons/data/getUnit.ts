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
