// src/features/lessons/data/images/index.ts
// Single point of import for per-unit image sidecars. Add new units here as
// they come online. Each JSON file is generated/updated by
// scripts/generate-lesson-images.ts; do not hand-edit URLs.

import unit1 from "./unit-1.images.json";
import unit2 from "./unit-2.images.json";

export type SidecarEntry = {
  url: string;
  source: "icon" | "photo";
  ref: string;
  generatedAt: string;
};

export type UnitSidecar = Record<string, SidecarEntry>;

// Sidecar JSON on disk may predate the current SidecarEntry shape (e.g.
// Leonardo-era entries carrying promptHash/model). The runtime only reads
// `url`, so we narrow through `unknown`; a `--force` regenerate rewrites the
// files to the current shape.
export const unitImagesSidecars: Record<string, UnitSidecar> = {
  "unit-1": unit1 as unknown as UnitSidecar,
  "unit-2": unit2 as unknown as UnitSidecar,
};
