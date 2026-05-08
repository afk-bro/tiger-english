import { describe, it, expect, beforeEach } from "vitest";
import { hasUnitBeenCelebrated, markUnitAsCelebrated } from "../unitCelebration";

describe("unitCelebration", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns false for an un-celebrated unit", () => {
    expect(hasUnitBeenCelebrated("unit-2")).toBe(false);
  });

  it("returns true after markUnitAsCelebrated", () => {
    markUnitAsCelebrated("unit-2");
    expect(hasUnitBeenCelebrated("unit-2")).toBe(true);
  });

  it("scopes celebration state per unit slug", () => {
    markUnitAsCelebrated("unit-2");
    expect(hasUnitBeenCelebrated("unit-2")).toBe(true);
    expect(hasUnitBeenCelebrated("unit-3")).toBe(false);
  });

  it("idempotent: marking twice is the same as once", () => {
    markUnitAsCelebrated("unit-2");
    markUnitAsCelebrated("unit-2");
    expect(hasUnitBeenCelebrated("unit-2")).toBe(true);
  });
});
