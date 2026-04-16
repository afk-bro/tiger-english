// src/features/lessons/data/getUnit.ts
import type { Unit } from "../lesson.types";
import { units } from "./units";

export function getUnit(slug: string): Unit | undefined {
  return units.find((u) => u.slug === slug);
}
