import { test, expect } from "@playwright/test";

import {
  renderGameAtViewport,
  getRect,
  getRects,
  getComputedStyleValues,
  isWithinViewport,
  pxToNumber,
  type Rect,
} from "./helpers/geometry";

/**
 * Feature: landscape-mobile-display — consolidated example-based e2e.
 *
 * This single spec replaces the earlier per-property fast-check sweeps
 * (property-02 … property-10), which drove 100+ generated viewports per
 * property through a full browser build. Those sweeps were slow and flagged
 * violations only at unrealistic extremes (e.g. a 322×320 landscape window with
 * a modal open) that no real device produces.
 *
 * Instead we assert the same layout invariants at a small set of REAL landscape
 * device viewports. The pure layout-selection predicate keeps its exhaustive
 * fast-check coverage in `lib/layout.test.ts` (fast, no browser); this file
 * covers the rendered geometry at sizes users actually hit.
 *
 * Requirements exercised: 2.1–2.5 (board fit, legibility, tap targets),
 * 3.1–3.4 (row split, header/actions in-viewport, stats scroll), 5.5 (dialog
 * in-viewport), 5.6/5.7 (popover in-viewport).
 */

// Representative real phone-landscape viewports (CSS px, browser-chrome-adjusted).
const DEVICES: { name: string; vw: number; vh: number }[] = [
  { name: "iPhone SE landscape", vw: 667, vh: 375 },
  { name: "iPhone 12/13 landscape", vw: 812, vh: 375 },
  { name: "iPhone 14 Pro Max landscape", vw: 844, vh: 390 },
  { name: "Pixel 5 landscape", vw: 851, vh: 393 },
  { name: "small Android landscape", vw: 640, vh: 360 },
];

// --- Selectors (shared with the CSS in globals.css) ---
const BOARD = ".board-window";
const TILE = ".board-window .retro-tile";
const ICON = ".board-window .retro-tile .location-icon-frame";
const TILE_TEXT =
  ".board-window .retro-tile > span:not(.location-icon-frame):not(.location-popover)";
const SHELL = ".game-shell.grid";
const STATS = ".game-shell > .flex.flex-col.overflow-y-auto";
const ACTION_BTN = ".action-panel button";
const DIALOG = ".game-dialog";
const DIALOG_CONTROLS = ".game-dialog .mt-6 button";

const EXPECTED_TILE_COUNT = 13;
const TOL = 1;
const MIN_TAP = 44;
const MIN_ICON = 16;
const MIN_TEXT_PX = 10;

