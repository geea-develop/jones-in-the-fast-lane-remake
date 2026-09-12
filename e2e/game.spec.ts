import { expect, test } from "@playwright/test";

test.describe("Jones in the Fast Lane", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
  });

  test("starts a game and renders the board and HUD", async ({ page }) => {
    await page.getByPlaceholder("Your name").fill("E2E Player");
    await page.getByRole("button", { name: /START GAME/ }).click();

    await expect(page.getByText(/^GOALS$/)).toBeVisible();
    await expect(page.getByText(/^VITALS$/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "JONES" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Home/ })).toContainText("HERE");
  });

  test("requires confirmation before performing a location action", async ({ page }) => {
    await page.getByRole("button", { name: /START GAME/ }).click();

    // Rest is disabled at full energy on a fresh game, so travel to Z-Mart and
    // buy food (food starts below max, so the action is enabled).
    await page.getByRole("button", { name: /Z-Mart/ }).click();
    await page.getByRole("button", { name: "Buy Food ($15) action" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("BUY FOOD");
    await expect(dialog).toContainText("TIME");
    await expect(dialog).toContainText("CASH");

    await dialog.getByRole("button", { name: "DO IT" }).click();
    await expect(dialog).toBeHidden();
  });

  test("moves to another location and marks it as current", async ({ page }) => {
    await page.getByRole("button", { name: /START GAME/ }).click();

    const pawnShop = page.getByRole("button", { name: /Pawn Shop/ });
    await expect(pawnShop).toBeEnabled();
    await pawnShop.click();
    await expect(pawnShop).toContainText("HERE");
  });

  test("keeps an edge location popover visible outside the board window", async ({ page }) => {
    await page.getByRole("button", { name: /START GAME/ }).click();

    const bank = page.getByRole("button", { name: /Bank/ });
    await bank.hover();
    const popover = bank.locator(".location-popover");
    await expect(popover).toBeVisible();

    const board = page.locator(".board-window");
    const [popoverBox, boardBox] = await Promise.all([popover.boundingBox(), board.boundingBox()]);
    expect(popoverBox).not.toBeNull();
    expect(boardBox).not.toBeNull();
    expect(popoverBox!.y + popoverBox!.height).toBeGreaterThan(boardBox!.y + boardBox!.height);
  });

  test("opens the Black's Market popover inward from the left rail", async ({ page }) => {
    await page.getByRole("button", { name: /START GAME/ }).click();

    const market = page.getByRole("button", { name: /Black's Market/ });
    await market.hover();
    const popover = market.locator(".location-popover");
    await expect(popover).toBeVisible();

    const [popoverBox, marketBox] = await Promise.all([popover.boundingBox(), market.boundingBox()]);
    expect(popoverBox).not.toBeNull();
    expect(marketBox).not.toBeNull();
    expect(popoverBox!.x).toBeGreaterThanOrEqual(marketBox!.x);
    expect(popoverBox!.y + popoverBox!.height).toBeLessThanOrEqual(marketBox!.y + 1);
  });

  test("shows the weekly report after the end-week confirmation", async ({ page }) => {
    await page.getByRole("button", { name: /START GAME/ }).click();

    const endWeek = page.getByRole("button", { name: /END WEEK/ });
    await endWeek.click();
    await expect(page.getByRole("button", { name: "CONFIRM?" })).toBeVisible();
    await page.getByRole("button", { name: "CONFIRM?" }).click();

    await expect(page.getByRole("dialog")).toContainText("WEEKLY REPORT");
  });

  test("prevents starting a game when no goals are selected", async ({ page }) => {
    const start = page.getByRole("button", { name: /START GAME/ });
    for (const goal of ["money", "education", "career", "happiness"]) {
      await page.getByRole("checkbox", { name: new RegExp(goal, "i") }).uncheck();
    }
    await expect(start).toBeDisabled();
  });
});

test.describe("Game Over Flow", () => {
  test("displays the win screen when the player reaches all goals", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();

    // Start a game
    await page.getByPlaceholder("Your name").fill("Winner");
    await page.getByRole("button", { name: /START GAME/ }).click();
    await expect(page.getByText(/^GOALS$/)).toBeVisible();

    // Intercept end-week response to return a "won" game state
    await page.route("**/api/game/*/end-week", async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.game.status = "won";
      json.game.player.money = 999;
      json.game.player.education = 100;
      json.game.player.career = 100;
      json.game.player.happiness = 100;
      json.events = [
        ...json.events,
        { type: "game_over", message: "🎉 You reached all your goals! You win!" },
      ];
      await route.fulfill({ json });
    });

    // Trigger end week to get "won" state
    const endWeek = page.getByRole("button", { name: /END WEEK/ });
    await endWeek.click();
    await page.getByRole("button", { name: "CONFIRM?" }).click();

    // Game-over screen replaces the board directly (status !== "in_progress")
    await expect(page.getByText("YOU WIN!")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("You reached all your goals before Jones!")).toBeVisible();
    await expect(page.getByRole("img", { name: "Player" }).first()).toBeVisible();
    await expect(page.getByRole("img", { name: "Jones" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /PLAY AGAIN/ })).toBeVisible();
  });

  test("displays the game-over screen when Jones wins", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();

    await page.getByPlaceholder("Your name").fill("Loser");
    await page.getByRole("button", { name: /START GAME/ }).click();
    await expect(page.getByText(/^GOALS$/)).toBeVisible();

    // Intercept end-week response to return a "lost" game state
    await page.route("**/api/game/*/end-week", async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.game.status = "lost";
      json.game.aiJones.money = 999;
      json.game.aiJones.education = 100;
      json.game.aiJones.career = 100;
      json.game.aiJones.happiness = 100;
      json.events = [
        ...json.events,
        { type: "game_over", message: "😞 Jones reached all goals before you! Game over." },
      ];
      await route.fulfill({ json });
    });

    const endWeek = page.getByRole("button", { name: /END WEEK/ });
    await endWeek.click();
    await page.getByRole("button", { name: "CONFIRM?" }).click();

    // Game-over screen replaces the board directly
    await expect(page.getByText("GAME OVER")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Jones beat you to the finish line.")).toBeVisible();
    await expect(page.getByRole("button", { name: /PLAY AGAIN/ })).toBeVisible();
  });

  test("Play Again resets to the start screen", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();

    await page.getByRole("button", { name: /START GAME/ }).click();
    await expect(page.getByText(/^GOALS$/)).toBeVisible();

    // Force win
    await page.route("**/api/game/*/end-week", async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.game.status = "won";
      json.events = [{ type: "game_over", message: "🎉 You reached all your goals! You win!" }];
      await route.fulfill({ json });
    });

    await page.getByRole("button", { name: /END WEEK/ }).click();
    await page.getByRole("button", { name: "CONFIRM?" }).click();

    await expect(page.getByRole("button", { name: /PLAY AGAIN/ })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /PLAY AGAIN/ }).click();

    // Should be back at start screen
    await expect(page.getByPlaceholder("Your name")).toBeVisible();
    await expect(page.getByRole("button", { name: /START GAME/ })).toBeVisible();
  });
});

