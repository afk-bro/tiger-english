// src/features/lessons/data/registerAllSections.ts
// Single source of truth for which section files get registered at module
// load. Both `getSection.ts` (frontend) and `scripts/generate-lesson-images.ts`
// import this — adding a new lesson section means adding one import here.

import "./sections/unit-1/overview";
import "./sections/unit-1/grammar";
import "./sections/unit-1/vocabulary";
import "./sections/unit-1/dialogues";
import "./sections/unit-1/activities";
// Add unit-2 (and beyond) section imports here as they come online.
