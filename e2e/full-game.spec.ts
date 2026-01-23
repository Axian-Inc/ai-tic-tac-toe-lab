import { test, expect } from "@playwright/test";

test("play a deterministic full game to completion", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("play-vs-cpu").click();

  const outcome = page.getByTestId("game-outcome");
  await expect(outcome).toHaveText("Game in progress.");

  const moves = [0, 2, 6];
  for (const index of moves) {
    const cell = page.getByTestId(`board-cell-${index}`);
    await expect(cell).toHaveAttribute("data-disabled", "false");
    await cell.click();
  }

  await expect(outcome).toContainText(/wins!|Draw game\./);
  await expect(page.getByTestId("game-status")).toContainText("Status: over");
});
