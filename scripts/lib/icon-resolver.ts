// scripts/lib/icon-resolver.ts
// Resolves a vocab noun to a rasterized Twemoji PNG. Pinning ONE icon
// set keeps every lesson image stylistically consistent; colorful
// emoji glyphs are easy to tell apart in a match grid. Pure + injectable
// so tests run without network or native rasterizer.
import { Resvg } from "@resvg/resvg-js";

export const ICON_SET = "twemoji";
export const ICON_PX = 512;

// Known vocab-word -> Twemoji-name mismatches. Grow this as the dry-run
// surfaces UNRESOLVED items that DO have a sensible emoji.
const ALIASES: Record<string, string> = {
  bin: "wastebasket",
  "rubbish-bin": "wastebasket",
  rubber: "eraser",
};

export function normalizeIconQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .replace(/^(a|an|the)\s+/, "")
    .replace(/\s+/g, "-");
}

export type IconFetchers = {
  /** Returns SVG markup, or null when the set has no such icon. */
  fetchSvg: (set: string, name: string) => Promise<string | null>;
};

export function rasterizeSvg(svg: string): Buffer {
  const r = new Resvg(svg, { fitTo: { mode: "width", value: ICON_PX } });
  return r.render().asPng();
}

export async function resolveIcon(
  query: string,
  fetchers: IconFetchers,
  rasterize: (svg: string) => Buffer = rasterizeSvg,
): Promise<Buffer | null> {
  const norm = normalizeIconQuery(query);
  const name = ALIASES[norm] ?? norm;
  const svg = await fetchers.fetchSvg(ICON_SET, name);
  if (!svg) return null;
  return rasterize(svg);
}

// Real Iconify fetcher. The .svg endpoint 404s on missing icons, but can
// also 200 with a body that isn't an <svg>, so we check both.
export function makeIconifyFetchers(): IconFetchers {
  return {
    fetchSvg: async (set, name) => {
      const res = await fetch(`https://api.iconify.design/${set}/${name}.svg`);
      if (!res.ok) return null;
      const text = await res.text();
      return text.includes("<svg") ? text : null;
    },
  };
}
