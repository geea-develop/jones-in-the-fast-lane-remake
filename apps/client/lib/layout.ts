/**
 * Layout-selection predicate — the pure specification of the CSS media-query
 * cascade that drives the game's responsive layout.
 *
 * Why this exists: the actual layout switching is done entirely in CSS (see the
 * `Landscape_Mobile` media query in `globals.css`), so this function is *not*
 * wired into render. It exists as the single, verifiable source of truth for
 * the layout boundaries — it is the target of Property 1 in the design and lets
 * the thresholds be shared with (and kept in sync with) the media-query docs.
 *
 * The predicate mirrors the design's `selectLayout` exactly:
 *   - undefined dimension            → default (PortraitMobile)
 *   - vw >= DESKTOP_MIN_WIDTH         → Desktop           (regardless of orientation)
 *   - vw > vh && vh <= LANDSCAPE_MAX_HEIGHT → LandscapeMobile (landscape + short + sub-desktop)
 *   - otherwise                       → PortraitMobile
 */

/** The three layout states the UI can be in. */
export type LayoutState = "Desktop" | "LandscapeMobile" | "PortraitMobile";

/**
 * Maximum viewport height (combined with landscape orientation and sub-desktop
 * width) that triggers the `Landscape_Mobile` layout. Shared with the
 * `max-height: 600px` clause of the landscape media query in `globals.css`.
 */
export const LANDSCAPE_MAX_HEIGHT = 600;

/**
 * Minimum viewport width at which the Desktop layout applies, regardless of
 * orientation. Aligns with Tailwind's `xl` breakpoint (1280px); the landscape
 * media query guards with `max-width: 1279px` so the two meet exactly.
 */
export const DESKTOP_MIN_WIDTH = 1280;

/**
 * Selects the layout state for a given viewport.
 *
 * When either dimension is undefined (the browser cannot report
 * orientation/viewport size), the pre-existing default layout — `PortraitMobile`
 * — is returned and no error is surfaced (R1.5 / R4.5 fallback).
 *
 * @param vw viewport width in CSS pixels, or `undefined` if unknown
 * @param vh viewport height in CSS pixels, or `undefined` if unknown
 * @returns the layout state the UI should render
 */
export function selectLayout(vw?: number, vh?: number): LayoutState {
  if (vw === undefined || vh === undefined) {
    return "PortraitMobile"; // R1.5 / R4.5: default when dimensions are unknown
  }
  if (vw >= DESKTOP_MIN_WIDTH) {
    return "Desktop"; // R1.4 / R4.2: desktop regardless of orientation
  }
  if (vw > vh && vh <= LANDSCAPE_MAX_HEIGHT) {
    return "LandscapeMobile"; // R1.1: landscape + short + sub-desktop
  }
  return "PortraitMobile"; // R4.1
}
