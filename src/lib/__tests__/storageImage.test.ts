import { describe, it, expect, beforeEach, vi } from "vitest";
import { resizedStorageUrl, srcSetFor } from "../storageImage";

const OBJECT_URL =
  "https://abc.supabase.co/storage/v1/object/public/lesson-images/unit-1/foo.png";
const RENDER_URL =
  "https://abc.supabase.co/storage/v1/render/image/public/lesson-images/unit-1/foo.png";

// The transform gate defaults to off — flipping the env var on for the
// "transforms enabled" describe blocks keeps the existing assertions
// honest. Callers who run these tests without the flag still get
// pass-through behavior, which is what the runtime sees by default.
beforeEach(() => {
  vi.stubEnv("VITE_SUPABASE_IMAGE_TRANSFORMS", "true");
});

describe("resizedStorageUrl (transforms enabled)", () => {
  it("rewrites a public object URL to the render-image endpoint", () => {
    const out = resizedStorageUrl(OBJECT_URL, { width: 64 });
    expect(out).toBe(`${RENDER_URL}?width=64&resize=cover&quality=80`);
  });

  it("respects custom quality and resize mode", () => {
    const out = resizedStorageUrl(OBJECT_URL, {
      width: 256,
      quality: 70,
      resize: "contain",
    });
    expect(out).toBe(`${RENDER_URL}?width=256&resize=contain&quality=70`);
  });

  it("is idempotent: re-applies new params on an already-transformed URL", () => {
    const once = resizedStorageUrl(OBJECT_URL, { width: 64 });
    const twice = resizedStorageUrl(once, { width: 128 });
    expect(twice).toBe(`${RENDER_URL}?width=128&resize=cover&quality=80`);
  });

  it("passes through external (non-Supabase-Storage) URLs unchanged", () => {
    const external = "https://images.example.com/foo.jpg";
    expect(resizedStorageUrl(external, { width: 64 })).toBe(external);
  });

  it("passes through empty or non-string-shaped values unchanged", () => {
    expect(resizedStorageUrl("", { width: 64 })).toBe("");
  });

  it("does not rewrite an external URL that merely has the storage path in its query string", () => {
    // The substring-based version of this helper would have matched and
    // mangled this URL — pin the path-based check.
    const spoofed =
      "https://redirector.example.com/r?next=/storage/v1/object/public/lesson-images/x.png";
    expect(resizedStorageUrl(spoofed, { width: 64 })).toBe(spoofed);
  });

  it("returns relative or unparseable URLs unchanged", () => {
    expect(resizedStorageUrl("/relative/path.png", { width: 64 })).toBe("/relative/path.png");
    expect(resizedStorageUrl("not a url", { width: 64 })).toBe("not a url");
  });
});

describe("resizedStorageUrl (transforms disabled — default)", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_SUPABASE_IMAGE_TRANSFORMS", "");
  });

  it("returns Supabase object URLs unchanged when the flag is off", () => {
    // This is the safe default for projects without Image Transforms
    // enabled on Supabase Pro — the render endpoint 403s with
    // "FeatureNotEnabled", so we'd otherwise emit broken <img src>s.
    expect(resizedStorageUrl(OBJECT_URL, { width: 64 })).toBe(OBJECT_URL);
  });

  it("returns external URLs unchanged regardless of the flag", () => {
    const external = "https://images.example.com/foo.jpg";
    expect(resizedStorageUrl(external, { width: 64 })).toBe(external);
  });
});

describe("srcSetFor", () => {
  it("emits 1x + 2x densities at the requested display width", () => {
    const { src, srcSet } = srcSetFor(OBJECT_URL, 64);
    expect(src).toContain("width=64");
    expect(srcSet).toBe(
      `${RENDER_URL}?width=64&resize=cover&quality=80 1x, ${RENDER_URL}?width=128&resize=cover&quality=80 2x`,
    );
  });

  it("forwards quality + resize to both densities", () => {
    const { srcSet } = srcSetFor(OBJECT_URL, 100, { quality: 90, resize: "contain" });
    expect(srcSet).toContain("width=100&resize=contain&quality=90 1x");
    expect(srcSet).toContain("width=200&resize=contain&quality=90 2x");
  });

  it("still works for external URLs (degrades to identical 1x and 2x src)", () => {
    const external = "https://images.example.com/foo.jpg";
    const { src, srcSet } = srcSetFor(external, 64);
    expect(src).toBe(external);
    expect(srcSet).toBe(`${external} 1x, ${external} 2x`);
  });

  it("with transforms disabled, emits the original URL for both 1x and 2x", () => {
    vi.stubEnv("VITE_SUPABASE_IMAGE_TRANSFORMS", "");
    const { src, srcSet } = srcSetFor(OBJECT_URL, 64);
    expect(src).toBe(OBJECT_URL);
    expect(srcSet).toBe(`${OBJECT_URL} 1x, ${OBJECT_URL} 2x`);
  });
});
