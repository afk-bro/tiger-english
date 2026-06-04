import { describe, it, expect, vi } from "vitest";
import { createRateLimitedFetch } from "../throttle";

describe("createRateLimitedFetch", () => {
  it("spaces consecutive calls by at least the min interval", async () => {
    const INTERVAL = 40;
    const callTimes: number[] = [];
    const fakeFetch = vi.fn(async () => {
      callTimes.push(Date.now());
      return new Response("ok");
    }) as unknown as typeof fetch;

    const limited = createRateLimitedFetch(INTERVAL, fakeFetch);
    // Fire three concurrently — the limiter must still serialize + space them.
    await Promise.all([
      limited("https://x/1"),
      limited("https://x/2"),
      limited("https://x/3"),
    ]);

    expect(callTimes).toHaveLength(3);
    // Allow a small scheduler tolerance below the nominal interval.
    expect(callTimes[1] - callTimes[0]).toBeGreaterThanOrEqual(INTERVAL - 5);
    expect(callTimes[2] - callTimes[1]).toBeGreaterThanOrEqual(INTERVAL - 5);
  });

  it("passes arguments through to the underlying fetch and returns its result", async () => {
    const fakeFetch = vi.fn(async () => new Response("body")) as unknown as typeof fetch;
    const limited = createRateLimitedFetch(0, fakeFetch);
    const res = await limited("https://x/y", { method: "POST" });
    expect(fakeFetch).toHaveBeenCalledWith("https://x/y", { method: "POST" });
    expect(await res.text()).toBe("body");
  });
});