test.describe("Resume Flow", () => {
  test("auto-resumes a game after page reload", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();

    // Start a game
    await page.getByPlaceholder("Your name").fill("Persistent");
    await page.getByRole("button", { name: /START GAME/ }).click();
    await expect(page.getByText(/^GOALS$/)).toBeVisible();

    // Wait for sessionStorage to be set (happens after API response)
    await page.waitForFunction(() => sessionStorage.getItem("jones_game_id") !== null);

    // Reload the page — should auto-resume from sessionStorage
    await page.reload();

    // Should still be in the game board (not the start screen)
    await expect(page.getByText(/^GOALS$/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /END WEEK/ })).toBeVisible();
    await expect(page.getByPlaceholder("Your name")).not.toBeVisible();
  });

  test("manual resume with game ID works", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();

    // Start a game and capture its ID
    await page.getByPlaceholder("Your name").fill("Resume Test");
    await page.getByRole("button", { name: /START GAME/ }).click();
    await expect(page.getByText(/^GOALS$/)).toBeVisible();

    // Wait for sessionStorage to be set
    await page.waitForFunction(() => sessionStorage.getItem("jones_game_id") !== null);
    const gameId = await page.evaluate(() => sessionStorage.getItem("jones_game_id"));
    expect(gameId).toBeTruthy();

    // Clear session and go back to start
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await expect(page.getByPlaceholder("Your name")).toBeVisible();

    // Enter the game ID and resume
    await page.getByPlaceholder(/Game ID/i).fill(gameId!);
    await page.getByRole("button", { name: /RESUME/ }).click();

    // Should be back in game
    await expect(page.getByText(/^GOALS$/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /END WEEK/ })).toBeVisible();
  });

  test("resume with invalid ID shows error toast", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();

    await page.getByPlaceholder(/Game ID/i).fill("nonexistent-id-12345");
    await page.getByRole("button", { name: /RESUME/ }).click();

    // Should show error toast (text: "Game not found") and stay on start screen
    await expect(page.getByText(/Game not found/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder("Your name")).toBeVisible();
  });
});

test.describe("Duplicate Click Protection", () => {
  test("rapid move clicks only trigger one API call", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();

    await page.getByRole("button", { name: /START GAME/ }).click();
    await expect(page.getByText(/^GOALS$/)).toBeVisible();

    // Track move API calls
    let moveCallCount = 0;
    await page.route("**/api/game/*/move", async (route) => {
      moveCallCount++;
      // Add a small delay to simulate network latency
      await new Promise((r) => setTimeout(r, 200));
      const response = await route.fetch();
      const json = await response.json();
      await route.fulfill({ json });
    });

    // Rapidly click a location multiple times
    const pawnShop = page.getByRole("button", { name: /Pawn Shop/ });
    await Promise.all([
      pawnShop.click(),
      pawnShop.click({ delay: 10 }),
      pawnShop.click({ delay: 20 }),
    ]);

    // Wait for the action to complete
    await expect(pawnShop).toContainText("HERE", { timeout: 5000 });

    // Only one API call should have been made
    expect(moveCallCount).toBe(1);
  });

  test("rapid end-week confirmation does not trigger multiple API calls", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();

    await page.getByRole("button", { name: /START GAME/ }).click();
    await expect(page.getByText(/^GOALS$/)).toBeVisible();

    // Track end-week API calls
    let endWeekCallCount = 0;
    await page.route("**/api/game/*/end-week", async (route) => {
      endWeekCallCount++;
      await new Promise((r) => setTimeout(r, 300));
      const response = await route.fetch();
      const json = await response.json();
      await route.fulfill({ json });
    });

    // First click shows "CONFIRM?", second click triggers the actual end-week
    await page.getByRole("button", { name: /END WEEK/ }).click();
    const confirmBtn = page.getByRole("button", { name: "CONFIRM?" });
    await expect(confirmBtn).toBeVisible();

    // Click confirm — button should become disabled during submission
    await confirmBtn.click();

    // Wait for the weekly report to appear (proves the call completed)
    await expect(page.getByText("WEEKLY REPORT")).toBeVisible({ timeout: 10000 });

    // Only one API call should have been made
    expect(endWeekCallCount).toBe(1);
  });
});
