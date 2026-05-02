// scripts/lesson-image-config.ts
// Pure constants and helpers for the lesson image generation pipeline.
// See docs/superpowers/specs/2026-05-02-lesson-image-generation-design.md.
import { createHash } from "crypto";

export const STYLE_SUFFIX =
  "flat vector illustration, soft pastel palette, simple background, friendly characters, ESL textbook style";
export const MODEL_ID = "leonardo-phoenix-1.0";
export const IMAGE_DIM = { width: 1024, height: 1024 } as const;

export function templateVocabPrompt(word: string): string {
  return `${word}, ${STYLE_SUFFIX}`;
}

type HashOpts = { model?: string; styleSuffix?: string };

export function computePromptHash(prompt: string, opts: HashOpts = {}): string {
  const model = opts.model ?? MODEL_ID;
  const styleSuffix = opts.styleSuffix ?? STYLE_SUFFIX;
  const composite = `${prompt} ${model} ${styleSuffix}`;
  return createHash("sha256").update(composite).digest("hex");
}
