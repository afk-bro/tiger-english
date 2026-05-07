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
 */
export function resizedStorageUrl(url: string, opts: ResizeOptions): string {
  if (typeof url !== "string" || url.length === 0) return url;

  // Already a render URL — strip its query and re-apply ours.
  if (url.includes(RENDER_PATH)) {
    const [base] = url.split("?");
    return appendParams(base, opts);
  }

  // Object URL we can rewrite.
  if (url.includes(OBJECT_PATH)) {
    const [base] = url.split("?");
    const rendered = base.replace(OBJECT_PATH, RENDER_PATH);
    return appendParams(rendered, opts);
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

function appendParams(base: string, opts: ResizeOptions): string {
  const params = new URLSearchParams();
  params.set("width", String(opts.width));
  params.set("resize", opts.resize ?? "cover");
  params.set("quality", String(opts.quality ?? 80));
  return `${base}?${params.toString()}`;
}
