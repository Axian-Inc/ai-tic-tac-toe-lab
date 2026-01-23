import { test, expect } from "@playwright/test";

test("human win is detected and shown", async ({ page }) => {
  await page.goto("/game?cpu=off");

  const outcome = page.getByTestId("game-outcome");
  await expect(outcome).toHaveText("Game in progress.");

  await page.getByTestId("board-cell-0").click(); // X
  await page.getByTestId("board-cell-3").click(); // O
  await page.getByTestId("board-cell-1").click(); // X
  await page.getByTestId("board-cell-4").click(); // O
  await page.getByTestId("board-cell-2").click(); // X wins

  await expect(outcome).toContainText("wins");
  await expect(page.getByTestId("game-status")).toContainText("Status: over");

  const winningLine = [0, 1, 2];
  for (const index of winningLine) {
    const cell = page.getByTestId(`board-cell-${index}`);
    await expect(cell.locator(".cell-value")).toHaveText("X");
  }
});
