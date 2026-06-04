import { describe, it, expect, vi } from "vitest";
import { resolveIcon, normalizeIconQuery } from "../icon-resolver";

describe("normalizeIconQuery", () => {
  it("lowercases, trims, strips a leading article, collapses whitespace", () => {
    expect(normalizeIconQuery("  The World Map ")).toBe("world map");
  });
});

describe("resolveIcon", () => {
  it("searches for the icon name, then fetches + rasterizes that name's SVG", async () => {
    // Twemoji has no `book` icon — search resolves the real name.
    const searchName = vi.fn().mockResolvedValue("closed-book");
    const fetchSvg = vi.fn().mockResolvedValue("<svg></svg>");
    const rasterize = vi.fn().mockReturnValue(Buffer.from("PNG"));
    const out = await resolveIcon("book", { searchName, fetchSvg }, rasterize);
    expect(searchName).toHaveBeenCalledWith("twemoji", "book");
    expect(fetchSvg).toHaveBeenCalledWith("twemoji", "closed-book");
    expect(rasterize).toHaveBeenCalledWith("<svg></svg>");
    expect(out?.toString()).toBe("PNG");
  });

  it("applies the alias override and skips search entirely", async () => {
    const searchName = vi.fn();
    const fetchSvg = vi.fn().mockResolvedValue("<svg></svg>");
    await resolveIcon("rubbish bin", { searchName, fetchSvg }, () => Buffer.from("x"));
    expect(searchName).not.toHaveBeenCalled();
    expect(fetchSvg).toHaveBeenCalledWith("twemoji", "wastebasket");
  });

  it("returns null when search finds no name (without fetching or rasterizing)", async () => {
    const searchName = vi.fn().mockResolvedValue(null);
    const fetchSvg = vi.fn();
    const rasterize = vi.fn();
    const out = await resolveIcon("flibbertigibbet", { searchName, fetchSvg }, rasterize);
    expect(out).toBeNull();
    expect(fetchSvg).not.toHaveBeenCalled();
    expect(rasterize).not.toHaveBeenCalled();
  });

  it("returns null when the named icon has no SVG (without rasterizing)", async () => {
    const searchName = vi.fn().mockResolvedValue("closed-book");
    const fetchSvg = vi.fn().mockResolvedValue(null);
    const rasterize = vi.fn();
    const out = await resolveIcon("book", { searchName, fetchSvg }, rasterize);
    expect(out).toBeNull();
    expect(rasterize).not.toHaveBeenCalled();
  });
});
