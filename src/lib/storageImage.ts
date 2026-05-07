/**
 * Helpers for resizing images served out of Supabase Storage. The
 * generation pipeline uploads square 1024×1024 PNGs to the
 * `lesson-images` bucket and stores the resulting public URL on each
 * lesson item; rendering the source size unconditionally is wasteful
 * for small thumbnails (vocab cards display at 64×64 on a 150 KB asset).
 *
 * Supabase exposes server-side image transformations on the same
 * project at a different URL prefix:
 *
 *   /storage/v1/object/public/<bucket>/<path>          (original)
 *   /storage/v1/render/image/public/<bucket>/<path>    (transformed)
 *
 * Adding `?width=N&resize=cover&quality=Q` to the render URL returns a
 * resized variant. Non-Supabase URLs (e.g. external CDN, future hosts)
 * pass through unchanged so the helper is safe to apply blindly.
 */

const OBJECT_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

export type ResizeOptions = {
  width: number;
  /** JPEG-style quality 20–100. Defaults to 80 (Supabase's default). */
  quality?: number;
  /** Resize mode. `cover` matches CSS `object-fit: cover`. */
  resize?: "cover" | "contain" | "fill";
};

/**
 * Returns a transformed URL if `url` points at a Supabase Storage
 * public object, otherwise returns `url` unchanged. Idempotent: passing
 * an already-transformed URL just updates the query params.
 *
 * The pathname check (rather than a substring scan) matters: an
 * external URL whose query string happens to contain
 * `/storage/v1/object/public/` (e.g. a redirector with a `next=` param)
 * must not be rewritten as if it were a Supabase asset.
 */
export function resizedStorageUrl(url: string, opts: ResizeOptions): string {
  if (typeof url !== "string" || url.length === 0) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Relative or otherwise unparseable — leave alone.
    return url;
  }

  if (parsed.pathname.startsWith(RENDER_PATH)) {
    // Already a render URL — drop existing transform params and re-apply ours.
    parsed.search = "";
    return applyParams(parsed, opts);
  }

  if (parsed.pathname.startsWith(OBJECT_PATH)) {
    parsed.pathname = parsed.pathname.replace(OBJECT_PATH, RENDER_PATH);
    parsed.search = "";
    return applyParams(parsed, opts);
  }

  return url;
}

/**
 * Builds a `srcSet` string for 1× and 2× display densities, plus the
 * matching `src` (1×) value. Use directly on `<img src srcSet>`.
 */
export function srcSetFor(
  url: string,
  displayWidth: number,
  opts: Omit<ResizeOptions, "width"> = {},
): { src: string; srcSet: string } {
  const oneX = resizedStorageUrl(url, { ...opts, width: displayWidth });
  const twoX = resizedStorageUrl(url, { ...opts, width: displayWidth * 2 });
  return {
    src: oneX,
    srcSet: `${oneX} 1x, ${twoX} 2x`,
  };
}

function applyParams(parsed: URL, opts: ResizeOptions): string {
  parsed.searchParams.set("width", String(opts.width));
  parsed.searchParams.set("resize", opts.resize ?? "cover");
  parsed.searchParams.set("quality", String(opts.quality ?? 80));
  return parsed.toString();
}
