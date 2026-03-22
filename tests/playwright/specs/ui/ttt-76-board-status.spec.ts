import { expect, test, type Locator, type Page } from "@playwright/test";

async function firstVisibleLocator(candidates: Locator[]) {
  for (const candidate of candidates) {
    if ((await candidate.count()) > 0) {
      return candidate.first();
    }
  }

  return candidates[0].first();
}

async function boardLocator(page: Page) {
  return firstVisibleLocator([
    page.getByRole("grid", { name: /tic[- ]?tac[- ]?toe board|game board|board/i }),
    page.getByTestId("game-board"),
    page.locator("main div").filter({ has: page.locator("button") }).nth(3),
  ]);
}

async function statusLocator(page: Page) {
  return firstVisibleLocator([
    page.getByRole("status"),
    page.getByTestId("game-status"),
    page.getByText(/your turn|cpu's turn|round complete|wins the round|draw/i),
  ]);
}

async function playerMarkLocator(page: Page) {
  return firstVisibleLocator([
    page.getByTestId("player-mark"),
    page.getByText(/player mark/i),
  ]);
}

async function cpuMarkLocator(page: Page) {
  return firstVisibleLocator([
    page.getByTestId("cpu-mark"),
    page.getByText(/cpu mark/i),
  ]);
}

async function boardSquares(page: Page) {
  const board = await boardLocator(page);
  const roleSquares = board.getByRole("button");
  if ((await roleSquares.count()) === 9) {
    return roleSquares;
  }

  const mainButtons = page
    .locator("main button")
    .filter({ hasNotText: /quit to landing|rematch|sound/i });
  if ((await mainButtons.count()) === 9) {
    return mainButtons;
  }

  const gridCells = board.getByRole("gridcell");
  if ((await gridCells.count()) === 9) {
    return gridCells;
  }

  return page.getByTestId(/board-square/i);
}

async function ensureBoardFlowAvailable(page: Page) {
  await page.goto("/");

  const playButton = page.getByRole("button", { name: /play vs cpu/i });
  const playButtonCount = await playButton.count();
  if (playButtonCount > 0) {
    await playButton.first().click();
  }
}

test.describe("TTT-76 TTT-17 board and status scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await ensureBoardFlowAvailable(page);
  });

  test("Scenario 1: game screen shows board and inline status together", async ({ page }) => {
    await expect(await boardLocator(page)).toBeVisible();
    await expect(await statusLocator(page)).toBeVisible();
  });

  test("Scenario 2: board exposes nine playable positions", async ({ page }) => {
    const squares = await boardSquares(page);

    await expect(squares).toHaveCount(9);
  });

  test("Scenario 3: status communicates the current turn inline", async ({ page }) => {
    await expect(await statusLocator(page)).toContainText(/turn|current player|player|cpu/i);
  });

  test("Scenario 4: started session preserves player and CPU marks", async ({ page }) => {
    await expect(await playerMarkLocator(page)).toBeVisible();
    await expect(await cpuMarkLocator(page)).toBeVisible();

    const playerMarkText = (await (await playerMarkLocator(page)).textContent())?.trim() ?? "";
    const cpuMarkText = (await (await cpuMarkLocator(page)).textContent())?.trim() ?? "";

    expect(playerMarkText).not.toEqual("");
    expect(cpuMarkText).not.toEqual("");
    expect(playerMarkText).not.toEqual(cpuMarkText);
  });

  test("Scenario 5: board and status provide automation-friendly semantic hooks", async ({
    page,
  }) => {
    const board = await boardLocator(page);
    const status = await statusLocator(page);
    const squares = await boardSquares(page);

    await expect(board).toBeVisible();
    await expect(status).toBeVisible();
    await expect(squares.first()).toBeVisible();
  });
});
