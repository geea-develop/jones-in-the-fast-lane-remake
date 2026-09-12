import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the client's landscape-mobile-display geometry e2e tests.
 *
 * There are intentionally TWO Playwright configs in this repo, with disjoint
 * `testDir`s so they never collide:
 *   - repo-root `playwright.config.ts` (testDir `./e2e`): whole-app gameplay
 *     e2e driven against the live dev servers (client :3000 + server :3001).
 *   - THIS config (testDir `./tests/e2e`): landscape layout geometry, served
 *     from the *built* static export (`out/`) via `scripts/serve-out.mjs` so the
 *     assertions measure production-built CSS/markup.
 *
 * This config is always invoked from the `apps/client` package (via its
 * `test:e2e` script), so `--config=playwright.config.ts` unambiguously resolves
 * to this file, not the repo-root one.
 *
 * `renderGameAtViewport` in `tests/e2e/helpers/geometry.ts` renders the game at
 * a given `(viewportWidth, viewportHeight)` and reads geometry via
 * `getBoundingClientRect` / `getComputedStyle`. The single `landscape-mobile.spec.ts`
 * asserts the layout invariants at a set of real phone-landscape device sizes.
 */

const HOST = "127.0.0.1";
const PORT = Number(process.env.PLAYWRIGHT_PORT || 4321);
const BASE_URL = `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    // Build the static export, then serve it with the dependency-free static server.
    command: "npm run build && npm run serve:out",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      HOST,
      PORT: String(PORT),
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
