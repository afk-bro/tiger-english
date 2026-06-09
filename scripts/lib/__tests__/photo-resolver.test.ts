import { describe, it, expect, vi } from "vitest";
import { resolvePhoto, makePixabayFetchers } from "../photo-resolver";

describe("resolvePhoto", () => {
  it("downloads the top search hit and returns bytes + the source url as ref", async () => {
    const search = vi.fn().mockResolvedValue("https://cdn/pic.jpg");
    const download = vi.fn().mockResolvedValue(Buffer.from("JPG"));
    const out = await resolvePhoto("bulletin board", { search, download });
    expect(search).toHaveBeenCalledWith("bulletin board");
    expect(download).toHaveBeenCalledWith("https://cdn/pic.jpg");
    expect(out?.bytes.toString()).toBe("JPG");
    expect(out?.ref).toBe("https://cdn/pic.jpg");
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

describe("makePixabayFetchers.download", () => {
  const res = (status: number) =>
    ({ status, ok: status >= 200 && status < 300, arrayBuffer: async () => new ArrayBuffer(2) }) as Response;

  it("throws on 429/5xx so withRetry can back off (not a permanent miss)", async () => {
    const f429 = makePixabayFetchers("k", (async () => res(429)) as typeof fetch);
    await expect(f429.download("https://cdn/x.jpg")).rejects.toThrow(/429/);
    const f503 = makePixabayFetchers("k", (async () => res(503)) as typeof fetch);
    await expect(f503.download("https://cdn/x.jpg")).rejects.toThrow(/503/);
  });

  it("returns null on a non-retryable non-2xx (e.g. 404)", async () => {
    const f404 = makePixabayFetchers("k", (async () => res(404)) as typeof fetch);
    expect(await f404.download("https://cdn/x.jpg")).toBeNull();
  });
});
