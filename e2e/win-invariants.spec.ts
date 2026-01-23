import { test, expect } from "@playwright/test";

test("win locks board and rematch resets", async ({ page }) => {
  await page.goto("/game?cpu=off");

  await page.getByTestId("board-cell-0").click(); // X
  await page.getByTestId("board-cell-3").click(); // O
  await page.getByTestId("board-cell-1").click(); // X
  await page.getByTestId("board-cell-4").click(); // O
  await page.getByTestId("board-cell-2").click(); // X wins

  const outcome = page.getByTestId("game-outcome");
  await expect(outcome).toContainText("wins");
  await expect(page.getByTestId("game-status")).toContainText("Status: over");

  const before = await page.locator(".cell-value").allTextContents();
  await page.getByTestId("board-cell-8").click({ force: true });
  const after = await page.locator(".cell-value").allTextContents();
  expect(after).toEqual(before);

  await expect(outcome).toContainText("wins");
  await expect(page.getByTestId("game-status")).toContainText("Status: over");

  await page.getByTestId("rematch").click();
  await expect(outcome).toHaveText("Game in progress.");

  const rematchCells = await page.locator(".cell-value").allTextContents();
  expect(rematchCells.every((value) => value.trim() === "")).toBeTruthy();
});
