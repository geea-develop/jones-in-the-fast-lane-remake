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

    await page.getByRole("button", { name: "Rest action" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("REST");
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
