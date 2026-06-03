import { describe, it, expect, vi } from "vitest";
import { resolveIcon, normalizeIconQuery } from "../icon-resolver";

describe("normalizeIconQuery", () => {
  it("lowercases, trims articles, hyphenates", () => {
    expect(normalizeIconQuery("  The World Map ")).toBe("world-map");
  });
});

describe("resolveIcon", () => {
  it("returns rasterized bytes on an icon hit", async () => {
    const fetchSvg = vi.fn().mockResolvedValue("<svg></svg>");
    const rasterize = vi.fn().mockReturnValue(Buffer.from("PNG"));
    const out = await resolveIcon("book", { fetchSvg }, rasterize);
    expect(fetchSvg).toHaveBeenCalledWith("twemoji", "book");
    expect(rasterize).toHaveBeenCalledWith("<svg></svg>");
    expect(out?.toString()).toBe("PNG");
  });

  it("applies the alias map before lookup", async () => {
    const fetchSvg = vi.fn().mockResolvedValue("<svg></svg>");
    await resolveIcon("world map", { fetchSvg }, () => Buffer.from("x"));
    expect(fetchSvg).toHaveBeenCalledWith("twemoji", "world-map");
  });

  it("returns null on a miss (no fetchSvg result)", async () => {
    const fetchSvg = vi.fn().mockResolvedValue(null);
    const rasterize = vi.fn();
    const out = await resolveIcon("flibbertigibbet", { fetchSvg }, rasterize);
    expect(out).toBeNull();
    expect(rasterize).not.toHaveBeenCalled();
  });
});
