import { describe, it, expect } from "vitest";
import {
  STYLE_SUFFIX,
  OBJECT_STYLE_SUFFIX,
  MODEL_ID,
  IMAGE_DIM,
  computePromptHash,
  templateVocabPrompt,
} from "../lesson-image-config";

describe("STYLE_SUFFIX, MODEL_ID, IMAGE_DIM", () => {
  it("are non-empty", () => {
    expect(STYLE_SUFFIX.length).toBeGreaterThan(0);
    expect(MODEL_ID.length).toBeGreaterThan(0);
    expect(IMAGE_DIM.width).toBeGreaterThan(0);
    expect(IMAGE_DIM.height).toBeGreaterThan(0);
  });
});

describe("templateVocabPrompt", () => {
  it("appends OBJECT_STYLE_SUFFIX so vocab thumbnails render as isolated objects", () => {
    // Switched from STYLE_SUFFIX (which has "friendly characters" and
    // produced photoreal scenes with people for vocab like "pencil")
    // to OBJECT_STYLE_SUFFIX (single isolated object, no people).
    expect(templateVocabPrompt("classroom")).toBe(`classroom, ${OBJECT_STYLE_SUFFIX}`);
  });
});

describe("computePromptHash", () => {
  it("produces a 64-char hex SHA-256 string", () => {
    const h = computePromptHash("hello");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes when the model changes", () => {
    const a = computePromptHash("hello", { model: "model-a" });
    const b = computePromptHash("hello", { model: "model-b" });
    expect(a).not.toBe(b);
  });

  it("changes when the style suffix changes", () => {
    const a = computePromptHash("hello", { styleSuffix: "a" });
    const b = computePromptHash("hello", { styleSuffix: "b" });
    expect(a).not.toBe(b);
  });

  it("changes when the negative prompt changes", () => {
    const a = computePromptHash("hello", { negativePrompt: "no text" });
    const b = computePromptHash("hello", { negativePrompt: "no numbers" });
    expect(a).not.toBe(b);
  });

  it("changes when postprocess changes", () => {
    const a = computePromptHash("hello", { postprocess: "nobg" });
    const b = computePromptHash("hello", { postprocess: "none" });
    expect(a).not.toBe(b);
  });

  it("is stable for the same input", () => {
    expect(computePromptHash("hello")).toBe(computePromptHash("hello"));
  });
});
