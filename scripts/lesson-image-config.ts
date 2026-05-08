// scripts/lesson-image-config.ts
// Pure constants and helpers for the lesson image generation pipeline.
// See docs/superpowers/specs/2026-05-02-lesson-image-generation-design.md.
import { createHash } from "crypto";

export const STYLE_SUFFIX =
  "flat vector illustration, soft pastel palette, simple background, friendly characters, ESL textbook style";

// Stricter style suffix used for match-pair tiles, where each tile must
// depict ONE specific object isolated on a plain background. Phoenix 1.0
// produced photorealistic 3D renders and hallucinated extra subjects
// (e.g. a creature emerging from a book) when given the looser global
// suffix; Flux Schnell + this stricter language keeps tiles on-brief.
export const OBJECT_STYLE_SUFFIX =
  "flat vector illustration, soft pastel palette, plain solid background, ESL textbook style, single isolated object centered, no people, no animals, no text, no extra subjects";

// Flux Schnell. Faster than Phoenix and visibly more compliant with
// "single object, plain background" prompts in our test runs. The
// /generations API expects the model UUID; resolve via /platformModels.
export const MODEL_ID = "1dd50843-d653-4516-a8e3-f0238ee453ff";
export const IMAGE_DIM = { width: 1024, height: 1024 } as const;

export function templateVocabPrompt(word: string): string {
  return `${word}, ${STYLE_SUFFIX}`;
}

export function templatePairPrompt(prompt: string): string {
  return `${prompt}, ${OBJECT_STYLE_SUFFIX}`;
}

type HashOpts = { model?: string; styleSuffix?: string };

export function computePromptHash(prompt: string, opts: HashOpts = {}): string {
  const model = opts.model ?? MODEL_ID;
  const styleSuffix = opts.styleSuffix ?? STYLE_SUFFIX;
  const composite = `${prompt} ${model} ${styleSuffix}`;
  return createHash("sha256").update(composite).digest("hex");
}
