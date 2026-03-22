import { expect, test, type Locator, type Page } from "@playwright/test";

type OptionLabel = "X" | "O" | "Random";

async function firstVisibleLocator(candidates: Locator[]) {
  for (const candidate of candidates) {
    if ((await candidate.count()) > 0) {
      return candidate.first();
    }
  }

  return candidates[0].first();
}

async function boardLocator(page: Page) {
  const mainButtons = page
    .locator("main button")
    .filter({ hasNotText: /quit to landing|rematch|sound/i });

  if ((await mainButtons.count()) === 9) {
    return mainButtons.first().locator('xpath=ancestor::div[contains(@class, "grid")][1]');
  }

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

async function moveHistoryLocator(page: Page) {
  return firstVisibleLocator([
    page.getByTestId("move-history"),
    page.getByRole("list", { name: /move history|history/i }),
    page.getByRole("log", { name: /move history|history/i }),
  ]);
}

async function errorLocator(page: Page) {
  return firstVisibleLocator([
    page.getByRole("alert"),
    page.getByTestId("move-error"),
    page.getByText(/occupied|not[- ]turn|illegal/i),
  ]);
}

async function resetButtonLocator(page: Page) {
  return firstVisibleLocator([
    page.getByRole("button", { name: /reset|new game|rematch/i }),
    page.getByTestId("reset-game"),
  ]);
}

async function unavailableSquareLocator(page: Page) {
  return firstVisibleLocator([
    page.getByTestId("board-square-unavailable"),
    page.locator('[data-state="unavailable"]'),
    page.locator("main button[disabled]").filter({ hasNotText: /quit to landing|rematch|sound|[XO]/i }),
    page.locator('[aria-disabled="true"]').filter({ hasNotText: /[XO]/i }),
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

async function resolveOptionLocator(page: Page, label: OptionLabel) {
  const exact =
    label === "X"
      ? /play as x/i
      : label === "O"
        ? /play as o/i
        : /random draw|random/i;
  const radio = page.getByRole("radio", { name: exact });
  if ((await radio.count()) > 0) {
    return radio.first();
  }

  const button = page.getByRole("button", { name: exact });
  if ((await button.count()) > 0) {
    return button.first();
  }

  return null;
}

async function ensureGameFlowAvailable(page: Page) {
  await page.goto("/");

  const playButton = page.getByRole("button", { name: /play vs cpu|play/i });
  if ((await playButton.count()) > 0) {
    const xOption = await resolveOptionLocator(page, "X");
    if (xOption) {
      await xOption.click();
    }
    await playButton.first().click();
  }
}

async function countMarkedSquares(squares: Locator) {
  const total = await squares.count();
  let marked = 0;

  for (let i = 0; i < total; i += 1) {
    const square = squares.nth(i);
    const text = (await square.textContent())?.trim() ?? "";
    const ariaLabel = (await square.getAttribute("aria-label"))?.trim() ?? "";
    if (/[xo]/i.test(text) || /\b[xo]\b/i.test(ariaLabel)) {
      marked += 1;
    }
  }

  return marked;
}

test.describe("TTT-78 TTT-20 game module UI scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await ensureGameFlowAvailable(page);
  });

  test("Scenario 1: game initializes with empty board and starting turn", async ({ page }) => {
    const squares = await boardSquares(page);
    await expect(squares).toHaveCount(9);

    const markedCount = await countMarkedSquares(squares);
    expect(markedCount).toBe(0);

    const status = await statusLocator(page);
    await expect(status).toBeVisible();
    await expect(status).toContainText(/turn|current|player|cpu/i);
  });

  test("Scenario 2: valid move updates board and turn", async ({ page }) => {
    const squares = await boardSquares(page);
    const beforeBoardText = (await (await boardLocator(page)).textContent()) ?? "";
    const status = await statusLocator(page);
    const beforeStatus = ((await status.textContent()) ?? "").toLowerCase();

    await squares.first().click();

    const markedCount = await countMarkedSquares(squares);
    expect(markedCount).toBeGreaterThanOrEqual(1);
    await expect(await boardLocator(page)).not.toHaveText(beforeBoardText);

    const afterStatus = ((await status.textContent()) ?? "").toLowerCase();
    expect(afterStatus).not.toEqual(beforeStatus);
    expect(afterStatus).toMatch(/turn|current|player|cpu/);
  });

  test("Scenario 3: occupied square is rejected", async ({ page }) => {
    const squares = await boardSquares(page);
    await squares.first().click();

    await expect(await statusLocator(page)).toContainText(/your turn|live again|choose a highlighted square/i);

    const beforeBoardText = (await (await boardLocator(page)).textContent()) ?? "";
    const beforeMarkedCount = await countMarkedSquares(squares);

    await squares.first().click({ force: true });

    await expect(await boardLocator(page)).toHaveText(beforeBoardText);
    expect(await countMarkedSquares(squares)).toBe(beforeMarkedCount);

    const error = await errorLocator(page);
    if ((await error.count()) > 0) {
      await expect(error).toContainText(/occupied|illegal/i);
    }
  });

  test("Scenario 4: non-player turn rejects move", async ({ page }) => {
    const squares = await boardSquares(page);
    await squares.first().click();

    await expect(await statusLocator(page)).toContainText(/cpu/i);

    const unavailableSquare = await unavailableSquareLocator(page);
    await expect(unavailableSquare).toBeDisabled();

    const beforeBoardText = (await (await boardLocator(page)).textContent()) ?? "";
    const beforeStatus = (await (await statusLocator(page)).textContent()) ?? "";

    await unavailableSquare.click({ force: true });

    await expect(await boardLocator(page)).toHaveText(beforeBoardText);

    const error = await errorLocator(page);
    if ((await error.count()) > 0) {
      await expect(error).toContainText(/not[- ]turn|turn|illegal/i);
      return;
    }

    await expect(await statusLocator(page)).not.toHaveText(beforeStatus);
    await expect(await statusLocator(page)).toContainText(/not[- ]turn|turn|illegal|rejected/i);
  });

  test("Scenario 5: win/draw detection and reset", async ({ page }) => {
    const squares = await boardSquares(page);

    for (const index of [0, 1, 2]) {
      await squares.nth(index).click();
    }

    const status = await statusLocator(page);
    await expect(status).toContainText(/win|winner|draw|tie/i);

    const resetButton = await resetButtonLocator(page);

    await resetButton.click();

    const markedCountAfterReset = await countMarkedSquares(squares);
    expect(markedCountAfterReset).toBe(0);
  });
});
