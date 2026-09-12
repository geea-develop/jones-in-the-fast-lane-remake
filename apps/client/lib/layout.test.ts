import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { selectLayout, LANDSCAPE_MAX_HEIGHT, DESKTOP_MIN_WIDTH } from "./layout";

/**
 * Property-based tests for the layout-selection predicate (Task 1.4).
 *
 * Feature: landscape-mobile-display, Property 1: Layout selection is correct for every viewport
 *
 * Validates: Requirements 1.1, 1.4, 1.5, 4.5
 *
 * The predicate (design.md "Data Models"):
 *   - undefined vw OR vh                         → "PortraitMobile" (default)
 *   - vw >= DESKTOP_MIN_WIDTH (1280)             → "Desktop"        (regardless of orientation)
 *   - vw > vh && vh <= LANDSCAPE_MAX_HEIGHT (600) → "LandscapeMobile"
 *   - otherwise                                   → "PortraitMobile"
 *
 * These are pure-function tests over the full (vw, vh) plane — no browser. The
 * geometric/DOM properties (2-10) are covered by the Playwright property tests.
 */

// Confirm the thresholds the predicate is specified against, so the tests below
// document the constants they exercise.
describe("layout thresholds", () => {
  it("uses the design-specified threshold constants", () => {
    expect(LANDSCAPE_MAX_HEIGHT).toBe(600);
    expect(DESKTOP_MIN_WIDTH).toBe(1280);
  });
});

// The reference specification, expressed independently of the implementation so
// the biconditional is asserted against an explicit oracle.
function expectedLayout(vw: number, vh: number): string {
  if (vw >= DESKTOP_MIN_WIDTH) return "Desktop";
  if (vw > vh && vh <= LANDSCAPE_MAX_HEIGHT) return "LandscapeMobile";
  return "PortraitMobile";
}

describe("selectLayout — Property 1: layout selection is correct for every viewport", () => {
  const NUM_RUNS = 200;

  // Sub-property 1: LandscapeMobile IFF (vw > vh && vh <= 600 && vw < 1280),
  // asserted as a biconditional across the full plane against the oracle.
  it("matches the reference predicate across the full (vw, vh) plane", () => {
    fc.assert(
      fc.property(
        // Range spans well below and above both thresholds, plus tiny/large values.
        fc.integer({ min: 0, max: 3000 }),
        fc.integer({ min: 0, max: 3000 }),
        (vw, vh) => {
          const result = selectLayout(vw, vh);
          expect(result).toBe(expectedLayout(vw, vh));

          // Explicit biconditional for LandscapeMobile.
          const isLandscape = vw > vh && vh <= LANDSCAPE_MAX_HEIGHT && vw < DESKTOP_MIN_WIDTH;
          expect(result === "LandscapeMobile").toBe(isLandscape);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  // Sub-property 2: vw >= 1280 → Desktop regardless of orientation (any vh).
  it("returns Desktop whenever vw >= 1280, regardless of orientation", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: DESKTOP_MIN_WIDTH, max: 8000 }),
        fc.integer({ min: 0, max: 8000 }),
        (vw, vh) => {
          expect(selectLayout(vw, vh)).toBe("Desktop");
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  // Sub-property 3: undefined dimension → "PortraitMobile" (the default).
  it("returns PortraitMobile for undefined dimensions (fixed cases)", () => {
    expect(selectLayout(undefined, undefined)).toBe("PortraitMobile");
    expect(selectLayout(undefined, 400)).toBe("PortraitMobile");
    expect(selectLayout(800, undefined)).toBe("PortraitMobile");
  });

  it("returns PortraitMobile whenever either dimension is undefined", () => {
    const maybeInt = fc.option(fc.integer({ min: 0, max: 3000 }), { nil: undefined });
    fc.assert(
      fc.property(maybeInt, maybeInt, (vw, vh) => {
        if (vw === undefined || vh === undefined) {
          expect(selectLayout(vw, vh)).toBe("PortraitMobile");
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  // Sub-property 4: equal dimensions (vw === vh) → PortraitMobile when < 1280,
  // since `vw > vh` is false. At/above 1280 it is Desktop.
  it("returns PortraitMobile for equal dimensions below the desktop width", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: DESKTOP_MIN_WIDTH - 1 }), (n) => {
        expect(selectLayout(n, n)).toBe("PortraitMobile");
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("returns Desktop for equal dimensions at or above the desktop width", () => {
    fc.assert(
      fc.property(fc.integer({ min: DESKTOP_MIN_WIDTH, max: 8000 }), (n) => {
        expect(selectLayout(n, n)).toBe("Desktop");
      }),
      { numRuns: NUM_RUNS },
    );
  });

  // Targeted generator over the landscape region proper: vh in [240, 600],
  // vw in (vh, 1279] so vw > vh holds — every draw must be LandscapeMobile.
  it("returns LandscapeMobile across the full landscape region", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 240, max: LANDSCAPE_MAX_HEIGHT }),
        fc.integer({ min: 1, max: DESKTOP_MIN_WIDTH - 1 }),
        (vh, extra) => {
          const vw = Math.min(vh + extra, DESKTOP_MIN_WIDTH - 1);
          // Only meaningful when vw actually exceeds vh (landscape).
          fc.pre(vw > vh);
          expect(selectLayout(vw, vh)).toBe("LandscapeMobile");
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  // Boundary checks: exactly at the thresholds.
  it("handles threshold boundaries exactly", () => {
    // vh exactly at the landscape ceiling with vw > vh and vw < 1280 → LandscapeMobile
    expect(selectLayout(1000, LANDSCAPE_MAX_HEIGHT)).toBe("LandscapeMobile");
    // vh one past the ceiling → PortraitMobile
    expect(selectLayout(1000, LANDSCAPE_MAX_HEIGHT + 1)).toBe("PortraitMobile");
    // vw exactly at the desktop min → Desktop even if short/landscape
    expect(selectLayout(DESKTOP_MIN_WIDTH, 500)).toBe("Desktop");
    // vw one below desktop min, landscape + short → LandscapeMobile
    expect(selectLayout(DESKTOP_MIN_WIDTH - 1, 500)).toBe("LandscapeMobile");
  });
});
