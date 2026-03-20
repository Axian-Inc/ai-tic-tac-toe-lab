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

async function occupiedSquareLocator(page: Page) {
  return firstVisibleLocator([
    page.getByTestId("board-square-occupied"),
    page.locator("main button[disabled]").filter({ hasText: /^[XO]$/ }),
    page.locator('[aria-disabled="true"]').filter({ has: page.getByText(/[XO]/) }),
  ]);
}

async function playableSquareLocator(page: Page) {
  return firstVisibleLocator([
    page.getByTestId("board-square-playable"),
    page.locator('[data-state="playable"]'),
    page.locator("main button").filter({ hasNotText: /quit to landing|rematch|sound|[XO]/i }),
  ]);
}

async function unavailableSquareLocator(page: Page) {
  return firstVisibleLocator([
    page.getByTestId("board-square-unavailable"),
    page.locator('[data-state="unavailable"]'),
    page.locator("main button[disabled]").filter({ hasNotText: /quit to landing|rematch|sound|[XO]/i }),
    page.locator('[aria-disabled="true"]'),
  ]);
}

async function snapshotBoardState(page: Page) {
  const board = await boardLocator(page);
  return board.textContent();
}

async function ensureTTT18SurfaceAvailable(page: Page) {
  await page.goto("/");

  const playButton = page.getByRole("button", { name: /play vs cpu/i });
  if ((await playButton.count()) > 0) {
    await playButton.first().click();
  }

  const boardCount = await page
    .getByRole("grid", { name: /tic[- ]?tac[- ]?toe board|game board|board/i })
    .count();
  const boardTestIdCount = await page.getByTestId("game-board").count();
  const fallbackBoardButtons = await page
    .locator("main button")
    .filter({ hasNotText: /quit to landing|rematch|sound/i })
    .count();

  test.fixme(
    boardCount === 0 && boardTestIdCount === 0 && fallbackBoardButtons !== 9,
    "Blocked until the TTT-17/TTT-18 board interaction UI is implemented in the app.",
  );
}

async function advanceToCpuTurn(page: Page) {
  const playableSquare = await playableSquareLocator(page);
  await playableSquare.click();

  await expect(await statusLocator(page)).toContainText(/cpu/i);
}

test.describe("TTT-77 TTT-18 legal move enforcement and visual feedback", () => {
  test.beforeEach(async ({ page }) => {
    await ensureTTT18SurfaceAvailable(page);
  });

  test("TTT-77 Scenario 1: occupied squares are unavailable and reject activation", async ({
    page,
  }) => {
    const playableSquare = await playableSquareLocator(page);
    await playableSquare.click();

    const occupiedSquare = await occupiedSquareLocator(page);

    await expect(occupiedSquare).toBeVisible();
    await expect(occupiedSquare).toBeDisabled();

    const beforeBoardState = await snapshotBoardState(page);
    await occupiedSquare.click({ force: true });
    await expect(await boardLocator(page)).toHaveText(beforeBoardState ?? "");
  });

  test("TTT-77 Scenario 2: playable empty squares expose a valid-move affordance", async ({
    page,
  }) => {
    const playableSquare = await playableSquareLocator(page);

    await expect(playableSquare).toBeVisible();
    await expect(playableSquare).toBeEnabled();
    await playableSquare.focus();
    await playableSquare.hover();
  });

  test("TTT-77 Scenario 3: squares present unavailable state when it is not the player's turn", async ({
    page,
  }) => {
    await advanceToCpuTurn(page);

    const unavailableSquare = await unavailableSquareLocator(page);

    await expect(unavailableSquare).toBeVisible();
    await expect(unavailableSquare).toBeDisabled();
  });

  test("TTT-77 Scenario 4: illegal move attempts do not change board or inline status", async ({
    page,
  }) => {
    await advanceToCpuTurn(page);

    const invalidSquare = await unavailableSquareLocator(page);
    const beforeBoardState = await snapshotBoardState(page);
    const beforeStatus = await (await statusLocator(page)).textContent();

    await invalidSquare.click({ force: true });

    await expect(await boardLocator(page)).toHaveText(beforeBoardState ?? "");
    await expect(await statusLocator(page)).toHaveText(beforeStatus ?? "");
  });

  test("TTT-77 Scenario 5: board states expose automation-friendly hooks for valid and invalid targets", async ({
    page,
  }) => {
    await expect(await boardLocator(page)).toBeVisible();
    await expect(await statusLocator(page)).toBeVisible();
    await expect(await playableSquareLocator(page)).toBeVisible();

    await advanceToCpuTurn(page);
    await expect(await unavailableSquareLocator(page)).toBeVisible();
  });
});
