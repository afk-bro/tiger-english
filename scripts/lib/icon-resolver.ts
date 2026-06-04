// scripts/lib/icon-resolver.ts
// Resolves a vocab noun to a rasterized Twemoji PNG. Pinning ONE icon
// set keeps every lesson image stylistically consistent; colorful
// emoji glyphs are easy to tell apart in a match grid. Pure + injectable
// so tests run without network or native rasterizer.
//
// Twemoji names icons descriptively ("closed-book", "world-map"), NOT by
// bare noun — there is no `twemoji:book`. So we resolve the icon NAME via
// Iconify's search API (top hit within the set), then fetch that name's
// SVG. An ALIASES override short-circuits search for known bad top-hits.
import { Resvg } from "@resvg/resvg-js";

export const ICON_SET = "twemoji";
export const ICON_PX = 512;

// Direct word -> icon-name overrides, applied BEFORE search and trusted
// (they bypass the acceptance guard). Use when the search top-hit is wrong
// or when you want a specific glyph. Keys are the normalized query
// (lowercase, spaces). Grow this as the dry-run surfaces bad matches.
const ALIASES: Record<string, string> = {
  bin: "wastebasket",
  "rubbish bin": "wastebasket",
  rubber: "eraser",
  computer: "desktop-computer", // search picks "computer-disk" (a floppy)
};

// Words with no sensible Twemoji glyph — skip icon resolution entirely so
// the photo fallback handles them. The acceptance guard catches most no-emoji
// words (table -> "potable-water", desk -> "desktop-computer"), but some slip
// through as a real token match (board -> "clapper-board" 🎬).
const FORCE_PHOTO = new Set<string>(["board"]);

export function normalizeIconQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .replace(/^(a|an|the)\s+/, "")
    .replace(/\s+/g, " ");
}

export type IconFetchers = {
  /** Returns the best matching icon NAME within the set (no prefix), or
   *  null when search finds nothing. */
  searchName: (set: string, query: string) => Promise<string | null>;
  /** Returns SVG markup for a specific icon name, or null when absent. */
  fetchSvg: (set: string, name: string) => Promise<string | null>;
};

export function rasterizeSvg(svg: string): Buffer {
  const r = new Resvg(svg, { fitTo: { mode: "width", value: ICON_PX } });
  return r.render().asPng();
}

// Guards against garbage fuzzy matches: a search hit is only trusted if the
// icon name contains EVERY query word as a whole hyphen-delimited token.
// "world-map" matches "map" ✓; "potable-water" does NOT match "table" ✗.
export function iconNameMatchesQuery(query: string, iconName: string): boolean {
  const nameTokens = new Set(iconName.toLowerCase().split("-"));
  return query
    .toLowerCase()
    .split(" ")
    .every((word) => nameTokens.has(word));
}

export async function resolveIcon(
  query: string,
  fetchers: IconFetchers,
  rasterize: (svg: string) => Buffer = rasterizeSvg,
): Promise<Buffer | null> {
  const norm = normalizeIconQuery(query);
  if (FORCE_PHOTO.has(norm)) return null;

  let name = ALIASES[norm] ?? null;
  if (!name) {
    // Search is untrusted — accept the top hit only if it genuinely names
    // the queried thing; otherwise fall through to the photo source.
    const hit = await fetchers.searchName(ICON_SET, norm);
    if (hit && iconNameMatchesQuery(norm, hit)) name = hit;
  }
  if (!name) return null;

  const svg = await fetchers.fetchSvg(ICON_SET, name);
  if (!svg) return null;
  return rasterize(svg);
}

// Real Iconify fetchers. Both throw on 429/5xx so the caller's withRetry
// backoff kicks in (Iconify rate-limits under burst); a clean miss returns
// null so the caller falls through to the photo source. Accepts an injected
// fetch so the pipeline can share a rate-limited fetch across providers.
export function makeIconifyFetchers(fetchImpl: typeof fetch = fetch): IconFetchers {
  return {
    searchName: async (set, query) => {
      const u = new URL("https://api.iconify.design/search");
      u.searchParams.set("query", query);
      u.searchParams.set("prefix", set);
      u.searchParams.set("limit", "1");
      const res = await fetchImpl(u);
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`Iconify search ${res.status}`);
      }
      if (!res.ok) return null;
      const json = (await res.json()) as { icons?: string[] };
      const first = json.icons?.[0];
      if (!first) return null;
      return first.startsWith(`${set}:`) ? first.slice(set.length + 1) : first;
    },
    fetchSvg: async (set, name) => {
      const res = await fetchImpl(`https://api.iconify.design/${set}/${name}.svg`);
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`Iconify svg ${res.status}`);
      }
      // The .svg endpoint 404s on missing icons, but can also 200 with a
      // body that isn't an <svg>, so we check both.
      if (!res.ok) return null;
      const text = await res.text();
      return text.includes("<svg") ? text : null;
    },
  };
}
