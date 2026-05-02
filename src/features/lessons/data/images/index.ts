// src/features/lessons/data/images/index.ts
// Single point of import for per-unit image sidecars. Add new units here as
// they come online. Each JSON file is generated/updated by
// scripts/generate-lesson-images.ts; do not hand-edit URLs.

import unit1 from "./unit-1.images.json";
import unit2 from "./unit-2.images.json";

export type SidecarEntry = {
  url: string;
  promptHash: string;
  model: string;
  generatedAt: string;
};

export type UnitSidecar = Record<string, SidecarEntry>;

export const unitImagesSidecars: Record<string, UnitSidecar> = {
  "unit-1": unit1 as UnitSidecar,
  "unit-2": unit2 as UnitSidecar,
};
