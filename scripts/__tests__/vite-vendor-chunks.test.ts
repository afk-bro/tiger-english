/**
 * Tests for the vendorChunkFor helper in vite.config.ts. Pins the bucket
 * routing rules — most importantly that paths still match on Windows
 * (where Rollup module ids contain backslashes instead of forward slashes).
 */
import { describe, it, expect } from "vitest";
import { vendorChunkFor } from "../lib/vendor-chunks";

// Helper: build POSIX and Windows variants of a node_modules path so each
// test exercises both, matching Rollup's actual output across platforms.
function pathPair(suffix: string): { posix: string; windows: string } {
  const posix = `/repo/node_modules/${suffix}`;
  const windows = `C:\\repo\\node_modules\\${suffix.replace(/\//g, "\\")}`;
  return { posix, windows };
}

describe("vendorChunkFor — package routing", () => {
  it.each([
    ["@supabase/supabase-js/dist/index.js", "vendor-supabase"],
    ["react-router-dom/dist/index.js", "vendor-router"],
    ["i18next/dist/cjs/i18next.js", "vendor-i18n"],
    ["react-i18next/dist/index.js", "vendor-i18n"],
    ["react-hook-form/dist/index.js", "vendor-forms"],
    ["@hookform/resolvers/zod/index.js", "vendor-forms"],
    ["zod/lib/index.js", "vendor-forms"],
    ["@headlessui/react/dist/index.js", "vendor-ui"],
    ["lucide-react/dist/icons/x.js", "vendor-ui"],
    ["sonner/dist/index.js", "vendor-ui"],
    ["react/index.js", "vendor-react"],
    ["react-dom/client.js", "vendor-react"],
    ["scheduler/cjs/scheduler.js", "vendor-react"],
  ])("routes %s → %s on both POSIX and Windows", (suffix, expected) => {
    const { posix, windows } = pathPair(suffix);
    expect(vendorChunkFor(posix)).toBe(expected);
    expect(vendorChunkFor(windows)).toBe(expected);
  });
});

describe("vendorChunkFor — bucket precedence", () => {
  it("react-router is matched before the catch-all vendor-react bucket", () => {
    // The react-router bucket comes earlier in the function; without the
    // ordering, /react/ would catch react-router first.
    expect(vendorChunkFor("/repo/node_modules/react-router/dist/index.js")).toBe(
      "vendor-router",
    );
    expect(
      vendorChunkFor("/repo/node_modules/react-router-dom/dist/index.js"),
    ).toBe("vendor-router");
  });

  it("react-i18next lands in vendor-i18n (not vendor-react)", () => {
    expect(
      vendorChunkFor("/repo/node_modules/react-i18next/dist/index.js"),
    ).toBe("vendor-i18n");
  });
});

describe("vendorChunkFor — non-vendor and unknown paths", () => {
  it("returns undefined for app source files (not in node_modules)", () => {
    expect(vendorChunkFor("/repo/src/main.tsx")).toBeUndefined();
    expect(vendorChunkFor("C:\\repo\\src\\main.tsx")).toBeUndefined();
  });

  it("returns undefined for unknown node_modules packages (default chunk)", () => {
    expect(vendorChunkFor("/repo/node_modules/clsx/dist/clsx.js")).toBeUndefined();
    expect(vendorChunkFor("/repo/node_modules/zustand/esm/index.js")).toBeUndefined();
  });

  it("does not falsely match a path that just contains 'node_modules' as substring", () => {
    expect(vendorChunkFor("/repo/src/something/node_modules-helper.ts")).toBeUndefined();
  });
});
