import { describe, it, expect, vi } from "vitest";
import { resolvePhoto } from "../photo-resolver";

describe("resolvePhoto", () => {
  it("downloads the top search hit", async () => {
    const search = vi.fn().mockResolvedValue("https://cdn/pic.jpg");
    const download = vi.fn().mockResolvedValue(Buffer.from("JPG"));
    const out = await resolvePhoto("bulletin board", { search, download });
    expect(search).toHaveBeenCalledWith("bulletin board");
    expect(download).toHaveBeenCalledWith("https://cdn/pic.jpg");
    expect(out?.toString()).toBe("JPG");
  });

  it("returns null when search finds nothing", async () => {
    const search = vi.fn().mockResolvedValue(null);
    const download = vi.fn();
    const out = await resolvePhoto("xyzzy", { search, download });
    expect(out).toBeNull();
    expect(download).not.toHaveBeenCalled();
  });

  it("returns null when download fails", async () => {
    const search = vi.fn().mockResolvedValue("https://cdn/pic.jpg");
    const download = vi.fn().mockResolvedValue(null);
    const out = await resolvePhoto("clock", { search, download });
    expect(out).toBeNull();
  });
});
