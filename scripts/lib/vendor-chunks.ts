/**
 * Vite/Rollup manualChunks helper. Maps a Rollup module id to a named
 * vendor chunk so heavy third-party deps (React, Supabase, i18next, etc.)
 * are split out of the main app bundle and can be cached independently.
 *
 * Lives in scripts/lib/ so it's importable from both vite.config.ts and
 * the unit-test in scripts/__tests__/ — vite.config.ts itself can't be
 * imported into vitest because it pulls in the vite plugin pipeline.
 *
 * Path matching is normalized: Rollup module ids contain backslashes on
 * Windows, so the helper replaces them before string-matching.
 */
export function vendorChunkFor(id: string): string | undefined {
  const normalized = id.replace(/\\/g, "/");
  if (!normalized.includes("/node_modules/")) return undefined;
  if (normalized.includes("/react-router")) return "vendor-router";
  if (normalized.includes("/@supabase/")) return "vendor-supabase";
  if (
    normalized.includes("/i18next") ||
    normalized.includes("/react-i18next")
  ) {
    return "vendor-i18n";
  }
  if (
    normalized.includes("/react-hook-form") ||
    normalized.includes("/@hookform/") ||
    normalized.includes("/zod")
  ) {
    return "vendor-forms";
  }
  if (
    normalized.includes("/@headlessui/") ||
    normalized.includes("/lucide-react") ||
    normalized.includes("/sonner")
  ) {
    return "vendor-ui";
  }
  // React itself goes last so the more specific buckets above (which
  // include react-* packages depending on react) catch first.
  if (
    normalized.includes("/react/") ||
    normalized.includes("/react-dom/") ||
    normalized.includes("/scheduler/")
  ) {
    return "vendor-react";
  }
  return undefined;
}