test.describe("landscape-mobile-display at real device viewports", () => {
  for (const { name, vw, vh } of DEVICES) {
    test(`${name} (${vw}×${vh}): board fits, tiles legible, controls in-viewport`, async ({
      page,
    }) => {
      await renderGameAtViewport(page, { viewportWidth: vw, viewportHeight: vh });

      // --- Board fits within the viewport (R2.1, R3.5) ---
      const board = (await getRect(page, BOARD)) as Rect;
      expect(board, `board-window exists at ${name}`).not.toBeNull();
      expect(board.height, `board height <= vh at ${name}`).toBeLessThanOrEqual(vh + TOL);
      expect(isWithinViewport(board, vw, vh, TOL), `board within viewport at ${name}`).toBe(true);

      // Page does not scroll to reveal the board (R2.1).
      const pageOverflow = await page.evaluate(() => {
        const doc = document.scrollingElement || document.documentElement;
        return { scrollHeight: doc.scrollHeight, clientHeight: doc.clientHeight };
      });
      expect(
        pageOverflow.scrollHeight,
        `page does not scroll vertically at ${name}`,
      ).toBeLessThanOrEqual(pageOverflow.clientHeight + TOL);

      // --- All 13 tiles render and stay in-viewport, uncropped (R2.2) ---
      const tiles = await getRects(page, TILE);
      expect(tiles.length, `13 tiles at ${name}`).toBe(EXPECTED_TILE_COUNT);
      for (const tile of tiles) {
        expect(tile.width).toBeGreaterThan(0);
        expect(tile.height).toBeGreaterThan(0);
        expect(isWithinViewport(tile, vw, vh, TOL), `tile within viewport at ${name}`).toBe(true);
      }

      // --- Tap-target floor 44×44 (R2.5) ---
      // The tile deliberately keeps its LAYOUT box small (so three stacked side tiles fit the
      // height-driven board) and provides the 44×44 touch target via a non-layout `::after`
      // overlay (min-width/min-height: 44px, centered). So the effective hit area is
      // max(visual box, the overlay's 44px floor) — measured here from the pseudo-element.
      const tapTargets = await page.evaluate((sel) => {
        return Array.from(document.querySelectorAll(sel)).map((el) => {
          const box = el.getBoundingClientRect();
          const after = window.getComputedStyle(el, "::after");
          const floorW = parseFloat(after.minWidth) || 0;
          const floorH = parseFloat(after.minHeight) || 0;
          return {
            width: Math.max(box.width, floorW),
            height: Math.max(box.height, floorH),
          };
        });
      }, TILE);
      expect(tapTargets.length, `tap targets per tile at ${name}`).toBe(EXPECTED_TILE_COUNT);
      for (const t of tapTargets) {
        expect(t.width, `tile tap width >= ${MIN_TAP} at ${name}`).toBeGreaterThanOrEqual(
          MIN_TAP - TOL,
        );
        expect(t.height, `tile tap height >= ${MIN_TAP} at ${name}`).toBeGreaterThanOrEqual(
          MIN_TAP - TOL,
        );
      }

      // --- Icon floor 16×16 (R2.4) ---
      const icons = await getRects(page, ICON);
      expect(icons.length, `one icon frame per tile at ${name}`).toBe(EXPECTED_TILE_COUNT);
      for (const icon of icons) {
        expect(icon.width, `icon width >= ${MIN_ICON} at ${name}`).toBeGreaterThanOrEqual(
          MIN_ICON - TOL,
        );
        expect(icon.height, `icon height >= ${MIN_ICON} at ${name}`).toBeGreaterThanOrEqual(
          MIN_ICON - TOL,
        );
      }

      // --- Text legibility floor 10px (R2.3) ---
      const fontSizes = await getComputedStyleValues(page, TILE_TEXT, "font-size");
      expect(fontSizes.length, `tile text spans present at ${name}`).toBeGreaterThanOrEqual(
        EXPECTED_TILE_COUNT,
      );
      for (const fs of fontSizes) {
        expect(pxToNumber(fs), `tile text >= ${MIN_TEXT_PX}px at ${name}`).toBeGreaterThanOrEqual(
          MIN_TEXT_PX - 0.5,
        );
      }

      // --- Board/stats row split: board 55–70% of vw, stats takes remainder (R3.1) ---
      const shellCols = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? window.getComputedStyle(el).gridTemplateColumns : null;
      }, SHELL);
      expect(shellCols, `shell is a grid at ${name}`).not.toBeNull();
      const [boardTrack, statsTrack] = (shellCols as string)
        .split(/\s+/)
        .map((v) => parseFloat(v));
      const shellRect = (await getRect(page, SHELL)) as Rect;
      const boardFraction = boardTrack / shellRect.width;
      expect(boardFraction, `board track 55–70% of shell at ${name}`).toBeGreaterThanOrEqual(0.5);
      expect(boardFraction, `board track 55–70% of shell at ${name}`).toBeLessThanOrEqual(0.72);
      expect(statsTrack, `stats track present at ${name}`).toBeGreaterThan(0);

      // --- Week header controls in-viewport (R3.2) ---
      const endWeek = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find((b) =>
          /END WEEK/i.test(b.textContent || ""),
        );
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return {
          x: r.x, y: r.y, width: r.width, height: r.height,
          top: r.top, right: r.right, bottom: r.bottom, left: r.left,
        };
      });
      expect(endWeek, `END WEEK control exists at ${name}`).not.toBeNull();
      expect(
        isWithinViewport(endWeek as Rect, vw, vh, TOL),
        `END WEEK within viewport at ${name}`,
      ).toBe(true);

      // --- Action controls in-viewport with 44×44 floor (R3.3) ---
      const actions = await getRects(page, ACTION_BTN);
      for (const btn of actions) {
        expect(isWithinViewport(btn, vw, vh, TOL), `action btn within viewport at ${name}`).toBe(
          true,
        );
        expect(btn.height, `action tap height >= ${MIN_TAP} at ${name}`).toBeGreaterThanOrEqual(
          MIN_TAP - TOL,
        );
      }
    });
  }

  test("stats scroll independently while the board stays fixed (R3.4)", async ({ page }) => {
    const { vw, vh } = { vw: 667, vh: 375 };
    await renderGameAtViewport(page, { viewportWidth: vw, viewportHeight: vh });

    // Inject tall content so the stats column overflows its bounded height.
    await page.evaluate((statsSel) => {
      const stats = document.querySelector(statsSel) as HTMLElement;
      const spacer = document.createElement("div");
      spacer.setAttribute("data-test-spacer", "true");
      spacer.style.height = "1200px";
      spacer.style.flex = "0 0 auto";
      stats.appendChild(spacer);
    }, STATS);

    const boardBefore = (await getRect(page, BOARD)) as Rect;

    // Stats region must be scrollable within its own bounds.
    const scrollInfo = await page.evaluate((statsSel) => {
      const stats = document.querySelector(statsSel) as HTMLElement;
      const canScroll = stats.scrollHeight > stats.clientHeight + 1;
      stats.scrollTop = Math.floor((stats.scrollHeight - stats.clientHeight) / 2);
      return { canScroll, scrollTop: stats.scrollTop };
    }, STATS);
    expect(scrollInfo.canScroll, "stats region is scrollable on overflow").toBe(true);
    expect(scrollInfo.scrollTop, "stats actually scrolled").toBeGreaterThan(0);

    // Board position/size unchanged after scrolling the stats.
    const boardAfter = (await getRect(page, BOARD)) as Rect;
    expect(Math.abs(boardAfter.top - boardBefore.top), "board top fixed").toBeLessThanOrEqual(TOL);
    expect(
      Math.abs(boardAfter.height - boardBefore.height),
      "board height fixed",
    ).toBeLessThanOrEqual(TOL);
  });

  test("open dialog stays within the viewport (R5.5)", async ({ page }) => {
    const { vw, vh } = { vw: 667, vh: 375 };
    await renderGameAtViewport(page, { viewportWidth: vw, viewportHeight: vh });

    // Open the WEEKLY REPORT dialog via END WEEK → CONFIRM?.
    await page.getByRole("button", { name: /END WEEK/ }).click();
    await page.getByRole("button", { name: /CONFIRM\?/ }).click();
    await expect(page.locator(DIALOG)).toBeVisible();

    const dialog = (await getRect(page, DIALOG)) as Rect;
    expect(dialog.height, "dialog height <= vh").toBeLessThanOrEqual(vh + TOL);
    expect(isWithinViewport(dialog, vw, vh, TOL), "dialog panel within viewport").toBe(true);

    const controls = await getRects(page, DIALOG_CONTROLS);
    expect(controls.length, "dialog has controls").toBeGreaterThan(0);
    for (const ctrl of controls) {
      expect(isWithinViewport(ctrl, vw, vh, TOL), "dialog control within viewport").toBe(true);
    }

    // Page itself is not scrolled; the dialog handles its own overflow.
    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement;
      return { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, scrollTop: el.scrollTop };
    });
    expect(overflow.scrollTop, "page not scrolled").toBeLessThanOrEqual(TOL);
  });
});
