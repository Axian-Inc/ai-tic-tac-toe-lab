import { expect, test } from "@playwright/test";

test("player can start a game and place the opening move", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("landing-page")).toBeVisible();
  await page.getByTestId("start-game-button").click();

  await expect(page).toHaveURL(/\/game$/);
  await expect(page.getByTestId("gameplay-page")).toBeVisible();
  await expect(page.getByTestId("game-status")).toContainText("Your turn");

  const openingCell = page.getByTestId("board-cell-0");
  await openingCell.click();

  await expect(openingCell).toContainText("X");
  await expect(page.getByTestId("board-cell-4")).toContainText("O");
});
