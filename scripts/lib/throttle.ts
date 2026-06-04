// scripts/lib/throttle.ts
// A fetch wrapper that serializes outbound requests and spaces them by a
// minimum interval, so the lesson-image pipeline stays under provider rate
// limits. Pixabay allows 100 requests / 60s → one request per 600ms; a
// single shared limiter across the icon + photo fetchers keeps the COMBINED
// request rate within that budget.

export function createRateLimitedFetch(
  minIntervalMs: number,
  fetchImpl: typeof fetch = fetch,
): typeof fetch {
  let last = 0;
  // Serialize via a promise chain so requests are spaced regardless of how
  // many the caller fires concurrently.
  let queue: Promise<void> = Promise.resolve();
  return ((...args: Parameters<typeof fetch>) => {
    const gate = queue.then(async () => {
      const wait = last + minIntervalMs - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      last = Date.now();
    });
    queue = gate;
    return gate.then(() => fetchImpl(...args));
  }) as typeof fetch;
}
