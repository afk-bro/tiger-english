/**
 * "Has the user already seen the unit-complete celebration for this
 * unit?" — persisted in localStorage so the modal fires exactly once
 * per unit per browser, not on every reload of a completed unit.
 *
 * SSR-safe: reads/writes are no-ops when `window` is undefined (the
 * Vite SPA never SSRs in production but tests can run in jsdom which
 * provides localStorage; the `typeof window` guard is just belt-and-
 * suspenders for any future render-on-server scenario).
 */

const STORAGE_KEY_PREFIX = "tiger-english:unit-celebrated:";

function key(unitSlug: string): string {
  return `${STORAGE_KEY_PREFIX}${unitSlug}`;
}

export function hasUnitBeenCelebrated(unitSlug: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key(unitSlug)) === "true";
  } catch {
    // localStorage can throw in private-browsing mode on Safari and in
    // some sandboxed iframes. Treat it as "not celebrated yet" so the
    // user still sees the modal — re-celebrating is a less bad failure
    // mode than silently swallowing the moment.
    return false;
  }
}

export function markUnitAsCelebrated(unitSlug: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(unitSlug), "true");
  } catch {
    // Same rationale as above — best-effort write.
  }
}
