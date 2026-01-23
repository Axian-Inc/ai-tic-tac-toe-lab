import { test, expect } from "@playwright/test";

// Stable selectors used in this suite:
// - [data-testid="play-vs-cpu"]
// - [data-testid="game-status"]
// - [data-testid="game-turn"]
// - [data-testid="game-outcome"]
// - [data-testid="game-loss-message"]
// - [data-testid="game-board"]
// - [data-testid="board-cell-<index>"]
// - [data-testid="rematch"]
// - [data-testid="quit"]

test("play a short game and rematch", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("play-vs-cpu").click();

  await expect(page.getByTestId("game-status")).toBeVisible();

  await page.getByTestId("board-cell-0").click();
  await page.getByTestId("board-cell-2").click();
  await page.getByTestId("board-cell-6").click();

  await expect(page.getByTestId("game-outcome")).toContainText("wins");

  await page.getByTestId("rematch").click();
  await expect(page.getByTestId("game-outcome")).toHaveText("Game in progress.");
});
