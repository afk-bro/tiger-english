// scripts/lib/photo-resolver.ts
// Fallback image source for nouns the icon set lacks. Pixabay is chosen
// because its license requires no per-image attribution — no credits UI.
// Pure + injectable; the real fetchers are built from an API key.

export type PhotoFetchers = {
  /** Returns a downloadable image URL, or null when no result. */
  search: (query: string) => Promise<string | null>;
  /** Returns image bytes, or null on HTTP failure. */
  download: (url: string) => Promise<Buffer | null>;
};

/** Resolved photo: the bytes plus the source URL, recorded as sidecar `ref`. */
export type PhotoResult = { bytes: Buffer; ref: string };

export async function resolvePhoto(
  query: string,
  fetchers: PhotoFetchers,
): Promise<PhotoResult | null> {
  const url = await fetchers.search(query);
  if (!url) return null;
  const bytes = await fetchers.download(url);
  if (!bytes) return null;
  return { bytes, ref: url };
}

export function makePixabayFetchers(
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): PhotoFetchers {
  return {
    search: async (query) => {
      const u = new URL("https://pixabay.com/api/");
      u.searchParams.set("key", apiKey);
      u.searchParams.set("q", query);
      u.searchParams.set("image_type", "photo");
      u.searchParams.set("per_page", "3"); // Pixabay minimum is 3
      u.searchParams.set("safesearch", "true");
      const res = await fetchImpl(u);
      // 429/5xx are transient (Pixabay throttles bursts) — throw so the
      // caller's withRetry backoff kicks in. Other non-ok = clean miss.
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`Pixabay search ${res.status}`);
      }
      if (!res.ok) return null;
      const json = (await res.json()) as { hits?: { webformatURL?: string }[] };
      return json.hits?.[0]?.webformatURL ?? null;
    },
    download: async (url) => {
      const res = await fetchImpl(url);
      // Mirror search: a throttled/transient download should be retried by
      // the caller's withRetry, not treated as a permanent miss.
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`Pixabay download ${res.status}`);
      }
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    },
  };
}
