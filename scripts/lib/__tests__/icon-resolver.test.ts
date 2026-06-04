import { describe, it, expect, vi } from "vitest";
import { resolveIcon, normalizeIconQuery, iconNameMatchesQuery } from "../icon-resolver";

describe("iconNameMatchesQuery", () => {
  it("accepts when every query word is a whole token in the icon name", () => {
    expect(iconNameMatchesQuery("map", "world-map")).toBe(true);
    expect(iconNameMatchesQuery("ruler", "straight-ruler")).toBe(true);
    expect(iconNameMatchesQuery("chair", "chair")).toBe(true);
  });
  it("rejects substring-only fuzzy matches", () => {
    expect(iconNameMatchesQuery("table", "potable-water")).toBe(false);
    expect(iconNameMatchesQuery("desk", "desktop-computer")).toBe(false);
  });
});

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

  it("rejects a fuzzy search hit that fails the guard (falls through to null)", async () => {
    // "table" -> search returns "potable-water"; guard rejects it.
    const searchName = vi.fn().mockResolvedValue("potable-water");
    const fetchSvg = vi.fn();
    const out = await resolveIcon("table", { searchName, fetchSvg }, () => Buffer.from("x"));
    expect(out).toBeNull();
    expect(fetchSvg).not.toHaveBeenCalled();
  });

  it("skips icon resolution for FORCE_PHOTO words without searching", async () => {
    const searchName = vi.fn();
    const fetchSvg = vi.fn();
    const out = await resolveIcon("board", { searchName, fetchSvg }, () => Buffer.from("x"));
    expect(out).toBeNull();
    expect(searchName).not.toHaveBeenCalled();
  });

  it("trusts an alias even when it would fail the token guard", async () => {
    // "rubbish bin" -> "wastebasket": no shared token, but the alias is explicit.
    const searchName = vi.fn();
    const fetchSvg = vi.fn().mockResolvedValue("<svg></svg>");
    await resolveIcon("rubbish bin", { searchName, fetchSvg }, () => Buffer.from("x"));
    expect(searchName).not.toHaveBeenCalled();
    expect(fetchSvg).toHaveBeenCalledWith("twemoji", "wastebasket");
  });
});
