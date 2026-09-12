import { expect, type Page } from "@playwright/test";

/**
 * Geometry test helper for the landscape-mobile-display feature.
 *
 * Property-based tests (fast-check) generate `(viewportWidth, viewportHeight)`
 * pairs and drive Playwright through this helper to render the running game at
 * that viewport and read computed layout geometry. Reads go through the browser
 * primitives the design calls for: `getBoundingClientRect` (box geometry) and
 * `getComputedStyle` (resolved CSS values such as font size).
 *
 * The helper starts an *offline* game so rendering is fully deterministic and
 * needs no backend server — the board, actions, and stats all render locally.
 */

/** A plain, serializable rectangle mirroring `DOMRect`'s numeric fields. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Viewport {
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * Render the game at the given viewport and wait until the in-progress board
 * is visible. Starts a fresh offline game so no server is required.
 *
 * Returns the same `page` for fluent use in tests.
 */
export async function renderGameAtViewport(
  page: Page,
  { viewportWidth, viewportHeight }: Viewport,
): Promise<Page> {
  await page.setViewportSize({ width: viewportWidth, height: viewportHeight });

  await page.goto("/");
  // Start from a clean slate so we always land on the start screen.
  await page.evaluate(() => {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {
      /* storage may be unavailable; ignore */
    }
  });
  await page.reload();

  // Offline mode keeps the whole game local — deterministic and server-free.
  await page.getByRole("button", { name: /Offline/ }).click();
  await page.getByRole("button", { name: /START GAME/ }).click();

  // The in-progress board is up once the HUD renders.
  await expect(page.getByText(/^GOALS$/)).toBeVisible();

  return page;
}

/** Read the bounding-client rect of the first element matching `selector`. */
export async function getRect(page: Page, selector: string): Promise<Rect | null> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      top: r.top,
      right: r.right,
      bottom: r.bottom,
      left: r.left,
    };
  }, selector);
}

/** Read bounding-client rects for every element matching `selector`. */
export async function getRects(page: Page, selector: string): Promise<Rect[]> {
  return page.evaluate((sel) => {
    return Array.from(document.querySelectorAll(sel)).map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        left: r.left,
      };
    });
  }, selector);
}

/**
 * Read a single resolved CSS property (via `getComputedStyle`) for the first
 * element matching `selector`. Returns `null` if the element is absent.
 */
export async function getComputedStyleValue(
  page: Page,
  selector: string,
  property: string,
): Promise<string | null> {
  return page.evaluate(
    ({ sel, prop }) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      return window.getComputedStyle(el).getPropertyValue(prop);
    },
    { sel: selector, prop: property },
  );
}

/**
 * Read a resolved CSS property for every element matching `selector`.
 */
export async function getComputedStyleValues(
  page: Page,
  selector: string,
  property: string,
): Promise<string[]> {
  return page.evaluate(
    ({ sel, prop }) => {
      return Array.from(document.querySelectorAll(sel)).map((el) =>
        window.getComputedStyle(el).getPropertyValue(prop),
      );
    },
    { sel: selector, prop: property },
  );
}

/** Parse a computed pixel value (e.g. "13.5px") into a number. */
export function pxToNumber(value: string | null): number {
  if (!value) return NaN;
  return parseFloat(value);
}

/** True when `rect` lies fully inside the `[0, vw] × [0, vh]` viewport box. */
export function isWithinViewport(rect: Rect, vw: number, vh: number, tolerance = 0.5): boolean {
  return (
    rect.left >= -tolerance &&
    rect.top >= -tolerance &&
    rect.right <= vw + tolerance &&
    rect.bottom <= vh + tolerance
  );
}
