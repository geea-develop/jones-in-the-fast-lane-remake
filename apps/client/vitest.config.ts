import { defineConfig } from "vitest/config";

/**
 * Vitest config for the client's unit / pure-function tests
 * (e.g. the `selectLayout` predicate and other non-browser logic).
 *
 * Browser-driven geometry tests run under Playwright (`playwright.config.ts`)
 * and live in `tests/e2e`, so they are excluded here.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "tests/unit/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**", "out/**", ".next/**"],
    // Single run, no watch — the `test:unit` script uses `vitest run`.
    watch: false,
  },
});
